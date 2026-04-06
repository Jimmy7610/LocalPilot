import { motion } from 'framer-motion';
import { Terminal, ShieldCheck, X, Play, Info, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ActionCardProps {
  title: string;
  description: string;
  code?: string;
  data?: any;
  onApprove: () => void;
  onReject: () => void;
  status?: 'pending' | 'approved' | 'rejected' | 'executing';
}

export function ActionCard({ 
  title, 
  description, 
  code, 
  onApprove, 
  onReject,
  status = 'pending'
}: ActionCardProps) {
  
  const isPending = status === 'pending';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "my-4 overflow-hidden rounded-2xl border transition-all duration-300",
        isPending && "glass border-primary/20 shadow-lg shadow-primary/5",
        isApproved && "bg-success/5 border-success/20 opacity-80",
        isRejected && "bg-destructive/5 border-destructive/20 opacity-50"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-5 py-3 flex items-center justify-between border-b",
        isPending && "bg-primary/5 border-primary/10",
        isApproved && "bg-success/10 border-success/10",
        isRejected && "bg-destructive/10 border-destructive/10"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            isPending && "bg-primary text-primary-foreground shadow-lg shadow-primary/20",
            isApproved && "bg-success text-success-foreground",
            isRejected && "bg-destructive text-destructive-foreground"
          )}>
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest">{title}</h4>
            <div className="flex items-center gap-1.5 mt-0.5 opacity-50">
              <ShieldCheck className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-tighter">Requires Approval</span>
            </div>
          </div>
        </div>
        
        {isApproved && (
           <div className="text-[10px] font-black uppercase text-success tracking-widest italic animate-pulse">
             Verified & Executed
           </div>
        )}
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div className="flex gap-3">
            <Info className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
            <p className="text-sm text-white/70 leading-relaxed italic">{description}</p>
        </div>

        {code && (
          <div className="relative group">
            <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 transition-opacity">
                <Code2 className="w-4 h-4" />
            </div>
            <pre className="p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-xs text-primary leading-normal overflow-x-auto shadow-inner">
              {code}
            </pre>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      {isPending && (
        <div className="px-5 py-4 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReject}
            className="h-9 px-4 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Reject
          </Button>
          <Button
            size="sm"
            onClick={onApprove}
            className="h-9 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Play className="w-4 h-4 mr-2" />
            Approve & Execute
          </Button>
        </div>
      )}
    </motion.div>
  );
}
