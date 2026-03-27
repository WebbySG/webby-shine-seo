import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mascotImg from "@/assets/mascot-idle.png";
import { X, Minimize2, Sparkles, ChevronUp } from "lucide-react";

interface MascotMessage {
  id: string;
  text: string;
  type: "info" | "celebration" | "alert" | "tip";
}

const TIPS: MascotMessage[] = [
  { id: "t1", text: "I noticed 3 high-priority opportunities waiting for review.", type: "info" },
  { id: "t2", text: "Your latest audit found 2 critical issues. Want to see them?", type: "alert" },
  { id: "t3", text: "Tip: Service pages should be created before blog content for best ROI.", type: "tip" },
  { id: "t4", text: "Great work! 2 briefs were approved this week. 🎉", type: "celebration" },
  { id: "t5", text: "Your competitor added 3 new pages last week. Check the benchmark.", type: "info" },
];

const TYPE_STYLES = {
  info: "border-primary/30 bg-primary/5",
  celebration: "border-emerald-500/30 bg-emerald-500/5",
  alert: "border-amber-500/30 bg-amber-500/5",
  tip: "border-violet-500/30 bg-violet-500/5",
};

export function AiMascot() {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % TIPS.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-card border border-border/50 shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
        onClick={() => setIsVisible(true)}
      >
        <Sparkles className="h-5 w-5 text-primary" />
      </motion.button>
    );
  }

  const tip = TIPS[currentTip];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Message bubble */}
      <AnimatePresence mode="wait">
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`w-72 rounded-xl border p-3.5 shadow-lg backdrop-blur-sm ${TYPE_STYLES[tip.type]}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Webby AI</span>
              </div>
              <button onClick={() => setIsExpanded(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{tip.text}</p>
            <div className="flex items-center gap-1 mt-2.5">
              {TIPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all ${i === currentTip ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/20"}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot avatar */}
      <motion.div
        className="relative group cursor-pointer"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        onClick={() => setIsExpanded(!isExpanded)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow ring */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary/30 via-violet-500/20 to-primary/30 blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
        
        <div className="relative h-16 w-16 rounded-full bg-card border-2 border-primary/20 shadow-xl overflow-hidden flex items-center justify-center">
          <img
            src={mascotImg}
            alt="Webby AI Assistant"
            className="h-14 w-14 object-cover object-top"
            loading="lazy"
          />
        </div>

        {/* Status dot */}
        <div className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-card" />

        {/* Minimize button */}
        <button
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-muted border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Minimize2 className="h-2.5 w-2.5 text-muted-foreground" />
        </button>
      </motion.div>
    </div>
  );
}
