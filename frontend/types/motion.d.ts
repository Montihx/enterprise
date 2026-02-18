// Framer Motion v11 + React 19 compatibility
// This allows using motion.div, motion.span etc. without 'as any' casts
import { HTMLMotionProps } from 'framer-motion';

declare module 'framer-motion' {
  interface MotionProps extends Partial<React.HTMLAttributes<HTMLElement>> {}
}
