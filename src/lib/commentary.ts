// ───────────────────────────────────────────────────────────────────────────
// "AI" analysis for the prototype.
//
// IMPORTANT ARCHITECTURE NOTE: every figure here is computed in code (in
// periods.ts) and merely *narrated* below. The LLM never does arithmetic. In
// production this file becomes a prompt template: the structured facts (deltas,
// dominant lever, movers, margin, flags) are passed to the model, which returns
// prose — but the numbers it quotes are always the ones we computed and handed
// it, so they can never drift from the dashboard. This function is a faithful
// stand-in for that narration step using the real on-screen numbers.
// ───────────────────────────────────────────────────────────────────────────

import type { PeriodTotals, SpineDecomposition } from '../types'
import { fmtMoney, fmtPct, fmtPctChange, magnitudeWord } from './format'
import { topMovers, topReferrerShift } from './periods'

export const AI_DISCLAIMER =
  'AI-generated observations and suggestions — act on them only with human judgement and confidence in the proposal.'

export interface Analysis {
  read: string[] // the written read on the numbers (paragraphs)
  suggestions: string[] // 2–3 suggested optimisations
}

const LEVER_READ = {
  traffic: {
    noun: 'traffic',
    metric: 'sessions',
    diagnosis:
      'This is a traffic problem, not a store problem: people who arrived still bought at the usual rate and spent the usual amount.',
  },
  conversion: {
    noun: 'conversion',
    metric: 'conversion rate',
    diagnosis:
      'This is a conversion problem: traffic showed up but fewer visitors completed checkout — worth checking the funnel, page speed, and any recent theme or pricing change.',
  },
  basket: {
    noun: 'basket size',
    metric: 'AOV',
    diagnosis:
      'This is a basket problem: similar traffic and conversion, but each order was worth less — check discount depth, bundle mix, and shipping thresholds.',
  },
} as const

export function buildAnalysis(
  current: PeriodTotals,
  base: PeriodTotals,
  spine: SpineDecomposition,
  baseLabel: string,
): Analysis {
  const read: string[] = []
  const suggestions: string[] = []

  const lever = LEVER_READ[spine.dominant]
  const revWord = spine.revenueChange === null ? '' : magnitudeWord(spine.revenueChange)
  const dir =
    spine.revenueChange === null
      ? 'is flat'
      : spine.revenueChange < 0
        ? `is down ${revWord}`
        : `is up ${revWord}`

  // Paragraph 1 — the spine read.
  read.push(
    `Net revenue of ${fmtMoney(current.netRevenue)} ${dir} versus the ${baseLabel} baseline (${fmtPctChange(
      spine.revenueChange,
    )}). Decomposing the move, ${lever.noun} is the dominant lever — ${lever.metric} ${fmtPctChange(
      spine.dominant === 'traffic'
        ? spine.sessionsChange
        : spine.dominant === 'conversion'
          ? spine.crChange
          : spine.aovChange,
    )} — while the other two levers were comparatively steady (conversion ${fmtPctChange(
      spine.crChange,
    )}, basket ${fmtPctChange(spine.aovChange)}). ${lever.diagnosis}`,
  )

  // Paragraph 2 — gross profit & margin, with the COGS flag if relevant.
  const marginLine =
    current.missingCogsProductCount > 0
      ? `Gross profit reads ${fmtMoney(current.grossProfit)} at a ${fmtPct(
          current.grossMargin,
        )} margin, but treat this as partial — ${current.missingCogsProductCount} product${
          current.missingCogsProductCount > 1 ? 's are' : ' is'
        } missing a unit cost in Shopify, so their COGS counts as zero and margin is flattered.`
      : `Gross profit is ${fmtMoney(current.grossProfit)} at a healthy ${fmtPct(current.grossMargin)} margin.`
  read.push(marginLine)

  // Paragraph 3 — movers.
  const movers = topMovers(current, base)
  const up = movers.find((m) => m.change > 0.12)
  const down = movers.find((m) => m.change < -0.12)
  const refShift = topReferrerShift(current, base)
  const moverBits: string[] = []
  if (up) moverBits.push(`${up.name} bucked the trend (${fmtPctChange(up.change)})`)
  if (down) moverBits.push(`${down.name} fell hardest (${fmtPctChange(down.change)})`)
  if (refShift && Math.abs(refShift.change) > 0.15)
    moverBits.push(`${refShift.name} referrals moved ${fmtPctChange(refShift.change)}`)
  if (moverBits.length) read.push('At the product and source level: ' + moverBits.join('; ') + '.')

  // Suggestions — keyed off the dominant lever, referencing the real shift.
  if (spine.dominant === 'traffic') {
    if (refShift && refShift.change < -0.15)
      suggestions.push(
        `${refShift.name} drove most of the traffic loss. Check whether a scheduled post or paid campaign lapsed, and whether the daily send went out on time.`,
      )
    suggestions.push(
      'Conversion and basket are healthy, so recovered traffic should convert at the usual rate — prioritise getting sessions back over touching the funnel.',
    )
    if (up)
      suggestions.push(
        `${up.name} is over-indexing — consider featuring it in today's email and on the homepage while demand is hot.`,
      )
  } else if (spine.dominant === 'conversion') {
    suggestions.push(
      'Conversion is the weak lever. Review checkout for friction, confirm no theme/app deploy landed yesterday, and check mobile page-speed.',
    )
    suggestions.push('Traffic held, so small funnel wins translate directly to revenue at current volume.')
  } else {
    suggestions.push(
      'Basket size is the weak lever. Look at discount depth and whether a higher-AOV bundle slipped in merchandising.',
    )
    suggestions.push('Consider a free-shipping threshold just above current AOV to nudge order value.')
  }
  if (current.missingCogsProductCount > 0)
    suggestions.push(
      `Add unit costs for the ${current.missingCogsProductCount} flagged product${
        current.missingCogsProductCount > 1 ? 's' : ''
      } in Shopify so gross-profit and margin stop being understated.`,
    )

  return { read, suggestions: suggestions.slice(0, 3) }
}
