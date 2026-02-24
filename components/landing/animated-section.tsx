'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100
    }
  }
};

export function FadeInUp({ children, className, delay = 0 }: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeInUpView({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeInUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainerView({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      variants={scaleIn}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleInView({ children, className }: AnimatedSectionProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={scaleIn}
      className={className}
    >
      {children}
    </motion.div>
  );
}
