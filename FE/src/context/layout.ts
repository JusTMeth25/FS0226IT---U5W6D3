import { createContext, useContext } from 'react'

export interface LayoutValue {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  openMobileSidebar: () => void
}

export const LayoutContext = createContext<LayoutValue | null>(null)

export function useLayout(): LayoutValue {
  const value = useContext(LayoutContext)
  if (!value) throw new Error('useLayout must be used inside LayoutContext')
  return value
}
