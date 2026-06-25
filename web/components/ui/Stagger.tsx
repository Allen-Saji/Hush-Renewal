"use client";

import { createElement, type ElementType, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

/*
  Stagger primitive. Motivated motion: sequences a set of peers (steps, rows)
  into view so the reader's eye walks them in order, once only. Honors
  reduced-motion by rendering the plain element with no animation.
*/
const containerV: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

export function Stagger({
  children,
  className = "",
  as = "div" as ElementType,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  if (reduce) return createElement(as, { className }, children);

  const M =
    (motion as unknown as Record<string, ElementType>)[as as string] ?? motion.div;
  return (
    <M
      variants={containerV}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </M>
  );
}

export function StaggerItem({
  children,
  className = "",
  y = 10,
  as = "div" as ElementType,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  as?: ElementType;
}) {
  const reduce = useReducedMotion();
  if (reduce) return createElement(as, { className }, children);

  const itemV: Variants = {
    hidden: { opacity: 0, y },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };
  const M =
    (motion as unknown as Record<string, ElementType>)[as as string] ?? motion.div;
  return (
    <M variants={itemV} className={className}>
      {children}
    </M>
  );
}
