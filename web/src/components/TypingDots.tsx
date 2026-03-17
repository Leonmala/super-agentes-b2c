interface TypingDotsProps {
  color?: string
}

export function TypingDots({ color = '#6B7280' }: TypingDotsProps) {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div
        className="typing-dot w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div
        className="typing-dot w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div
        className="typing-dot w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}
