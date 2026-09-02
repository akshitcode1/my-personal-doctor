import { ReactNode, ButtonHTMLAttributes } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'default' | 'primary' | 'danger'
}

export default function GlassButton({ children, variant = 'default', className = '', ...rest }: Props) {
  const variantClass = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : ''
  return (
    <button className={`btn-glass ${variantClass} ${className}`} {...rest}>
      {children}
    </button>
  )
}
