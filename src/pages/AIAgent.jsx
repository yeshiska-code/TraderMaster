import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, 
  Send, 
  Brain,
  TrendingUp,
  Target,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: "Analyze my performance", prompt: "Analyze my overall trading performance and identify key areas for improvement." },
  { icon: Target, label: "Best strategies", prompt: "Which of my strategies has been performing the best and why?" },
  { icon: AlertTriangle, label: "Risk analysis", prompt: "Analyze my risk management. Am I taking too much risk?" },
  { icon: Brain, label: "Pattern detection", prompt: "What patterns do you see in my winning vs losing trades?" },
  { icon: Lightbulb, label: "Improvement tips", prompt: "Give me 3 specific actionable tips to improve my trading based on my data." },
];

export default function AIAgent() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: trades = [] } = useQuery({
    queryKey: ['trades'],
    queryFn: () => base44.entities.Trade.filter({}, '-entry_time', 500),
  });

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['aiInsights'],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.AIInsight.filter({ user_id: user?.id }, '-created_date', 10);
    },
    enabled: !!user,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (promptText = input) => {
    if (!promptText.trim() || isLoading) return;

    const userMessage = { role: 'user', content: promptText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Build context from trades
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.net_pnl || 0), 0);
    const wins = closedTrades.filter(t => (t.net_pnl || 0) > 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length * 100).toFixed(1) : 0;
    
    const tradeContext = `
Trading Data Summary:
- Total Trades: ${closedTrades.length}
- Total P&L: $${totalPnL.toFixed(2)}
- Win Rate: ${winRate}%
- Winning Trades: ${wins}
- Losing Trades: ${closedTrades.length - wins}

Recent trades (last 10):
${closedTrades.slice(0, 10).map(t => 
  `- ${t.symbol} | ${t.direction} | P&L: $${(t.net_pnl || 0).toFixed(2)} | ${t.entry_time ? new Date(t.entry_time).toLocaleDateString() : 'N/A'}`
).join('\n')}
    `;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert trading coach and analyst helping a trader improve their performance. 
You have access to their trading data and should provide specific, actionable insights.

${tradeContext}

User Question: ${promptText}

Provide a helpful, specific response based on their actual trading data. Be encouraging but honest. 
Use markdown formatting for better readability. Keep response concise but valuable.`,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            key_insight: { type: "string" },
            action_items: { type: "array", items: { type: "string" } }
          }
        }
      });

      const aiMessage = { 
        role: 'assistant', 
        content: response.response,
        insight: response.key_insight,
        actions: response.action_items
      };
      setMessages(prev => [...prev, aiMessage]);

      // Save insight to database
      if (user && response.key_insight) {
        await base44.entities.AIInsight.create({
          user_id: user.id,
          insight_type: 'performance_analysis',
          category: 'trading',
          title: response.key_insight.slice(0, 100),
          summary: response.key_insight,
          detailed_analysis: response.response,
          recommendations: response.action_items || [],
          priority: 'medium',
          is_actionable: true
        });
        queryClient.invalidateQueries({ queryKey: ['aiInsights'] });
      }
    } catch (error) {
      const errorMessage = { 
        role: 'assistant', 
        content: "I apologize, but I encountered an error analyzing your data. Please try again.",
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleFeedback = async (insight, feedback) => {
    await base44.entities.AIInsight.update(insight.id, { feedback });
    queryClient.invalidateQueries({ queryKey: ['aiInsights'] });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col glass-card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-white">AI Trading Agent</h2>
              <p className="text-xs text-gray-400">Powered by advanced AI</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMessages([])}
            className="text-gray-400"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-6">
                <Brain className="w-10 h-10 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">How can I help you today?</h3>
              <p className="text-gray-400 mb-8 max-w-md">
                Ask me anything about your trading performance, strategies, or get personalized improvement tips.
              </p>
              
              {/* Quick Prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {QUICK_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(item.prompt)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all text-left"
                  >
                    <item.icon className="w-5 h-5 text-violet-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    message.role === 'user' 
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black" 
                      : message.isError 
                      ? "bg-red-500/20 border border-red-500/30"
                      : "bg-white/5 border border-white/10"
                  )}>
                    {message.role === 'user' ? (
                      <p className="text-sm">{message.content}</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        
                        {message.insight && (
                          <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/30">
                            <p className="text-xs text-violet-400 font-medium mb-1">Key Insight</p>
                            <p className="text-sm text-white">{message.insight}</p>
                          </div>
                        )}

                        {message.actions?.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-400 font-medium">Action Items:</p>
                            {message.actions.map((action, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <ChevronRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-300">{action}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
                      <span className="text-sm text-gray-400">Analyzing your data...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask me anything about your trading..."
              className="bg-white/5 border-white/10 focus:border-violet-500/50"
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar - Previous Insights */}
      <div className="lg:w-80 glass-card p-4 overflow-hidden flex flex-col">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          Recent Insights
        </h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin">
          {insightsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-xl bg-white/5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/10 rounded w-full" />
              </div>
            ))
          ) : insights.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-10 h-10 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No insights yet</p>
              <p className="text-xs text-gray-500 mt-1">Start a conversation to generate insights</p>
            </div>
          ) : (
            insights.map((insight) => (
              <div 
                key={insight.id} 
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs",
                      insight.priority === 'high' ? "border-red-500/30 text-red-400" :
                      insight.priority === 'medium' ? "border-amber-500/30 text-amber-400" :
                      "border-gray-500/30 text-gray-400"
                    )}
                  >
                    {insight.category}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        insight.feedback === 'helpful' && "text-emerald-400"
                      )}
                      onClick={() => handleFeedback(insight, 'helpful')}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-6 w-6",
                        insight.feedback === 'not_helpful' && "text-red-400"
                      )}
                      onClick={() => handleFeedback(insight, 'not_helpful')}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-white font-medium mb-1 line-clamp-2">{insight.title}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{insight.summary}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}