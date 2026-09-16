const numberFormat = new Intl.NumberFormat('it-IT')
const timeFormat = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' })

export const formatNumber = (value: number) => numberFormat.format(value)

export const formatTime = (iso: string) => timeFormat.format(new Date(iso))

/** "nvidia/nemotron-3-super-120b-a12b:free" -> "nemotron-3-super-120b-a12b" */
export function shortModel(model: string | null | undefined): string {
  if (!model) return 'modello non impostato'
  return model.split('/').pop()!.replace(/:free$/, '')
}

const DAY = 24 * 60 * 60 * 1000

export const DATE_GROUPS = ['Oggi', 'Ieri', 'Ultimi 7 giorni', 'Ultimi 30 giorni', 'Meno recenti'] as const

export function dateGroupIndex(iso: string, now: Date): number {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const time = new Date(iso).getTime()
  if (time >= startOfToday) return 0
  if (time >= startOfToday - DAY) return 1
  if (time >= startOfToday - 7 * DAY) return 2
  if (time >= startOfToday - 30 * DAY) return 3
  return 4
}
