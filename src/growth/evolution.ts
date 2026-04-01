import type { GrowthForm } from './types.js'
import type { Hat } from '../companion/types.js'

// New hats unlocked at level 10 and 15
export const EVOLVED_HATS: Record<string, Hat[]> = {
  level10: ['crown', 'wizard', 'tophat'],
  level15: ['halo', 'propeller', 'beanie'],
}

// Form-specific sprite decorations applied AFTER base rendering.
// Each form builds on the previous, making progression visually obvious.
export function applyFormDecoration(
  lines: string[],
  form: GrowthForm,
  eye: string,
  tick: number,
): string[] {
  if (form === 'baby') return lines

  const result = [...lines]
  const last = result.length - 1

  if (form === 'teen') {
    // Teen: eyes become sparkle ✦, occasional star above head
    for (let i = 0; i < result.length; i++) {
      result[i] = result[i]!.replaceAll(eye, '✦')
    }
    if (tick % 6 < 3 && result.length > 0) {
      // Pulsing star above head
      result[0] = result[0]!.replace(/^(.....)/, '  *  ')
    }
  }

  if (form === 'adult') {
    // Adult: wider body with double parentheses on face line,
    // mouth changes to ^^, crown hat forced
    for (let i = 0; i < result.length; i++) {
      // Wrap face/body lines with extra parentheses
      result[i] = result[i]!.replace(/^\s*\(/, '((').replace(/\)\s*$/, '))')
    }
    // Change mouth expression
    for (let i = 0; i < result.length; i++) {
      result[i] = result[i]!.replace('..', '^^').replace('ω', '^^').replace('><', '^^').replace('~~', '^^')
    }
    // Widen the base
    if (last >= 0) {
      result[last] = '=' + result[last]!.slice(1, -1) + '='
    }
  }

  if (form === 'elite') {
    // Elite: side brackets «», wave underline, sparkle eyes
    for (let i = 0; i < result.length; i++) {
      result[i] = result[i]!.replaceAll(eye, '✦')
    }
    // Side decorations on body lines (skip first/last)
    for (let i = 1; i < last; i++) {
      result[i] = '«' + result[i]!.slice(1, -1) + '»'
    }
    // Wave underline below
    if (last >= 0) {
      const width = result[last]!.length
      result.push('~'.repeat(width))
    }
  }

  if (form === 'legend') {
    // Legend: full ✦ border on all lines, gem ears ◆, sparkle eyes
    for (let i = 0; i < result.length; i++) {
      result[i] = result[i]!.replaceAll(eye, '✦')
    }
    // ✦ border on every line
    for (let i = 0; i < result.length; i++) {
      result[i] = '✦' + result[i]!.slice(1, -1) + '✦'
    }
    // Top crown of sparkles
    const width = result[0]?.length ?? 12
    result.unshift(centerText('✦ ✦ ✦', width))
    // Bottom star rating
    result.push(centerText('★★★★★', result[1]?.length ?? 12))
  }

  return result
}

function centerText(text: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2))
  return ' '.repeat(pad) + text + ' '.repeat(Math.max(0, width - pad - text.length))
}

// Sleeping animation overlay: replaces eyes with -, adds zzZ
export function applySleepingOverlay(
  lines: string[],
  eye: string,
  tick: number,
): string[] {
  const result = lines.map(l => l.replaceAll(eye, '-'))
  const zFrames = ['   z        ', '   zZ       ', '   zZz      ']
  const zLine = zFrames[tick % zFrames.length]!
  return [zLine, ...result]
}

// Dancing animation: shift sprite left/right
export function applyDancingOverlay(
  lines: string[],
  tick: number,
): string[] {
  const shift = tick % 4
  if (shift === 0 || shift === 2) return lines
  return lines.map(l => {
    if (shift === 1) return '  ' + l.slice(2)
    return l.slice(0, -2) + '  '
  })
}
