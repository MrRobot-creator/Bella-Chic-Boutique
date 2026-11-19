/**
 * Brinde da Black Friday: relógio rosé nas compras a partir de R$ 250 (peças após o desconto, sem frete).
 * Para encerrar a ação, troque por null (e tire o banner do carrossel).
 */
export const giftPromo: { minSubtotal: number; gift: string } | null = {
  minSubtotal: 250,
  gift: 'relógio rosé'
}

/** A compra (valor das peças após o desconto) ganha o brinde? */
export const earnsGift = (netSubtotal: number) => giftPromo !== null && netSubtotal >= giftPromo.minSubtotal
