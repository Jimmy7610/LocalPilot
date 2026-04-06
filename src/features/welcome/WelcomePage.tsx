import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { Zap, ArrowRight, Sparkles, Shield, Cpu, Globe, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settings-store';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';

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
      className="fixed inset-0 z-[100] bg-[#020203] overflow-hidden selection:bg-primary/30"
    >
      {/* Background Noise/Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.2] mix-blend-overlay pointer-events-none z-10" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      {/* Language Switcher Overlay */}
      <div className="absolute top-8 right-8 z-30">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex glass p-1 rounded-full border-white/10 shadow-2xl scale-90"
        >
          <button
            onClick={() => settings.setLanguage('sv')}
            className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-full transition-all duration-500 ${
              settings.language === 'sv' 
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                : 'text-white/30 hover:text-white hover:bg-white/5'
            }`}
          >
            SV
          </button>
          <button
            onClick={() => settings.setLanguage('en')}
            className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-full transition-all duration-500 ${
              settings.language === 'en' 
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
            : 'text-white/30 hover:text-white hover:bg-white/5'
        }`}
      >
        EN
      </button>
    </motion.div>
  </div>

  {/* Mesh Background */}
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
    <motion.div
      animate={{
        x: ['-25%', '25%', '-25%'],
        y: ['-15%', '15%', '-15%'],
        scale: [1, 1.2, 1],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-primary/15 blur-[160px] rounded-full mix-blend-screen"
    />
    <motion.div
      animate={{
        x: ['20%', '-20%', '20%'],
        y: ['10%', '-10%', '10%'],
      }}
      transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen"
    />
    <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px]" />
  </div>

  {/* Main Layout: Single Screen */}
  <div className="relative z-20 h-full flex flex-col items-center justify-center px-10">
    
    {/* Center High Impact Hero */}
    <div className="flex flex-col items-center max-w-5xl w-full text-center mb-16">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8 relative"
        >
            <div className="absolute inset-0 bg-primary/30 blur-3xl scale-150 animate-pulse" />
            <div className="w-16 h-16 rounded-[24px] glass-card border-white/20 flex items-center justify-center shadow-2xl relative z-10">
                <Zap className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(var(--color-primary),0.6)]" />
            </div>
        </motion.div>

        <div className="space-y-4 mb-10">
            <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="text-7xl md:text-[8rem] font-black tracking-tighter uppercase select-none leading-none"
            >
                <span className="text-shimmer inline-block">
                L<span className="font-serif italic text-[0.65em] tracking-tight lowercase ml-[-0.05em]">ocalPilot</span>
                </span>
            </motion.h1>
            <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="text-lg md:text-xl font-medium text-white/30 max-w-2xl mx-auto italic leading-tight"
            >
                {t.app.description}
            </motion.p>
        </div>

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
        >
          <MagneticButton onClick={onComplete}>
            <span className="flex items-center gap-4">
              {t.welcome.button}
              <ArrowRight className="w-5 h-5" />
            </span>
          </MagneticButton>
        </motion.div>
    </div>

    {/* Bottom Core Pillars: Floating Cards */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {[
            { 
                title: t.welcome.infoPrivacyTitle, 
                icon: Shield,
                color: 'from-blue-500/20 to-blue-600/10'
            },
            { 
                title: t.welcome.infoRAGTitle, 
                icon: Cpu,
                color: 'from-primary/20 to-primary/10'
            },
            { 
                title: t.welcome.infoOllamaTitle, 
                icon: Sparkles,
                color: 'from-purple-500/20 to-purple-600/10'
            }
        ].map((item, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                className="group relative p-6 rounded-[32px] glass-card border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden text-center flex flex-col items-center"
            >
                <div className={cn("absolute inset-0 bg-gradient-to-br -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000", item.color)} />
                <div className="mb-4 w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <item.icon className="w-4 h-4 text-white/30 group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-sm font-bold text-white/50 group-hover:text-white mb-1 tracking-widest uppercase italic">{item.title}</h3>
                <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-primary/40 group-hover:text-primary/70 transition-colors">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Local
                </div>
            </motion.div>
        ))}
    </div>

    {/* Footer Minimal Tags */}
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="absolute bottom-6 flex gap-4 opacity-50"
    >
        {[t.welcome.featurePrivat, t.welcome.featureLokalt, t.welcome.featureGranser, t.welcome.featureSmart].map((f, i) => (
            <div key={i} className="text-[8px] font-black uppercase tracking-[0.3em] text-white/10">
                {f}
            </div>
        ))}
    </motion.div>
  </div>
    </motion.div>
  );
}

// ── Magnetic Button Component ──

function MagneticButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x * 0.4);
    mouseY.set(y * 0.4);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="relative group">
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ x: springX, y: springY }}
        className="relative z-10"
      >
        <Button 
          onClick={onClick}
          className={cn(
            "h-20 px-12 rounded-[28px] bg-primary text-primary-foreground text-xl font-black uppercase italic tracking-tighter transition-all duration-500 relative overflow-hidden",
            "shadow-[0_0_30px_rgba(var(--color-primary),0.3)] hover:shadow-[0_0_60px_rgba(var(--color-primary),0.5)] hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="relative z-10">{children}</span>
        </Button>
      </motion.div>
      
      <motion.div 
         style={{ x: springX, y: springY, opacity: hovered ? 0.6 : 0 }}
         className="absolute inset-x-0 -bottom-4 h-6 bg-primary/40 blur-2xl -z-10 rounded-full transition-opacity duration-500"
      />
    </div>
  );
}
