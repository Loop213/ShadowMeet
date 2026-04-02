import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useCallStore } from "../../store/useCallStore";

function CallNotice() {
  const callNotice = useCallStore((state) => state.callNotice);
  const clearCallNotice = useCallStore((state) => state.clearCallNotice);

  useEffect(() => {
    if (!callNotice) return undefined;
    const timeoutId = window.setTimeout(() => clearCallNotice(), 5200);
    return () => window.clearTimeout(timeoutId);
  }, [callNotice, clearCallNotice]);

  if (!callNotice) return null;

  const isSuccess = callNotice.tone === "emerald";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      className="fixed right-4 top-4 z-[60] w-[min(26rem,calc(100vw-2rem))]"
    >
      <div
        className={`rounded-2xl border p-4 shadow-glow ${
          isSuccess
            ? "border-emerald-400/35 bg-emerald-500/15 text-emerald-100"
            : "border-orange-400/35 bg-slate-950/92 text-slate-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Icon className={`h-5 w-5 ${isSuccess ? "text-emerald-200" : "text-orange-300"}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{callNotice.title}</p>
            <p className="mt-1 text-sm text-slate-300">{callNotice.message}</p>
          </div>
          <button
            type="button"
            onClick={clearCallNotice}
            className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-300"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default CallNotice;
