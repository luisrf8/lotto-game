export const Panel = ({ children, className = '' }) => {
  return (
    <section
      className={`h-screen rounded-xl border border-lotto-border bg-lotto-panel shadow-sm ${className}`.trim()}
    >
      {children}
    </section>
  )
}
