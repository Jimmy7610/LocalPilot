import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Sparkles, Shield, Cpu, Globe } from 'lucide-react';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settings-store';

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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#020203]"
    >
      {/* Language Switcher Overlay */}
      <div className="absolute top-8 right-8 z-20 flex items-center gap-4 animate-fade-in">
        <div className="flex bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
          <button
            onClick={() => settings.setLanguage('sv')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full transition-all duration-300 ${
              settings.language === 'sv' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            SV
          </button>
          <button
            onClick={() => settings.setLanguage('en')}
            className={`px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full transition-all duration-300 ${
              settings.language === 'en' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            EN
          </button>
        </div>
      </div>
      {/* Animated Aurora Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -80, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-purple-600/10 blur-[120px] rounded-full"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,2,3,0.8)_100%)]" />
      </div>

      {/* Decorative Grid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center max-w-2xl px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl relative group"
        >
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Zap className="w-12 h-12 text-primary relative z-10" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
            LocalPilot
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 leading-relaxed max-w-lg mx-auto">
            {t.app.description}
          </p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-16"
        >
          {[
            { icon: Shield, text: t.welcome.featurePrivat },
            { icon: Cpu, text: t.welcome.featureLokalt },
            { icon: Sparkles, text: t.welcome.featureGranser },
            { icon: Zap, text: t.welcome.featureSmart }
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 backdrop-blur-sm">
              <feature.icon className="w-3.5 h-3.5 text-primary" />
              {feature.text}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button 
            onClick={onComplete}
            className="h-16 px-10 rounded-full bg-primary text-primary-foreground text-lg font-bold shadow-[0_0_40px_rgba(var(--primary),0.3)] hover:shadow-[0_0_60px_rgba(var(--primary),0.5)] transition-all duration-300 group"
          >
            <span>{t.welcome.button}</span>
            <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-bold">
            {t.welcome.subtext}
          </p>
        </motion.div>
      </div>

      {/* Side decorative glow */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-purple-500/5 to-transparent pointer-events-none" />
    </motion.div>
  );
}
