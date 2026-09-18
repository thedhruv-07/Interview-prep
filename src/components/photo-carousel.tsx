"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

interface Photo {
  src: string;
  alt: string;
  credit: string;
}

// Free-to-use (Unsplash license: free for commercial use, no attribution
// required) — credits are kept here anyway as a courtesy, not a legal
// requirement.
const PHOTOS: Photo[] = [
  {
    src: "https://images.unsplash.com/photo-1573497620053-ea5300f94f21?fm=jpg&q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0",
    alt: "Two people in a job interview conversation",
    credit: "Christina @ wocintechchat.com",
  },
  {
    src: "https://images.unsplash.com/photo-1698047682091-782b1e5c6536?fm=jpg&q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0",
    alt: "Interviewer shaking hands with a candidate across a table",
    credit: "Resume Genius",
  },
  {
    src: "https://images.unsplash.com/photo-1521791136064-7986c2920216?fm=jpg&q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0",
    alt: "Two people shaking hands after an interview",
    credit: "Cytonn Photography",
  },
  {
    src: "https://images.unsplash.com/photo-1686771416282-3888ddaf249b?fm=jpg&q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0",
    alt: "Interview handshake in front of a laptop",
    credit: "Mina Rad",
  },
];

export function PhotoCarousel({ fill = false }: { fill?: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % PHOTOS.length), 4000);
    return () => clearInterval(id);
  }, []);

  // Two layouts: a standalone card (default) or a full-bleed section
  // background (fill) with a dark scrim so text sitting on top of it stays
  // readable regardless of which of the 4 photos is showing or which theme
  // is active — a plain gradient-clipped heading would camouflage into a
  // busy photo, so callers using fill mode should switch to solid white text.
  return (
    <div className={fill ? "absolute inset-0" : "relative mx-auto mt-16 max-w-3xl"}>
      <div
        className={
          fill
            ? "relative h-full w-full overflow-hidden"
            : "relative h-64 overflow-hidden rounded-2xl border border-border sm:h-80"
        }
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={PHOTOS[index].src}
            alt={PHOTOS[index].alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 h-full w-full object-cover brightness-110"
          />
        </AnimatePresence>
        {/* Lighter, and lower than before (was bg-black/45 — pushed some
            photos into near-solid gray) — text contrast still comes mainly
            from the drop-shadow on the heading/badge, not the scrim alone. */}
        {fill && <div className="absolute inset-0 bg-black/25" />}
      </div>
      <div
        className={
          fill
            ? "absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2"
            : "mt-3 flex items-center justify-center gap-2"
        }
      >
        {PHOTOS.map((photo, i) => (
          <button
            key={photo.src}
            onClick={() => setIndex(i)}
            aria-label={`Show photo ${i + 1}`}
            // 12px visual dot + before:-inset-4 (16px each side) = a real
            // 44px hit target. ring-1 ring-black/30 gives every dot a dark
            // outline so it stays visible against light AND dark parts of
            // whichever photo is showing, not just on a uniformly dark one.
            className={
              "relative h-3 rounded-full ring-1 ring-black/30 transition-all before:absolute before:-inset-4 before:content-[''] " +
              (i === index ? "w-8 bg-white" : "w-3 bg-white/70")
            }
          />
        ))}
      </div>
    </div>
  );
}
