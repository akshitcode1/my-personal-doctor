import { ReactNode, CSSProperties } from 'react'

interface Props {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

export default function GlassCard({ children, className = '', style, onClick }: Props) {
  return (
    <div
      className={`glass-card ${className}`}
      style={{ padding: '1.25rem 1.5rem', ...style }}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
