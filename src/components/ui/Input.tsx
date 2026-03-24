import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>((
  { className, label, error, icon, ...props },
  ref
) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 placeholder-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
          error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300',
          icon && 'pl-10',
          className
        )}
        {...props}
      />
    </div>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
))

Input.displayName = 'Input'
export default Input
