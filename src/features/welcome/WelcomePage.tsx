import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Sparkles, Shield, Cpu, Globe } from 'lucide-react';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settings-store';
import { cn } from '@/lib/utils';

interface WelcomePageProps {
  onComplete: () => void;
}

export function WelcomePage({ onComplete }: WelcomePageProps) {
  const t = useT();
  const settings = useSettingsStore();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#020203] isolation-isolate"
    >
      {/* Background Noise/Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.4] mix-blend-overlay pointer-events-none z-10" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      {/* Language Switcher Overlay */}
      <div className="absolute top-10 right-10 z-30 flex items-center gap-4 animate-fade-in">
        <div className="flex glass p-1 rounded-full border-white/10 shadow-2xl">
          <button
            onClick={() => settings.setLanguage('sv')}
            className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-full transition-all duration-500 ${
              settings.language === 'sv' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105' 
                : 'text-white/30 hover:text-white hover:bg-white/5'
            }`}
          >
            SV
          </button>
          <button
            onClick={() => settings.setLanguage('en')}
            className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-full transition-all duration-500 ${
              settings.language === 'en' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105' 
                : 'text-white/30 hover:text-white hover:bg-white/5'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Animated Aurora Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
            rotate: [0, 90, 0],
            x: ['-20%', '20%', '-20%'],
            y: ['-10%', '10%', '-10%'],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[30%] -left-[20%] w-[80%] h-[80%] bg-primary/30 blur-[140px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.2, 0.5, 0.2],
            rotate: [0, -90, 0],
            x: ['20%', '-20%', '20%'],
            y: ['10%', '-10%', '10%'],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[30%] -right-[20%] w-[80%] h-[80%] bg-purple-600/20 blur-[140px] rounded-full"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,2,3,0.9)_100%)]" />
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,black,transparent_85%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center max-w-3xl px-8 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 15, delay: 0.1 }}
          className="mb-10 p-6 rounded-[32px] glass-card border-white/20 shadow-2xl relative group"
        >
          <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-700 animate-pulse" />
          <Zap className="w-16 h-16 text-primary relative z-10 drop-shadow-[0_0_15px_rgba(var(--color-primary),0.8)]" />
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-6 uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/20 drop-shadow-2xl">
            LocalPilot
          </h1>
          <p className="text-lg md:text-2xl font-medium text-white/40 mb-14 leading-relaxed max-w-xl mx-auto italic">
            {t.app.description}
          </p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-4 mb-20"
        >
          {[
            { icon: Shield, text: t.welcome.featurePrivat, color: 'text-blue-400' },
            { icon: Cpu, text: t.welcome.featureLokalt, color: 'text-primary' },
            { icon: Sparkles, text: t.welcome.featureGranser, color: 'text-purple-400' },
            { icon: Globe, text: t.welcome.featureSmart, color: 'text-emerald-400' }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-3 px-6 py-3 rounded-full glass border-white/10 text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all shadow-xl"
            >
              <feature.icon className={cn("w-4 h-4", feature.color)} />
              {feature.text}
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 opacity-50" />
          <Button 
            onClick={onComplete}
            className="h-20 px-14 rounded-full bg-primary text-primary-foreground text-xl font-black uppercase italic tracking-tighter shadow-[0_0_50px_rgba(var(--color-primary),0.4)] hover:shadow-[0_0_80px_rgba(var(--color-primary),0.6)] transition-all duration-500 hover:scale-105 active:scale-95 group relative z-10"
          >
            <span>{t.welcome.button}</span>
            <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
          </Button>
          <p className="mt-6 text-[11px] uppercase tracking-[0.4em] text-white/20 font-black animate-pulse">
            {t.welcome.subtext}
          </p>
        </motion.div>
      </div>

      {/* Corner decorative light */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-gradient-to-br from-primary/10 to-transparent pointer-events-none opacity-50" />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%] bg-gradient-to-tl from-purple-500/10 to-transparent pointer-events-none opacity-50" />
    </motion.div>
  );
}
