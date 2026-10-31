import { describe, expect, it } from '@jest/globals'
import { orderError } from './orders'

describe('Mensagens dos limites de pedido (supabase/v6-limites.sql)', () => {
  it('explica cada bloqueio para a cliente', () => {
    expect(orderError(new Error('Too many units of the same item')).message).toContain('até 5 unidades')
    expect(orderError(new Error('Too many units in one order')).message).toContain('até 20 peças')
    expect(orderError(new Error('Too many open orders from this phone')).message).toContain('3 pedidos aguardando')
    expect(orderError(new Error('Too many orders from this phone')).message).toContain('30 minutos')
  })
})
