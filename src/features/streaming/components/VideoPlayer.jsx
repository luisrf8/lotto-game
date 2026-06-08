import { Panel } from '@/components/ui/Panel'
import { motion } from 'framer-motion'

export const VideoPlayer = ({ title, subtitle }) => {
  return (
    <Panel className="overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative h-48 bg-[radial-gradient(circle_at_10%_10%,rgba(57,255,155,0.24),transparent_38%),radial-gradient(circle_at_80%_10%,rgba(244,199,108,0.28),transparent_35%),linear-gradient(130deg,#0b1325,#0a1e27)] p-4 sm:h-56"
      >
        <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/15 px-2 py-1 text-xs text-red-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
          EN VIVO
        </div>

        <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-lotto-border/80 bg-[#081122]/70 p-3 backdrop-blur-sm">
          <p className="font-heading text-base text-lotto-text">{title}</p>
          <p className="text-sm text-lotto-muted">{subtitle}</p>
        </div>
      </motion.div>
    </Panel>
  )
}
