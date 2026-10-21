// Shared class names for elements that are not wrapped in a component
// (e.g. <Link> styled as a button, or native inputs).

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-dark disabled:cursor-not-allowed disabled:opacity-60'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-cocoa text-cream hover:bg-cocoa-light',
  secondary: 'border border-cocoa/20 bg-white hover:bg-cream-dark',
  ghost: 'hover:bg-cream-dark',
  danger: 'bg-red-700 text-white hover:bg-red-800',
}

export const buttonClass = (variant: ButtonVariant = 'primary', size: 'sm' | 'md' = 'md') =>
  `${buttonBase} ${buttonVariants[variant]} ${size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-2.5 text-sm'}`

export const inputClass = (invalid?: boolean) =>
  `block w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-cocoa placeholder:text-cocoa-light/60 focus:outline-2 focus:outline-offset-0 disabled:bg-cream-dark/50 ${
    invalid ? 'border-red-500 focus:outline-red-500' : 'border-cocoa/20 focus:outline-rose-dark'
  }`
