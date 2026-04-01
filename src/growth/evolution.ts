import type { GrowthForm } from './types.js'
import type { CompanionBones, Hat } from '../companion/types.js'

// New hats unlocked at level 10 and 15
export const EVOLVED_HATS: Record<string, Hat[]> = {
  level10: ['crown', 'wizard', 'tophat'],
  level15: ['halo', 'propeller', 'beanie'],
}

// Form-specific sprite decorations applied AFTER base rendering
// These modify the rendered lines to add evolution flair
export function applyFormDecoration(
  lines: string[],
  form: GrowthForm,
  tick: number,
): string[] {
  if (form === 'baby') return lines

  const result = [...lines]

  if (form === 'teen') {
    // Teen: add sparkle on occasional ticks
    if (tick % 8 === 0 && result.length > 0) {
      result[0] = result[0]!.replace(/^(.)/, '·')
    }
  }

  if (form === 'adult') {
    // Adult: add subtle glow markers on sides
    if (result.length >= 3) {
      result[1] = '>' + result[1]!.slice(1)
      result[1] = result[1]!.slice(0, -1) + '<'
    }
  }

  if (form === 'elite') {
    // Elite: side decorations + bottom accent
    if (result.length >= 3) {
      result[1] = '»' + result[1]!.slice(1)
      result[1] = result[1]!.slice(0, -1) + '«'
    }
    if (result.length >= 4) {
      const last = result.length - 1
      result[last] = result[last]!.replace(/^(.)/, '~')
      result[last] = result[last]!.replace(/(.)$/, '~')
    }
  }

  if (form === 'legend') {
    // Legend: full border glow + crown-like top accent
    if (result.length >= 2) {
      result[0] = result[0]!.replace(/^(..)/, '✦ ')
      result[0] = result[0]!.replace(/(..)$/, ' ✦')
    }
    if (result.length >= 3) {
      result[1] = '╟' + result[1]!.slice(1)
      result[1] = result[1]!.slice(0, -1) + '╢'
    }
    if (result.length >= 4) {
      const last = result.length - 1
      result[last] = result[last]!.replace(/^(..)/, '✦ ')
      result[last] = result[last]!.replace(/(..)$/, ' ✦')
    }
  }

  return result
}

// Sleeping animation overlay: replaces eyes with -, adds zzZ
export function applySleepingOverlay(
  lines: string[],
  eye: string,
  tick: number,
): string[] {
  const result = lines.map(l => l.replaceAll(eye, '-'))
  // Float zzZ above
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
  const pad = shift === 1 ? '  ' : ''
  const trim = shift === 3 ? '  ' : ''
  return lines.map(l => {
    if (shift === 1) return pad + l.slice(2)
    return l.slice(0, -2) + trim
  })
}
