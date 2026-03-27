import seoDirectorImg from "@/assets/mascot-seo-director.png";
import semDirectorImg from "@/assets/mascot-sem-director.png";
import contentCreatorImg from "@/assets/mascot-content-creator.png";
import { motion } from "framer-motion";

export type MascotRole = "seo" | "sem" | "content";

interface MascotInfo {
  name: string;
  role: string;
  img: string;
  accent: string;
  bgGradient: string;
}

export const MASCOTS: Record<MascotRole, MascotInfo> = {
  seo: {
    name: "Sera",
    role: "SEO Director",
    img: seoDirectorImg,
    accent: "text-primary",
    bgGradient: "from-primary/10 via-violet-500/5 to-transparent",
  },
  sem: {
    name: "Max",
    role: "SEM Director",
    img: semDirectorImg,
    accent: "text-seo-primary",
    bgGradient: "from-seo-primary/10 via-primary/5 to-transparent",
  },
  content: {
    name: "Kai",
    role: "Content Creator",
    img: contentCreatorImg,
    accent: "text-content-primary",
    bgGradient: "from-content-primary/10 via-violet-500/5 to-transparent",
  },
};

/* ─── Hero Banner: full cast for Dashboard ─── */
export function MascotHeroBanner({
  greeting,
  subtitle,
}: {
  greeting: string;
  subtitle: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/8 via-violet-500/5 to-seo-primary/8 border border-border/40 p-6 lg:p-8">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)",
        backgroundSize: "24px 24px",
      }} />

      <div className="relative flex items-center gap-6 lg:gap-8">
        {/* Cast avatars */}
        <div className="hidden sm:flex items-end -space-x-6">
          {(["seo", "sem", "content"] as MascotRole[]).map((role, i) => {
            const m = MASCOTS[role];
            return (
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative group"
                style={{ zIndex: 3 - i }}
              >
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="h-28 w-28 lg:h-32 lg:w-32 overflow-hidden shrink-0 drop-shadow-xl group-hover:drop-shadow-2xl transition-all duration-300 group-hover:scale-105">
                    <img
                      src={m.img}
                      alt={`${m.name} – ${m.role}`}
                      className="h-full w-full object-cover object-top"
                      width={1024}
                      height={1024}
                    />
                  </div>
                  {/* Name tag */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-card border border-border/50 rounded-full px-2 py-0.5 shadow-sm text-muted-foreground">
                      {m.name}
                    </span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl lg:text-2xl font-bold tracking-tight text-foreground"
          >
            {greeting}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="text-sm text-muted-foreground mt-1 max-w-xl"
          >
            {subtitle}
          </motion.p>
        </div>
      </div>
    </div>
  );
}

/* ─── Section Header: single mascot per module ─── */
export function MascotSectionHeader({
  role,
  title,
  subtitle,
  children,
}: {
  role: MascotRole;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  const m = MASCOTS[role];

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${m.bgGradient} border border-border/30 p-4 lg:p-5`}>
      <div className="relative flex items-center gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="h-16 w-16 lg:h-20 lg:w-20 overflow-hidden shrink-0 drop-shadow-lg">
              <img
                src={m.img}
                alt={`${m.name} – ${m.role}`}
                className="h-full w-full object-cover object-top"
                loading="lazy"
                width={1024}
                height={1024}
              />
            </div>
          </motion.div>
        </motion.div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${m.accent} bg-card border border-border/40 rounded-full px-2 py-0.5`}>
              {m.role}
            </span>
          </div>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Empty State with mascot ─── */
export function MascotEmptyState({
  role,
  title,
  description,
  action,
}: {
  role: MascotRole;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  const m = MASCOTS[role];

  return (
    <div className="flex flex-col items-center py-16 text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-28 w-28 overflow-hidden mx-auto mb-4 drop-shadow-xl">
            <img
              src={m.img}
              alt={m.name}
              className="h-full w-full object-cover object-top"
              loading="lazy"
              width={1024}
              height={1024}
            />
          </div>
        </motion.div>
      </motion.div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}

/* ─── Contextual Banner: event-driven mascot message ─── */
export function MascotBanner({
  role,
  message,
  type = "info",
  onDismiss,
}: {
  role: MascotRole;
  message: string;
  type?: "info" | "success" | "alert";
  onDismiss?: () => void;
}) {
  const m = MASCOTS[role];
  const borderColor = type === "success" ? "border-l-emerald-500" : type === "alert" ? "border-l-amber-500" : "border-l-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`flex items-center gap-3 rounded-xl border ${borderColor} border-l-4 bg-card/80 backdrop-blur-sm p-3 shadow-sm`}
    >
      <div className="h-10 w-10 rounded-lg bg-muted/30 overflow-hidden shrink-0">
        <img src={m.img} alt={m.name} className="h-full w-full object-cover object-top" loading="lazy" width={512} height={512} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground leading-relaxed">{message}</p>
        <span className={`text-[9px] font-bold uppercase tracking-wider ${m.accent}`}>{m.name} · {m.role}</span>
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground transition-colors text-xs px-2 py-1 rounded hover:bg-muted/50">
          Dismiss
        </button>
      )}
    </motion.div>
  );
}
