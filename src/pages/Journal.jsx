import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { 
  Heart, 
  Brain, 
  Battery, 
  Eye, 
  Zap,
  Moon,
  Save,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EMOTIONS = [
  'calm', 'excited', 'anxious', 'fearful', 'confident', 'doubtful', 
  'frustrated', 'patient', 'impatient', 'greedy', 'cautious', 'focused', 
  'distracted', 'tired', 'energized', 'bored', 'motivated'
];

const EXTERNAL_FACTORS = [
  'personal_issues', 'financial_pressure', 'work_stress', 'health_issues',
  'family_matters', 'market_volatility', 'recent_losses', 'recent_wins',
  'news_anxiety', 'fomo'
];

export default function Journal() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Check URL for date param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateParam = params.get('date');
    if (dateParam) {
      setCurrentDate(parseISO(dateParam));
    }
  }, [location]);

  const dateKey = format(currentDate, 'yyyy-MM-dd');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['emotionalLogs', dateKey],
    queryFn: () => base44.entities.EmotionalLog.filter({ date: dateKey }),
  });

  const preSessionLog = logs.find(l => l.log_type === 'pre_session');
  const postSessionLog = logs.find(l => l.log_type === 'post_session');

  const [activeTab, setActiveTab] = useState('pre');
  const [formData, setFormData] = useState({
    log_type: 'pre_session',
    date: dateKey,
    overall_mood: 5,
    energy_level: 5,
    focus_level: 5,
    confidence_level: 5,
    stress_level: 5,
    sleep_quality: 5,
    sleep_hours: 7,
    physical_state: 'good',
    emotions: [],
    external_factors: [],
    pre_session_plan: '',
    session_review: '',
    lessons_learned: '',
    gratitude: '',
    goals_for_tomorrow: ''
  });

  // Load existing log data
  useEffect(() => {
    const log = activeTab === 'pre' ? preSessionLog : postSessionLog;
    if (log) {
      setFormData({
        ...formData,
        ...log,
        log_type: activeTab === 'pre' ? 'pre_session' : 'post_session',
        date: dateKey
      });
    } else {
      setFormData({
        log_type: activeTab === 'pre' ? 'pre_session' : 'post_session',
        date: dateKey,
        overall_mood: 5,
        energy_level: 5,
        focus_level: 5,
        confidence_level: 5,
        stress_level: 5,
        sleep_quality: 5,
        sleep_hours: 7,
        physical_state: 'good',
        emotions: [],
        external_factors: [],
        pre_session_plan: '',
        session_review: '',
        lessons_learned: '',
        gratitude: '',
        goals_for_tomorrow: ''
      });
    }
  }, [activeTab, preSessionLog, postSessionLog, dateKey]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = { ...data, user_id: user.id };
      const existingLog = activeTab === 'pre' ? preSessionLog : postSessionLog;
      if (existingLog) {
        return base44.entities.EmotionalLog.update(existingLog.id, payload);
      }
      return base44.entities.EmotionalLog.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emotionalLogs', dateKey] });
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const toggleEmotion = (emotion) => {
    setFormData(f => ({
      ...f,
      emotions: f.emotions.includes(emotion)
        ? f.emotions.filter(e => e !== emotion)
        : [...f.emotions, emotion]
    }));
  };

  const toggleFactor = (factor) => {
    setFormData(f => ({
      ...f,
      external_factors: f.external_factors.includes(factor)
        ? f.external_factors.filter(e => e !== factor)
        : [...f.external_factors, factor]
    }));
  };

  const goToPrevDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  // Calculate readiness score
  const readinessScore = Math.round(
    (formData.overall_mood + 
     formData.energy_level + 
     formData.focus_level + 
     formData.confidence_level + 
     (10 - formData.stress_level) + 
     formData.sleep_quality) / 6 * 10
  );

  const getReadinessColor = (score) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  const getReadinessLabel = (score) => {
    if (score >= 70) return 'Ready to Trade';
    if (score >= 50) return 'Proceed with Caution';
    return 'Consider Sitting Out';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Trading Journal</h1>
          <p className="text-gray-400 mt-1">Track your mindset and emotional state</p>
        </div>
        
        {/* Date Navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goToPrevDay} className="border-white/10">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 min-w-[180px] text-center">
            <p className="text-white font-medium">{format(currentDate, 'EEEE')}</p>
            <p className="text-sm text-gray-400">{format(currentDate, 'MMMM d, yyyy')}</p>
          </div>
          <Button variant="outline" size="icon" onClick={goToNextDay} className="border-white/10">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Selector */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'pre' ? 'default' : 'outline'}
              onClick={() => setActiveTab('pre')}
              className={cn(
                "flex-1",
                activeTab === 'pre' && "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
              )}
            >
              <Moon className="w-4 h-4 mr-2" />
              Pre-Session
              {preSessionLog && <CheckCircle2 className="w-4 h-4 ml-2 text-emerald-300" />}
            </Button>
            <Button
              variant={activeTab === 'post' ? 'default' : 'outline'}
              onClick={() => setActiveTab('post')}
              className={cn(
                "flex-1",
                activeTab === 'post' && "bg-gradient-to-r from-emerald-500 to-cyan-500 text-black"
              )}
            >
              <Zap className="w-4 h-4 mr-2" />
              Post-Session
              {postSessionLog && <CheckCircle2 className="w-4 h-4 ml-2 text-emerald-300" />}
            </Button>
          </div>

          {/* Form Content */}
          <div className="glass-card p-6 space-y-6">
            {/* Mood & Energy Sliders */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    Overall Mood
                  </Label>
                  <span className="text-lg font-bold text-white">{formData.overall_mood}/10</span>
                </div>
                <Slider
                  value={[formData.overall_mood]}
                  onValueChange={([v]) => setFormData(f => ({ ...f, overall_mood: v }))}
                  max={10}
                  min={1}
                  step={1}
                  className="[&>span:first-child]:bg-white/10 [&>span:first-child>span]:bg-pink-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-amber-400" />
                    Energy Level
                  </Label>
                  <span className="text-lg font-bold text-white">{formData.energy_level}/10</span>
                </div>
                <Slider
                  value={[formData.energy_level]}
                  onValueChange={([v]) => setFormData(f => ({ ...f, energy_level: v }))}
                  max={10}
                  min={1}
                  step={1}
                  className="[&>span:first-child]:bg-white/10 [&>span:first-child>span]:bg-amber-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    Focus Level
                  </Label>
                  <span className="text-lg font-bold text-white">{formData.focus_level}/10</span>
                </div>
                <Slider
                  value={[formData.focus_level]}
                  onValueChange={([v]) => setFormData(f => ({ ...f, focus_level: v }))}
                  max={10}
                  min={1}
                  step={1}
                  className="[&>span:first-child]:bg-white/10 [&>span:first-child>span]:bg-cyan-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-violet-400" />
                    Confidence
                  </Label>
                  <span className="text-lg font-bold text-white">{formData.confidence_level}/10</span>
                </div>
                <Slider
                  value={[formData.confidence_level]}
                  onValueChange={([v]) => setFormData(f => ({ ...f, confidence_level: v }))}
                  max={10}
                  min={1}
                  step={1}
                  className="[&>span:first-child]:bg-white/10 [&>span:first-child>span]:bg-violet-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Stress Level
                  </Label>
                  <span className="text-lg font-bold text-white">{formData.stress_level}/10</span>
                </div>
                <Slider
                  value={[formData.stress_level]}
                  onValueChange={([v]) => setFormData(f => ({ ...f, stress_level: v }))}
                  max={10}
                  min={1}
                  step={1}
                  className="[&>span:first-child]:bg-white/10 [&>span:first-child>span]:bg-red-500"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    Sleep Quality
                  </Label>
                  <span className="text-lg font-bold text-white">{formData.sleep_quality}/10</span>
                </div>
                <Slider
                  value={[formData.sleep_quality]}
                  onValueChange={([v]) => setFormData(f => ({ ...f, sleep_quality: v }))}
                  max={10}
                  min={1}
                  step={1}
                  className="[&>span:first-child]:bg-white/10 [&>span:first-child>span]:bg-indigo-500"
                />
              </div>
            </div>

            {/* Sleep Hours */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Hours of Sleep</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.sleep_hours}
                  onChange={(e) => setFormData(f => ({ ...f, sleep_hours: parseFloat(e.target.value) || 0 }))}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label>Physical State</Label>
                <Select
                  value={formData.physical_state}
                  onValueChange={(v) => setFormData(f => ({ ...f, physical_state: v }))}
                >
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="tired">Tired</SelectItem>
                    <SelectItem value="sick">Sick</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Emotions */}
            <div className="space-y-3">
              <Label>Current Emotions</Label>
              <div className="flex flex-wrap gap-2">
                {EMOTIONS.map(emotion => (
                  <Button
                    key={emotion}
                    type="button"
                    variant={formData.emotions.includes(emotion) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleEmotion(emotion)}
                    className={cn(
                      formData.emotions.includes(emotion) 
                        ? "bg-emerald-500/80 hover:bg-emerald-600 border-0 text-white" 
                        : "text-white"
                    )}
                  >
                    {emotion.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* External Factors */}
            <div className="space-y-3">
              <Label>External Factors Affecting You</Label>
              <div className="flex flex-wrap gap-2">
                {EXTERNAL_FACTORS.map(factor => (
                  <Button
                    key={factor}
                    type="button"
                    variant={formData.external_factors.includes(factor) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleFactor(factor)}
                    className={cn(
                      formData.external_factors.includes(factor) 
                        ? "bg-amber-500/80 hover:bg-amber-600 border-0 text-white" 
                        : "text-white"
                    )}
                  >
                    {factor.replace(/_/g, ' ')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Text Areas */}
            {activeTab === 'pre' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Trading Plan for Today</Label>
                  <Textarea
                    value={formData.pre_session_plan}
                    onChange={(e) => setFormData(f => ({ ...f, pre_session_plan: e.target.value }))}
                    placeholder="What setups are you looking for? What are your rules for today?"
                    className="bg-white/5 border-white/10 min-h-[100px]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Session Review</Label>
                  <Textarea
                    value={formData.session_review}
                    onChange={(e) => setFormData(f => ({ ...f, session_review: e.target.value }))}
                    placeholder="How did the session go? Did you follow your plan?"
                    className="bg-white/5 border-white/10 min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lessons Learned</Label>
                  <Textarea
                    value={formData.lessons_learned}
                    onChange={(e) => setFormData(f => ({ ...f, lessons_learned: e.target.value }))}
                    placeholder="What did you learn today? What will you do differently?"
                    className="bg-white/5 border-white/10 min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gratitude</Label>
                  <Textarea
                    value={formData.gratitude}
                    onChange={(e) => setFormData(f => ({ ...f, gratitude: e.target.value }))}
                    placeholder="What are you grateful for today?"
                    className="bg-white/5 border-white/10 min-h-[80px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Goals for Tomorrow</Label>
                  <Textarea
                    value={formData.goals_for_tomorrow}
                    onChange={(e) => setFormData(f => ({ ...f, goals_for_tomorrow: e.target.value }))}
                    placeholder="What do you want to achieve tomorrow?"
                    className="bg-white/5 border-white/10 min-h-[80px]"
                  />
                </div>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveMutation.isPending ? 'Saving...' : 'Save Journal Entry'}
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Readiness Score */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Trading Readiness</h3>
            <div className="text-center">
              <div className={cn(
                "text-6xl font-bold mb-2",
                getReadinessColor(readinessScore)
              )}>
                {readinessScore}%
              </div>
              <Badge 
                className={cn(
                  "text-sm",
                  readinessScore >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                  readinessScore >= 50 ? "bg-amber-500/20 text-amber-400" :
                  "bg-red-500/20 text-red-400"
                )}
              >
                {getReadinessLabel(readinessScore)}
              </Badge>
            </div>

            {readinessScore < 50 && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400">
                  ⚠️ Your readiness score is low. Consider taking the day off or trading with reduced size.
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Journal Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Pre-Session</span>
                {preSessionLog ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400">Completed</Badge>
                ) : (
                  <Badge className="bg-white/10 text-gray-400">Pending</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Post-Session</span>
                {postSessionLog ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400">Completed</Badge>
                ) : (
                  <Badge className="bg-white/10 text-gray-400">Pending</Badge>
                )}
              </div>
            </div>
          </div>

          {/* AI Insights Placeholder */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h3 className="text-lg font-semibold text-white">AI Insights</h3>
            </div>
            <p className="text-sm text-gray-400">
              Complete your journal entries to receive personalized AI insights about your trading psychology.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}