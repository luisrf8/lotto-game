export const Panel = ({ children, className = '' }) => {
  return (
    <section
      className={`rounded-xl border border-lotto-border bg-lotto-panel/80 backdrop-blur-sm ${className}`.trim()}
    >
      {children}
    </section>
  )
}
