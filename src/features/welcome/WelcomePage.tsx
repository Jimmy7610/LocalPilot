import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Zap, ArrowRight, Sparkles, Shield, Cpu, Globe } from 'lucide-react';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/store/settings-store';
import { cn } from '@/lib/utils';
import { useRef, useState } from 'react';

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
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-[#020203] selection:bg-primary/30"
    >
      {/* Background Noise/Grain Overlay */}
      <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay pointer-events-none z-10" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />

      {/* Language Switcher Overlay */}
      <div className="absolute top-10 right-10 z-30 flex items-center gap-4">
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

      {/* Advanced Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: ['-25%', '25%', '-25%'],
            y: ['-15%', '15%', '-15%'],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary/20 blur-[150px] rounded-full mix-blend-screen"
        />
        <motion.div
          animate={{
            x: ['25%', '-25%', '25%'],
            y: ['15%', '-15%', '15%'],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-600/15 blur-[150px] rounded-full mix-blend-screen"
        />
        <motion.div
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-cyan-500/10 blur-[120px] rounded-full"
        />
        
        {/* Subtle Grid texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent:80%)]" />
      </div>

      {/* Main Content Container */}
      <div className="relative z-20 flex flex-col items-center max-w-4xl px-8 text-center">
        
        {/* Animated Icon Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="mb-12 relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl scale-150 animate-pulse" />
          <div className="w-24 h-24 rounded-[32px] glass-card border-white/20 flex items-center justify-center shadow-2xl relative z-10 group overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
             <Zap className="w-10 h-10 text-primary drop-shadow-[0_0_12px_rgba(var(--color-primary),0.6)] group-hover:scale-110 transition-transform duration-500" />
          </div>
        </motion.div>

        {/* Hero Text Section */}
        <div className="space-y-6 mb-16">
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-7xl md:text-[10rem] font-extrabold tracking-tighter uppercase select-none leading-none"
          >
            <span className="text-shimmer inline-block">
              L<span className="font-serif italic text-[0.75em] tracking-tight lowercase ml-[-0.05em]">ocalPilot</span>
            </span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-2xl font-medium text-white/40 max-w-2xl mx-auto italic leading-tight"
          >
            {t.app.description}
          </motion.p>
        </div>

        {/* Feature Staggered Grid */}
        <div className="flex flex-wrap justify-center gap-3 mb-24">
          {[
            { icon: Shield, text: t.welcome.featurePrivat, delay: 0.4 },
            { icon: Cpu, text: t.welcome.featureLokalt, delay: 0.5 },
            { icon: Sparkles, text: t.welcome.featureGranser, delay: 0.6 },
            { icon: Globe, text: t.welcome.featureSmart, delay: 0.7 }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: feature.delay, duration: 0.5 }}
              whileHover={{ y: -4, backgroundColor: 'rgba(255,255,255,0.08)' }}
              className="px-6 py-3 rounded-2xl glass border-white/5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-3 transition-colors cursor-default"
            >
              <feature.icon className="w-3.5 h-3.5 text-primary" />
              {feature.text}
            </motion.div>
          ))}
        </div>

        {/* Final CTA with Magnetic Effect */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
        >
          <MagneticButton onClick={onComplete}>
            <span className="flex items-center gap-4">
              {t.welcome.button}
              <ArrowRight className="w-6 h-6" />
            </span>
          </MagneticButton>
          
          <motion.p 
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mt-8 text-[10px] font-black uppercase tracking-[0.6em] text-white/10"
          >
            {t.welcome.subtext}
          </motion.p>
        </motion.div>
      </div>

      {/* Ambient corner flares */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(var(--color-primary),0.05)_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(139,92,246,0.05)_0%,transparent_50%)] pointer-events-none" />
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
    // Limit displacement to 25px
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
            "h-24 px-16 rounded-[32px] bg-primary text-primary-foreground text-2xl font-black uppercase italic tracking-tighter transition-all duration-500 relative overflow-hidden",
            "shadow-[0_0_40px_rgba(var(--color-primary),0.3)] hover:shadow-[0_0_80px_rgba(var(--color-primary),0.5)] hover:scale-[1.02] active:scale-[0.98]"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <span className="relative z-10">{children}</span>
        </Button>
      </motion.div>
      
      {/* Dynamic Glow that follows the magnetic pull */}
      <motion.div 
         style={{ x: springX, y: springY, opacity: hovered ? 0.6 : 0 }}
         className="absolute inset-x-0 -bottom-4 h-8 bg-primary/40 blur-2xl -z-10 rounded-full transition-opacity duration-500"
      />
    </div>
  );
}
