import './NovaOrb.css'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  /** Spins faster and pulses while the agent is working */
  active?: boolean
}

export function NovaOrb({ size = 'md', active = false }: Props) {
  return (
    <span className={`orb orb--${size}${active ? ' orb--active' : ''}`} aria-hidden="true">
      <span className="orb__glow" />
      <span className="orb__core" />
      <span className="orb__shine" />
    </span>
  )
}
