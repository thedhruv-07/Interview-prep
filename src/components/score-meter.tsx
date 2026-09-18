"use client";

import { motion } from "motion/react";

// A ratio-against-a-limit (score / 100) reads better as a meter than plain
// text. Track stays a flat tint (not a severity ramp) — only the fill picks
// up the brand gradient, so the meter reads as "how full" without also
// implying good/bad via color.
export function ScoreMeter({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-primary/15">
        <motion.div
          className="h-full rounded-full bg-gradient-brand"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  );
}
