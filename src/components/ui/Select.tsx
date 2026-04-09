import { cn } from '@/lib/utils'
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>((
  { className, label, error, options, placeholder, ...props },
  ref
) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
    )}
    <select
      ref={ref}
      className={cn(
        'w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
        'appearance-none bg-white cursor-pointer',
        error ? 'border-red-400' : 'border-slate-200 hover:border-slate-300',
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
))

Select.displayName = 'Select'
export default Select
