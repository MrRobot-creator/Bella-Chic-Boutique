import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { products as demoProducts } from '../data/products'
import { Product } from '../types/store'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY
const productImagesBucket = 'bella-chic-products'

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
  sizes: string[]
  colors: Product['colors']
  tag: string | null
  is_available: boolean
}

export type CatalogProductInput = Omit<Product, 'id' | 'available'> & {
  available: boolean
}

const toProduct = (row: CatalogRow): Product => ({
  id: row.id,
  name: row.name,
  category: row.category,
  description: row.description,
  price: Number(row.price),
  oldPrice: row.old_price === null ? undefined : Number(row.old_price),
  image: row.image,
  sizes: row.sizes,
  colors: row.colors,
  tag: row.tag || undefined,
  available: row.is_available
})

const toRow = (product: CatalogProductInput) => ({
  name: product.name,
  category: product.category,
  description: product.description,
  price: product.price,
  old_price: product.oldPrice ?? null,
  image: product.image,
  sizes: product.sizes,
  colors: product.colors,
  tag: product.tag || null,
  is_available: product.available
})

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Configure REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY para conectar o painel.')
  }
  return supabase
}

export const fetchCatalogProducts = async (): Promise<Product[]> => {
  if (!supabase) return demoProducts

  const { data, error } = await supabase
    .from('catalog_products')
    .select('*')
    .order('id', { ascending: true })

  if (error) throw error
  return (data as CatalogRow[]).map(toProduct)
}

export const fetchAdminProducts = async (): Promise<Product[]> => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('catalog_products')
    .select('*')
    .order('id', { ascending: true })

  if (error) throw error
  return (data as CatalogRow[]).map(toProduct)
}

export const hasCatalogAdminAccess = async (userId: string): Promise<boolean> => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('store_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export const saveCatalogProduct = async (product: CatalogProductInput, id?: number): Promise<Product> => {
  const client = requireSupabase()
  const query = id
    ? client.from('catalog_products').update(toRow(product)).eq('id', id)
    : client.from('catalog_products').insert(toRow(product))
  const { data, error } = await query.select('*').single()

  if (error) throw error
  return toProduct(data as CatalogRow)
}

export const deleteCatalogProduct = async (id: number): Promise<void> => {
  const { error } = await requireSupabase().from('catalog_products').delete().eq('id', id)
  if (error) throw error
}

export const uploadProductImage = async (file: File): Promise<string> => {
  const client = requireSupabase()
  const allowedTypes: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
  }
  const extension = allowedTypes[file.type]

  if (!extension) {
    throw new Error('Formato não permitido. Envie uma imagem PNG, JPG ou WebP.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('A imagem deve ter no máximo 5 MB.')
  }

  const filePath = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`
  const { data, error } = await client.storage
    .from(productImagesBucket)
    .upload(filePath, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data: publicUrl } = client.storage.from(productImagesBucket).getPublicUrl(data.path)
  return publicUrl.publicUrl
}
