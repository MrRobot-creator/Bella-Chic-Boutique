import { supabase } from './catalog'
import { storeConfig } from '../config/store'
import { unitIdOf } from '../utils/units'

export { unitIdOf, unitNameOf } from '../utils/units'

/** Pix de cada loja (supabase/v5-unidades.sql). */
export type UnitPix = {
  unitId: string
  name: string
  pixKey: string | null
  pixName: string | null
  pixCity: string | null
}

export type StoreSettings = {
  freeShippingMin: number | null
  promotionEndsAt: string | null
  reservationMinutes: number
  pendingExpireHours: number
  units: UnitPix[]
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

type UnitRow = {
  id: string
  name: string
  pix_key: string | null
  pix_name: string | null
  pix_city: string | null
}

const emptyUnits = (): UnitPix[] =>
  storeConfig.units.map((unit) => ({ unitId: unit.id, name: unit.name, pixKey: null, pixName: null, pixCity: null }))

export const defaultSettings: StoreSettings = {
  freeShippingMin: null,
  promotionEndsAt: null,
  reservationMinutes: 120,
  pendingExpireHours: 48,
  units: emptyUnits()
}

const settingsColumns = 'free_shipping_min,pix_key,pix_name,pix_city,promotion_ends_at,reservation_minutes,pending_expire_hours'

const toSettings = (row: SettingsRow, units: UnitPix[]): StoreSettings => ({
  freeShippingMin: row.free_shipping_min === null ? null : Number(row.free_shipping_min),
  promotionEndsAt: row.promotion_ends_at,
  reservationMinutes: row.reservation_minutes,
  pendingExpireHours: row.pending_expire_hours,
  units
})

const toUnits = (rows: UnitRow[]): UnitPix[] => storeConfig.units.map((unit) => {
  const row = rows.find((candidate) => candidate.id === unit.id)
  return { unitId: unit.id, name: unit.name, pixKey: row?.pix_key ?? null, pixName: row?.pix_name ?? null, pixCity: row?.pix_city ?? null }
})

/** Configurações públicas da loja. Antes do v3 volta o padrão; antes do v5, o Pix único vale para as duas lojas. */
export const fetchStoreSettings = async (): Promise<StoreSettings> => {
  if (!supabase) return defaultSettings
  const [settingsResult, unitsResult] = await Promise.all([
    supabase.from('store_settings').select(settingsColumns).eq('id', 1).maybeSingle(),
    supabase.from('store_units').select('id,name,pix_key,pix_name,pix_city').order('sort_order')
  ])
  if (settingsResult.error || !settingsResult.data) return defaultSettings
  const row = settingsResult.data as SettingsRow
  const units = unitsResult.error
    ? emptyUnits().map((unit) => ({ ...unit, pixKey: row.pix_key, pixName: row.pix_name, pixCity: row.pix_city }))
    : toUnits(unitsResult.data as UnitRow[])
  return toSettings(row, units)
}

export type GeneralSettingsInput = Omit<StoreSettings, 'units'>

export const updateStoreSettings = async (settings: GeneralSettingsInput, units: UnitPix[]): Promise<StoreSettings> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { data, error } = await supabase
    .from('store_settings')
    .update({
      free_shipping_min: settings.freeShippingMin,
      promotion_ends_at: settings.promotionEndsAt,
      reservation_minutes: settings.reservationMinutes,
      pending_expire_hours: settings.pendingExpireHours,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1)
    .select(settingsColumns)
    .single()
  if (error) {
    if (error.message.includes('store_settings')) throw new Error('Rode supabase/v3-gestao.sql no SQL Editor do Supabase para liberar as configurações.')
    throw new Error(error.message)
  }
  return toSettings(data as SettingsRow, units)
}

/** Salva o Pix de uma loja. */
export const updateUnitPix = async (unit: UnitPix): Promise<void> => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  const { data, error } = await supabase
    .from('store_units')
    .update({ pix_key: unit.pixKey, pix_name: unit.pixName, pix_city: unit.pixCity, updated_at: new Date().toISOString() })
    .eq('id', unit.unitId)
    .select('id')
  if (error) {
    if (/store_units|schema cache/i.test(error.message)) throw new Error('Rode supabase/v5-unidades.sql no SQL Editor do Supabase para cadastrar o Pix de cada loja.')
    throw new Error(error.message)
  }
  if (!data || data.length === 0) throw new Error('Só a dona da loja pode mudar o Pix.')
}

/** Dados do Pix da loja, ou null quando a loja ainda não tem chave. */
export const unitPix = (settings: StoreSettings, unitRef: string | null | undefined) => {
  const unit = settings.units.find((candidate) => candidate.unitId === unitIdOf(unitRef))
  return unit && unit.pixKey && unit.pixName && unit.pixCity
    ? { key: unit.pixKey, name: unit.pixName, city: unit.pixCity }
    : null
}

export const hasPix = (settings: StoreSettings, unitRef: string | null | undefined) => Boolean(unitPix(settings, unitRef))
