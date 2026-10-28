import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Product, VariantStock } from '../types/store'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
const productImagesBucket = 'bella-chic-products'
const catalogColumns = 'id,name,category,description,price,old_price,image,images,sizes,size_fit,colors,variant_stock,tag,is_available'

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

type CatalogRow = {
  id: number
  name: string
  category: string
  description: string
  price: number
  old_price: number | null
  image: string
  images: string[] | null
  sizes: string[]
  size_fit: string | null
  colors: Product['colors']
  variant_stock: VariantStock[] | null
  tag: string | null
  is_available: boolean
}

export type CatalogProductInput = Omit<Product, 'id' | 'available'> & {
  available: boolean
  enabled: boolean
  variantStock: VariantStock[]
}

const toProduct = (row: CatalogRow): Product => {
  const variantStock = row.variant_stock || []
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: Number(row.price),
    oldPrice: row.old_price === null ? undefined : Number(row.old_price),
    image: row.image,
    images: row.images?.length ? row.images : undefined,
    sizes: row.sizes,
    sizeFit: row.size_fit || undefined,
    colors: row.colors,
    variantStock,
    tag: row.tag || undefined,
    available: row.is_available && variantStock.some((variant) => variant.quantity > 0),
    enabled: row.is_available
  }
}

const toRow = (product: CatalogProductInput) => ({
  name: product.name,
  category: product.category,
  description: product.description,
  price: product.price,
  old_price: product.oldPrice ?? null,
  image: product.image,
  images: product.images ?? [],
  sizes: product.sizes,
  size_fit: product.sizeFit?.trim() || null,
  colors: product.colors,
  variant_stock: product.variantStock,
  tag: product.tag || null,
  is_available: product.enabled
})

const catalogError = (error: Error) => {
  if (error.message.includes('variant_stock')) {
    return new Error('O controle de estoque ainda não foi configurado. Execute supabase/order-management.sql no SQL Editor.')
  }
  return error
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Configure REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY para carregar o catálogo.')
  }
  return supabase
}

export const fetchCatalogProducts = async (): Promise<Product[]> => {
  const { data, error } = await requireSupabase()
    .from('catalog_products')
    .select(catalogColumns)
    .order('id', { ascending: true })

  if (error) throw catalogError(error)
  return (data as CatalogRow[]).map(toProduct)
}

export const fetchAdminProducts = async (): Promise<Product[]> => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('catalog_products')
    .select(catalogColumns)
    .order('id', { ascending: true })

  if (error) throw catalogError(error)
  return (data as CatalogRow[]).map(toProduct)
}

export const hasCatalogAdminAccess = async (userId: string): Promise<boolean> => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('store_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw catalogError(error)
  return Boolean(data)
}

export const saveCatalogProduct = async (product: CatalogProductInput, id?: number): Promise<Product> => {
  const client = requireSupabase()
  const query = id
    ? client.from('catalog_products').update(toRow(product)).eq('id', id)
    : client.from('catalog_products').insert(toRow(product))
  const { data, error } = await query.select('*').single()

  if (error) throw catalogError(error)
  return toProduct(data as CatalogRow)
}

export const deleteCatalogProduct = async (id: number): Promise<void> => {
  const { error } = await requireSupabase().from('catalog_products').delete().eq('id', id)
  if (error) throw error
}

export const uploadProductImage = async (file: File): Promise<string> => {
  const client = requireSupabase()
  const allowedTypes: Record<string, { extension: string; contentType: string }> = {
    'image/jpeg': { extension: 'jpg', contentType: 'image/jpeg' },
    'image/png': { extension: 'png', contentType: 'image/png' },
    'image/webp': { extension: 'webp', contentType: 'image/webp' }
  }
  const extensionByName: Record<string, { extension: string; contentType: string }> = {
    jpg: { extension: 'jpg', contentType: 'image/jpeg' },
    jpeg: { extension: 'jpg', contentType: 'image/jpeg' },
    png: { extension: 'png', contentType: 'image/png' },
    webp: { extension: 'webp', contentType: 'image/webp' }
  }
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
  const imageType = allowedTypes[file.type] || (!file.type ? extensionByName[fileExtension] : undefined)

  if (!imageType) {
    throw new Error('Formato não permitido. Envie uma imagem PNG, JPG ou WebP.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 5 MB.')
  }

  const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${imageType.extension}`
  const { data, error } = await client.storage
    .from(productImagesBucket)
    .upload(filePath, file, { contentType: imageType.contentType, upsert: false })

  if (error) {
    const message = error.message.toLowerCase()
    if (message.includes('bucket not found')) {
      throw new Error('O armazenamento de imagens ainda não foi configurado. Execute supabase/storage.sql no SQL Editor.')
    }
    if (message.includes('row-level security') || message.includes('permission denied')) {
      throw new Error('O Supabase bloqueou o envio. Confirme que seu usuário está em store_admins e execute supabase/storage.sql.')
    }
    if (message.includes('payload too large') || message.includes('file size')) {
      throw new Error('A imagem excede o limite de 5 MB.')
    }
    throw error
  }

  const { data: publicUrl } = client.storage.from(productImagesBucket).getPublicUrl(data.path)
  return publicUrl.publicUrl
}
