"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function MagneticButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.button>) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
    setOffset({ x, y });
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 150, damping: 12 }}
      className={cn(
        // Base pill/color/shadow/hover:scale all come from the shared
        // variant now — only the shine-sweep clipping and the ring are
        // unique here. The ring is scoped to this component specifically
        // (it's the only button placed over unpredictable photo content —
        // this is the app's only usage of MagneticButton) rather than
        // added to the shared "primary" variant, since every other primary
        // button sits on a plain surface and doesn't need it.
        buttonVariants({ variant: "primary", size: "lg" }),
        "relative overflow-hidden ring-2 ring-white/40",
        className,
      )}
      {...props}
    >
      {/* Shine sweep: a soft white band that slides across on hover. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-linear-to-r from-transparent via-white/40 to-transparent"
        initial={{ x: "-20%" }}
        whileHover={{ x: "300%" }}
        transition={{ duration: 0.7, ease: "easeInOut" }}
      />
      <motion.span className="relative">{children}</motion.span>
    </motion.button>
  );
}
