import { Product } from '../types/store'

export const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

/** Endereço de uma peça, por exemplo /produto/1-vestido-dress. O número garante o link mesmo se o nome mudar. */
export const getProductPath = (product: Pick<Product, 'id' | 'name'>) => {
  const slug = slugify(product.name)
  return `/produto/${product.id}${slug ? `-${slug}` : ''}`
}

/** Lê o id da peça a partir do caminho da página, ou null quando não é uma página de produto. */
export const getProductIdFromPath = (pathname: string): number | null => {
  const match = pathname.match(/^\/produto\/(\d+)(?:-[^/]*)?\/?$/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export const getProductUrl = (product: Pick<Product, 'id' | 'name'>) =>
  `${window.location.origin}${getProductPath(product)}`
