/**
 * Desenho da peça para as bolinhas de categoria: blusa mostra só uma blusa, calça só uma calça.
 * O nome da categoria vem do painel (com ou sem acento, no singular ou no plural), então a busca é por pedaço do nome.
 */
export type CategoryKind = 'blusa' | 'body' | 'calca' | 'vestido' | 'macacao' | 'conjunto' | 'combo' | 'saia' | 'short'

const kinds: [CategoryKind, RegExp][] = [
  // Vestido primeiro: "Vestido macaquinho" é vestido, não macacão.
  ['vestido', /vestid/],
  ['macacao', /macac|macaquinho/],
  ['conjunto', /conjunt/],
  ['combo', /combo|kit/],
  ['body', /body|bodies/],
  ['blusa', /blus|camis|cropped|top/],
  ['calca', /calc|pantalona|legging/],
  ['saia', /saia/],
  ['short', /short|bermuda/]
]

export const categoryKind = (category: string): CategoryKind | undefined => {
  const name = category.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return kinds.find(([, pattern]) => pattern.test(name))?.[0]
}

/** Traço fino em 64×64, sem preenchimento, com costuras, bolsos e barras para cada peça ser reconhecida de longe. */
const drawings: Record<CategoryKind, string[]> = {
  blusa: [
    'M23 10L13 14L6 25L13 30L17 26V55H47V26L51 30L58 25L51 14L41 10',
    'M23 10C26 8 38 8 41 10',
    'M23 10C26 15 38 15 41 10',
    'M8.5 23L15 27.5',
    'M55.5 23L49 27.5',
    'M17 51H47',
    'M32 20.5A0.6 0.6 0 1 0 32 21.7A0.6 0.6 0 1 0 32 20.5',
    'M32 28.5A0.6 0.6 0 1 0 32 29.7A0.6 0.6 0 1 0 32 28.5',
    'M32 36.5A0.6 0.6 0 1 0 32 37.7A0.6 0.6 0 1 0 32 36.5'
  ],
  body: [
    'M22 6V16',
    'M42 6V16',
    'M22 16C22 24 31 25 32 20C33 25 42 24 42 16',
    'M22 16C19 20 18 24 19 30C20 36 20 40 18 44',
    'M42 16C45 20 46 24 45 30C44 36 44 40 46 44',
    'M18 44C24 46 28 50 29 56H35C36 50 40 46 46 44',
    'M21.5 27C28 29 36 29 42.5 27'
  ],
  calca: [
    'M19 8H45L48 58H36L32 24L28 58H16Z',
    'M19 13H45',
    'M32 13V24',
    'M24 8V13',
    'M40 8V13',
    'M21 13C22 18 24 20 27 20',
    'M43 13C42 18 40 20 37 20',
    'M16.2 55H28.4',
    'M35.6 55H47.8'
  ],
  vestido: [
    'M24 5V12',
    'M40 5V12',
    'M24 12L32 20L40 12',
    'M24 12C22 16 22 22 24 28',
    'M40 12C42 16 42 22 40 28',
    'M24 28H40',
    'M24 31H40',
    'M24 31L19 44H45L40 31',
    'M19 44L13 58H51L45 44',
    'M28 34L27 41',
    'M32 34V41',
    'M36 34L37 41',
    'M22 48L20 55',
    'M32 48V55',
    'M42 48L44 55'
  ],
  macacao: [
    'M25 5V11',
    'M39 5V11',
    'M25 11C28 15 36 15 39 11',
    'M25 11C22 15 21 20 22 27',
    'M39 11C42 15 43 20 42 27',
    'M22 27H42',
    'M22 30H42',
    'M22 30L17 59H29L32 40L35 59H47L42 30',
    'M32 30V40'
  ],
  conjunto: [
    'M25 6L16 9L10 18L16 22L19 19V28H45V19L48 22L54 18L48 9L39 6',
    'M25 6C28 4 36 4 39 6',
    'M25 6C28 11 36 11 39 6',
    'M12 16L17.5 20',
    'M52 16L46.5 20',
    'M21 34H43L48 58H16Z',
    'M21 38H43',
    'M26 38L24 58',
    'M32 38V58',
    'M38 38L40 58'
  ],
  combo: [
    'M14 22H50L47 58H17Z',
    'M24 22V16C24 8 40 8 40 16V22',
    'M14.4 27H49.6',
    'M32 49C26 44 24 41 27 38C29 36 31 37 32 39C33 37 35 36 37 38C40 41 38 44 32 49Z'
  ],
  saia: [
    'M22 12H42V18H22Z',
    'M22 18L12 54C22 57 42 57 52 54L42 18',
    'M28 18L24 55.6',
    'M36 18L40 55.6',
    'M32 18V56'
  ],
  short: [
    'M17 14H47L51 44L36 47L32 27L28 47L13 44Z',
    'M17 19H47',
    'M32 19V27',
    'M19 19C20 23 22 25 25 25',
    'M45 19C44 23 42 25 39 25',
    'M13.5 40L28.6 43',
    'M35.4 43L50.5 40'
  ]
}

const CategoryIcon = ({ kind }: { kind: CategoryKind }) => (
  <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {drawings[kind].map((path) => <path key={path} d={path} />)}
  </svg>
)

export default CategoryIcon
