/**
 * Sugere as cores de uma peça a partir da foto, no próprio navegador (sem serviço externo).
 * As fotos da loja mostram a modelo inteira, então a conta:
 *   - olha o meio da foto, onde fica a roupa;
 *   - desconta o fundo (os tons que dominam as bordas da foto);
 *   - desconta tons de pele, quando sobra outra coisa;
 *   - devolve até 3 cores, da que mais aparece para a que menos aparece.
 * É sugestão: a dona toca na certa e confere antes de salvar.
 */

export type DetectedColor = { name: string; hex: string }

/** Nomes que a loja usa. Alguns têm mais de um tom de referência (claro e escuro). */
export const COLOR_NAMES: DetectedColor[] = [
  { name: 'Preto', hex: '#1c1c1c' },
  { name: 'Branco', hex: '#f7f7f5' },
  { name: 'Off-white', hex: '#ede6d6' },
  { name: 'Cinza', hex: '#8e8e8e' },
  { name: 'Cinza', hex: '#5f5f5f' },
  { name: 'Bege', hex: '#d8c3a5' },
  { name: 'Nude', hex: '#e3bfa3' },
  { name: 'Caramelo', hex: '#b5763b' },
  { name: 'Marrom', hex: '#6b4226' },
  { name: 'Marrom', hex: '#4a3426' },
  { name: 'Terracota', hex: '#b5543c' },
  { name: 'Terracota', hex: '#d0552f' },
  { name: 'Vinho', hex: '#6d1f2f' },
  { name: 'Vinho', hex: '#3d0f1a' },
  { name: 'Vermelho', hex: '#c62828' },
  { name: 'Rosa', hex: '#f1a7b8' },
  { name: 'Pink', hex: '#e0457b' },
  { name: 'Pink', hex: '#a01060' },
  { name: 'Lilás', hex: '#c3a6d8' },
  { name: 'Lilás', hex: '#b473b6' },
  { name: 'Roxo', hex: '#6a3d9a' },
  { name: 'Azul-marinho', hex: '#1f2a44' },
  { name: 'Azul', hex: '#2f6fd6' },
  { name: 'Azul', hex: '#1a4f8f' },
  { name: 'Azul-claro', hex: '#9cc7ec' },
  { name: 'Verde-água', hex: '#8fd3c1' },
  { name: 'Verde', hex: '#2e8b57' },
  { name: 'Verde-militar', hex: '#556b2f' },
  { name: 'Verde-militar', hex: '#7a7a4a' },
  { name: 'Amarelo', hex: '#f2c84b' },
  { name: 'Mostarda', hex: '#c9a227' },
  { name: 'Laranja', hex: '#ef7d32' }
]

/** Paleta do painel: um tom por nome, na ordem da lista. */
export const STORE_COLORS: DetectedColor[] = COLOR_NAMES.filter((color, index, all) =>
  all.findIndex((other) => other.name === color.name) === index)

const normalizeName = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[-\s]+/g, ' ').trim()

/** Cor da paleta com esse nome ("Azul Marinho" e "azul-marinho" contam como a mesma). */
export const findStoreColor = (name: string): DetectedColor | undefined =>
  name.trim() ? STORE_COLORS.find((color) => normalizeName(color.name) === normalizeName(name)) : undefined

type Rgb = [number, number, number]
type Group = { count: number; r: number; g: number; b: number }

const toRgb = (hex: string): Rgb => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as Rgb

const toHex = ([r, g, b]: Rgb) => `#${[r, g, b].map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`

/** Cor na escala Lab, onde a distância entre dois tons segue o que o olho percebe. */
const toLab = (hex: string): Rgb => {
  const [r, g, b] = toRgb(hex).map((value) => {
    const channel = value / 255
    return channel > 0.04045 ? ((channel + 0.055) / 1.055) ** 2.4 : channel / 12.92
  })
  const pivot = (value: number) => (value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116)
  const x = pivot((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047)
  const y = pivot(r * 0.2126 + g * 0.7152 + b * 0.0722)
  const z = pivot((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

const PALETTE = COLOR_NAMES.map((color) => ({ name: color.name, lab: toLab(color.hex) }))

/** Nome da loja mais parecido com o tom. */
export const nearestColorName = (hex: string): string => {
  const [l, a, b] = toLab(hex)
  let best = PALETTE[0]
  let bestDistance = Infinity
  PALETTE.forEach((candidate) => {
    const distance = (l - candidate.lab[0]) ** 2 + (a - candidate.lab[1]) ** 2 + (b - candidate.lab[2]) ** 2
    if (distance < bestDistance) {
      bestDistance = distance
      best = candidate
    }
  })
  return best.name
}

/** Regra clássica de tom de pele em RGB (deixa de fora brancos e cremes bem claros). */
const isSkin = (r: number, g: number, b: number) =>
  r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 15 && r - b < 150 && g > b * 0.9 &&
  Math.max(r, g, b) - Math.min(r, g, b) > 15 && !(r > 220 && g > 200 && b > 190)

/** Tons parecidos caem no mesmo grupo (8 níveis por canal). */
const groupKey = (r: number, g: number, b: number) => ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5)

/**
 * Até `limit` cores de uma imagem já reduzida (RGBA, `size` x `size`), sem repetir nome.
 * Exportada para teste; no painel quem chama é `detectColors`.
 */
export const rankColors = (pixels: Uint8ClampedArray, size: number, limit = 3): DetectedColor[] => {
  const border = new Map<number, number>()
  let borderTotal = 0
  const clothes = new Map<number, Group>()
  const withSkin = new Map<number, Group>()
  const add = (groups: Map<number, Group>, key: number, r: number, g: number, b: number) => {
    const group = groups.get(key) || { count: 0, r: 0, g: 0, b: 0 }
    group.count += 1
    group.r += r
    group.g += g
    group.b += b
    groups.set(key, group)
  }
  const edge = Math.max(1, Math.round(size * 0.08))
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4
      if (pixels[index + 3] < 128) continue // fundo transparente de PNG
      const r = pixels[index]
      const g = pixels[index + 1]
      const b = pixels[index + 2]
      const key = groupKey(r, g, b)
      if (x < edge || x >= size - edge || y < edge) {
        border.set(key, (border.get(key) || 0) + 1)
        borderTotal += 1
      }
      // Meio da foto: 30% da largura e o trecho entre 25% e 75% da altura.
      if (x >= size * 0.35 && x < size * 0.65 && y >= size * 0.25 && y < size * 0.75) {
        add(withSkin, key, r, g, b)
        if (!isSkin(r, g, b)) add(clothes, key, r, g, b)
      }
    }
  }
  const background = new Set(Array.from(border).filter(([, count]) => count / borderTotal > 0.04).map(([key]) => key))
  const pick = (groups: Map<number, Group>) => {
    const picks: DetectedColor[] = []
    Array.from(groups)
      .filter(([key]) => !background.has(key))
      .sort((first, second) => second[1].count - first[1].count)
      .some(([, group]) => {
        const hex = toHex([group.r / group.count, group.g / group.count, group.b / group.count])
        const name = nearestColorName(hex)
        if (!picks.some((color) => color.name === name)) picks.push({ name, hex })
        return picks.length >= limit
      })
    return picks
  }
  // Peça cor de pele (nude, caramelo) some no filtro de pele: aí vale a conta sem ele.
  const picks = pick(clothes)
  return picks.length ? picks : pick(withSkin)
}

const SAMPLE_SIZE = 64

/** Lê a foto e sugere até 3 cores. Nunca trava o envio: se não conseguir, devolve lista vazia. */
export const detectColors = async (file: File): Promise<DetectedColor[]> => {
  if (typeof createImageBitmap !== 'function') return []
  try {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const context = canvas.getContext('2d')
    if (!context) return []
    context.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    bitmap.close()
    return rankColors(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data, SAMPLE_SIZE)
  } catch {
    return []
  }
}
