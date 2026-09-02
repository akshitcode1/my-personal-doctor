interface Props {
  text: string
  isStreaming?: boolean
}

export default function TypewriterText({ text, isStreaming = false }: Props) {
  return (
    <div className="prose" style={{ fontSize: 13.5, lineHeight: 1.7 }}>
      <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
      {isStreaming && (
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: '1em',
            background: 'var(--accent-blue)',
            marginLeft: 2,
            verticalAlign: 'middle',
            animation: 'blink 0.8s step-end infinite',
          }}
        />
      )}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  )
}
