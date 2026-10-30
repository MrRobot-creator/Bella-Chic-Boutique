import { storeConfig } from '../config/store'

/** Aceita o id ("cidade-nova-4") ou o nome ("Cidade Nova 4") da loja e devolve o id. */
export const unitIdOf = (unitRef: string | null | undefined) => {
  const ref = (unitRef || '').trim()
  return storeConfig.units.find((unit) => unit.id === ref || unit.name === ref)?.id || ref
}

export const unitNameOf = (unitRef: string | null | undefined) =>
  storeConfig.units.find((unit) => unit.id === unitIdOf(unitRef))?.name || unitRef || ''

/** Loja de um pedido: unit_id quando o banco já tem (v5), senão pelo nome gravado no pedido. */
export const orderUnitId = (order: { unit_id?: string | null; unit: { name: string } }) => unitIdOf(order.unit_id || order.unit.name)
