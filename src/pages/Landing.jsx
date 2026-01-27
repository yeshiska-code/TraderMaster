import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { 
  TrendingUp, 
  Brain, 
  Target, 
  Shield, 
  Zap, 
  Users, 
  LineChart,
  CheckCircle2,
  ArrowRight,
  Play,
  Star,
  ChevronRight
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';

const features = [
  {
    icon: LineChart,
    title: "Advanced Analytics",
    description: "Deep performance metrics, risk analysis, and pattern recognition powered by cutting-edge algorithms"
  },
  {
    icon: Brain,
    title: "AI Trading Agent",
    description: "Personal AI assistant that analyzes your trades, detects patterns, and provides actionable insights"
  },
  {
    icon: Target,
    title: "Strategy Builder",
    description: "Create, backtest, and optimize trading strategies with our visual rule engine"
  },
  {
    icon: Shield,
    title: "Risk Management",
    description: "Real-time risk monitoring, automated alerts, and drawdown protection systems"
  },
  {
    icon: Users,
    title: "Coaching Platform",
    description: "Connect with mentors, share strategies, and get professional trade reviews"
  },
  {
    icon: Zap,
    title: "Automation Engine",
    description: "Set up automated rules for risk limits, notifications, and trading discipline"
  }
];

const stats = [
  { value: "50K+", label: "Active Traders" },
  { value: "$2.5B+", label: "Trades Analyzed" },
  { value: "98%", label: "Uptime SLA" },
  { value: "4.9/5", label: "User Rating" }
];

const testimonials = [
  {
    quote: "TradeEdge transformed my trading. The AI insights helped me identify weaknesses I never knew existed.",
    author: "Michael Chen",
    role: "Prop Trader, SMB Capital",
    avatar: "MC"
  },
  {
    quote: "The best journaling platform I've used. The analytics are institutional-grade yet easy to understand.",
    author: "Sarah Williams",
    role: "Independent Futures Trader",
    avatar: "SW"
  },
  {
    quote: "Finally, a platform that understands what professional traders need. Worth every penny.",
    author: "David Rodriguez",
    role: "Funded Trader, FTMO",
    avatar: "DR"
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-[200px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-black" />
              </div>
              <span className="font-bold text-xl">TradeEdge</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-400 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition">Pricing</a>
              <a href="#testimonials" className="text-gray-400 hover:text-white transition">Testimonials</a>
            </div>
            
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  Login
                </Button>
              </Link>
              <Link to={createPageUrl('Dashboard')}>
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-gray-300">Now with AI-Powered Insights</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-text">Trade Smarter.</span>
              <br />
              <span className="text-white">Perform Better.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              The ultimate trading journal and analytics platform for serious traders. 
              Track every trade, analyze your edge, and elevate your performance with AI.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={createPageUrl('Dashboard')}>
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold text-lg px-8 py-6 glow-green">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 text-lg px-8 py-6">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0f] via-transparent to-transparent z-10" />
            <div className="glass-card p-2 border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center mb-4">
                    <LineChart className="w-10 h-10 text-emerald-400" />
                  </div>
                  <p className="text-gray-400">Interactive Dashboard Preview</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl lg:text-5xl font-bold gradient-text mb-2">{stat.value}</p>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Everything You Need to <span className="gradient-text">Win</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Professional-grade tools designed for traders who take their craft seriously
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group glass-card p-6 hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:glow-green transition-all">
                  <feature.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">
              Loved by <span className="gradient-text">Traders</span>
            </h2>
            <p className="text-gray-400 text-lg">See what professional traders say about TradeEdge</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center font-bold text-black text-sm">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-violet-500/10" />
            <div className="relative">
              <h2 className="text-4xl lg:text-5xl font-bold mb-4">
                Ready to <span className="gradient-text">Transform</span> Your Trading?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of traders who've already elevated their game with TradeEdge
              </p>
              <Link to={createPageUrl('Dashboard')}>
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-black font-semibold text-lg px-8 py-6">
                  Start Your Free Trial
                  <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-lg">TradeEdge</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition">Privacy</a>
              <a href="#" className="hover:text-white transition">Terms</a>
              <a href="#" className="hover:text-white transition">Support</a>
              <a href="#" className="hover:text-white transition">Contact</a>
            </div>
            <p className="text-sm text-gray-500">© 2024 TradeEdge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}