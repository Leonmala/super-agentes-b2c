export function StreamingCursor({ color = '#2563EB' }: { color?: string }) {
  return (
    <span
      className="inline-block w-1.5 h-4 rounded-sm align-middle ml-0.5 animate-blink"
      style={{ backgroundColor: color }}
    />
  )
}
