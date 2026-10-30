import { supabase } from './catalog'

export const REVIEW_BUCKET = 'bella-chic-reviews'
const MAX_PHOTO_BYTES = 5 * 1024 * 1024
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export type ProductReview = {
  id: string
  productId: number | null
  productName: string
  customerName: string
  rating: number
  comment: string | null
  photos: string[]
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

export type ReviewRequest = {
  reference: string
  firstName: string
  items: Array<{ productId: number; name: string; size: string; color: string; image: string | null; reviewed: boolean }>
}

type ReviewRow = {
  id: string
  product_id: number | null
  product_name: string
  customer_name: string
  rating: number
  comment: string | null
  photos: string[] | null
  status?: ProductReview['status']
  created_at: string
}

const publicColumns = 'id,product_id,product_name,customer_name,rating,comment,photos,status,created_at'

export const reviewPhotoUrl = (path: string) =>
  supabase ? supabase.storage.from(REVIEW_BUCKET).getPublicUrl(path).data.publicUrl : ''

const toReview = (row: ReviewRow): ProductReview => ({
  id: row.id,
  productId: row.product_id,
  productName: row.product_name,
  customerName: row.customer_name,
  rating: row.rating,
  comment: row.comment,
  photos: (row.photos || []).map(reviewPhotoUrl),
  status: row.status || 'approved',
  createdAt: row.created_at
})

const missingTables = (message: string) => /product_reviews|get_review_request|submit_review|schema cache|could not find the function/i.test(message)

/** Avaliações aprovadas de uma peça. Antes do banco atualizado, volta lista vazia. */
export const fetchApprovedReviews = async (productId: number): Promise<ProductReview[]> => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('product_reviews')
    .select(publicColumns)
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) return []
  return (data as ReviewRow[]).map(toReview)
}

export const fetchReviewRequest = async (token: string): Promise<ReviewRequest | null> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { data, error } = await supabase.rpc('get_review_request', { p_token: token })
  if (error) {
    if (/invalid input syntax for type uuid/i.test(error.message)) return null
    throw new Error(missingTables(error.message) ? 'As avaliações ainda não foram ativadas pela loja.' : error.message)
  }
  return (data as ReviewRequest | null) || null
}

export const uploadReviewPhoto = async (token: string, file: File): Promise<string> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  if (!PHOTO_TYPES.includes(file.type)) throw new Error('Envie fotos em JPG, PNG ou WebP.')
  if (file.size > MAX_PHOTO_BYTES) throw new Error('Cada foto pode ter até 5 MB.')
  const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${token}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`
  const { error } = await supabase.storage.from(REVIEW_BUCKET).upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error('Não foi possível enviar a foto. Tente outra imagem.')
  return path
}

export const submitReview = async (input: { token: string; productId: number; rating: number; comment: string; photos: string[] }) => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { error } = await supabase.rpc('submit_review', {
    p_token: input.token,
    p_product_id: input.productId,
    p_rating: input.rating,
    p_comment: input.comment,
    p_photos: input.photos
  })
  if (error) {
    if (/already sent/i.test(error.message)) throw new Error('Você já avaliou esta peça. Obrigada!')
    if (/invalid review link/i.test(error.message)) throw new Error('Este link de avaliação não vale mais.')
    throw new Error('Não foi possível enviar a avaliação. Tente novamente.')
  }
}

/* ---------- Painel ---------- */

export const fetchReviewsForModeration = async (status: ProductReview['status'] | 'all' = 'pending'): Promise<ProductReview[]> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  let query = supabase.from('product_reviews').select(publicColumns).order('created_at', { ascending: false }).limit(200)
  if (status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw new Error(missingTables(error.message) ? 'Rode supabase/v3-gestao.sql no SQL Editor do Supabase para liberar as avaliações.' : error.message)
  return (data as ReviewRow[]).map(toReview)
}

export const moderateReview = async (id: string, status: 'approved' | 'rejected') => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { error } = await supabase.from('product_reviews').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export const deleteReview = async (id: string) => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { error } = await supabase.from('product_reviews').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export const averageRating = (reviews: Pick<ProductReview, 'rating'>[]) =>
  reviews.length ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10 : 0
