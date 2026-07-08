import { clsx } from 'clsx'

/**
 * Merge class names with clsx. Used across UI components with Tailwind.
 */
export function cn(...inputs) {
  return clsx(inputs)
}
