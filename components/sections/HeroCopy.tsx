"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { Button } from "@/components/ui/Button";

/*
  Hero left column. Mount-staggered entrance that mirrors HeroVisual's timing,
  so headline, subcopy, and CTAs settle in alongside the visual rather than
  appearing flat while the right side animates. Reduced-motion renders static.
*/
export function HeroCopy() {
  const reduce = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: 0.05 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="lg:col-span-7"
    >
      <motion.h1
        variants={item}
        className="max-w-[14ch] text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl"
      >
        Renew SaaS without showing your hand.
      </motion.h1>

      <motion.p
        variants={item}
        className="mt-6 max-w-[48ch] text-lg leading-relaxed text-muted"
      >
        Seal one price each. A neutral matcher clears the overlap on Canton,
        then settles. Nobody sees the other&apos;s number.
      </motion.p>

      <motion.div
        variants={item}
        className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        <Button href="#how">See it clear</Button>
        <Button href="#spec" variant="ghost">
          Read the spec
        </Button>
      </motion.div>
    </motion.div>
  );
}
