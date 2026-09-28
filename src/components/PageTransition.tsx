"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import { usePathname } from "next/navigation";

const variants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.99,
    filter: "blur(4px)",
  },
  enter: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo
    },
    transitionEnd: {
      filter: "none",
      transform: "none",
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.99,
    filter: "blur(2px)",
    transition: {
      duration: 0.18,
      ease: [0.7, 0, 0.84, 0],
    },
  },
};

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="hidden"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
