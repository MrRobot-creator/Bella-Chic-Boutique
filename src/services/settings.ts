import { supabase } from './catalog'

export type StoreSettings = {
  freeShippingMin: number | null
  pixKey: string | null
  pixName: string | null
  pixCity: string | null
  promotionEndsAt: string | null
  reservationMinutes: number
  pendingExpireHours: number
}

type SettingsRow = {
  free_shipping_min: number | string | null
  pix_key: string | null
  pix_name: string | null
  pix_city: string | null
  promotion_ends_at: string | null
  reservation_minutes: number
  pending_expire_hours: number
}

export const defaultSettings: StoreSettings = {
  freeShippingMin: null,
  pixKey: null,
  pixName: null,
  pixCity: null,
  promotionEndsAt: null,
  reservationMinutes: 120,
  pendingExpireHours: 48
}

const toSettings = (row: SettingsRow): StoreSettings => ({
  freeShippingMin: row.free_shipping_min === null ? null : Number(row.free_shipping_min),
  pixKey: row.pix_key,
  pixName: row.pix_name,
  pixCity: row.pix_city,
  promotionEndsAt: row.promotion_ends_at,
  reservationMinutes: row.reservation_minutes,
  pendingExpireHours: row.pending_expire_hours
})

/** Configurações públicas da loja. Antes de rodar o v3-gestao.sql, volta o padrão. */
export const fetchStoreSettings = async (): Promise<StoreSettings> => {
  if (!supabase) return defaultSettings
  const { data, error } = await supabase
    .from('store_settings')
    .select('free_shipping_min,pix_key,pix_name,pix_city,promotion_ends_at,reservation_minutes,pending_expire_hours')
    .eq('id', 1)
    .maybeSingle()
  if (error || !data) return defaultSettings
  return toSettings(data as SettingsRow)
}

export const updateStoreSettings = async (settings: StoreSettings): Promise<StoreSettings> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { data, error } = await supabase
    .from('store_settings')
    .update({
      free_shipping_min: settings.freeShippingMin,
      pix_key: settings.pixKey,
      pix_name: settings.pixName,
      pix_city: settings.pixCity,
      promotion_ends_at: settings.promotionEndsAt,
      reservation_minutes: settings.reservationMinutes,
      pending_expire_hours: settings.pendingExpireHours,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select('free_shipping_min,pix_key,pix_name,pix_city,promotion_ends_at,reservation_minutes,pending_expire_hours')
    .single()
  if (error) {
    if (error.message.includes('store_settings')) throw new Error('Rode supabase/v3-gestao.sql no SQL Editor do Supabase para liberar as configurações.')
    throw new Error(error.message)
  }
  return toSettings(data as SettingsRow)
}

export const hasPix = (settings: StoreSettings) => Boolean(settings.pixKey && settings.pixName && settings.pixCity)
