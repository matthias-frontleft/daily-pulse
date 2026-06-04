import { BRAND } from '../data/mockData'

const sym = BRAND.currencySymbol

/** Money, no decimals for headline figures. */
export function fmtMoney(n: number, decimals = 0): string {
  return (
    sym +
    n.toLocaleString('en-GB', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  )
}

/** Compact money for tight spaces, e.g. £12.4k. */
export function fmtMoneyCompact(n: number): string {
  if (Math.abs(n) >= 1000) return sym + (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return sym + Math.round(n).toLocaleString('en-GB')
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString('en-GB')
}

export function fmtPct(frac: number, decimals = 1): string {
  return (frac * 100).toFixed(decimals) + '%'
}

/** Signed % change, e.g. +4.2% / −17.0%. Uses a real minus sign. */
export function fmtPctChange(frac: number | null, decimals = 1): string {
  if (frac === null) return '—'
  const v = frac * 100
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return sign + Math.abs(v).toFixed(decimals) + '%'
}

/** Magnitude word for narrative, e.g. "sharply", "modestly". */
export function magnitudeWord(frac: number): string {
  const a = Math.abs(frac)
  if (a >= 0.15) return 'sharply'
  if (a >= 0.07) return 'notably'
  if (a >= 0.03) return 'modestly'
  return 'marginally'
}
