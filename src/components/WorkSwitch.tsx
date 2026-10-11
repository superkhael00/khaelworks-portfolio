import { NavLink } from 'react-router-dom'
import { useIsPhone } from '@/hooks/useMediaQuery'

/**
 * Phones and tablets: one "Work" tab covers both portfolios, so the top of
 * Projects and Websites carries a two-way switch between them. Desktop has
 * both in the rail and renders nothing here.
 */
export default function WorkSwitch() {
  const phone = useIsPhone()
  if (!phone) return null
  return (
    <nav className="wswitch" aria-label="Portfolio">
      <NavLink to="/projects" className="wswitch__btn">Automations</NavLink>
      <NavLink to="/websites" className="wswitch__btn">Websites</NavLink>
    </nav>
  )
}
