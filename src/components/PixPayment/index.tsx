import { useState } from 'react'
import styled from 'styled-components'
import { QRCodeSVG } from 'qrcode.react'
import { colors, fonts } from '../../styles/tokens'
import { buildPixPayload } from '../../utils/pix'

type PixPaymentProps = {
  pixKey: string
  name: string
  city: string
  amount: number
  reference: string
  compact?: boolean
}

const Box = styled.div<{ $compact?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $compact }) => ($compact ? '120px' : '150px')} minmax(0, 1fr);
  gap: 16px;
  align-items: center;
  padding: 16px;
  border: 1px solid ${colors.line};
  border-radius: 18px;
  background: ${colors.white};
  .qr { padding: 8px; border-radius: 12px; background: ${colors.white}; box-shadow: 0 0 0 1px ${colors.line}; line-height: 0; }
  .qr svg { width: 100%; height: auto; }
  .label { color: ${colors.muted}; font-size: 12px; }
  .amount { display: block; margin: 2px 0 8px; color: ${colors.plum}; font-size: 22px; font-weight: 700; }
  .code { display: block; width: 100%; padding: 8px 10px; overflow: hidden; border-radius: 10px; background: ${colors.blushSoft}; color: ${colors.muted}; font: 11px ui-monospace, Menlo, monospace; text-overflow: ellipsis; white-space: nowrap; }
  button { width: 100%; min-height: 42px; margin-top: 8px; border: 0; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font: 600 13px ${fonts.sans}; cursor: pointer; }
  button:hover { background: ${colors.roseDark}; }
  .hint { margin-top: 8px; color: ${colors.soft}; font-size: 11px; line-height: 1.4; }
  @media (max-width: 420px) { grid-template-columns: 1fr; justify-items: center; text-align: center; .qr { width: 160px; } }
`

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const PixPayment = ({ pixKey, name, city, amount, reference, compact }: PixPaymentProps) => {
  const [copied, setCopied] = useState(false)
  const payload = buildPixPayload({ key: pixKey, name, city, amount, txid: reference })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt('Copie o código Pix:', payload)
    }
  }

  return (
    <Box $compact={compact}>
      <div className="qr" aria-label="QR Code do Pix">
        <QRCodeSVG value={payload} size={compact ? 104 : 134} level="M" marginSize={0} />
      </div>
      <div>
        <span className="label">Pague com Pix · pedido {reference}</span>
        <strong className="amount">{formatPrice(amount)}</strong>
        <span className="code" title={payload}>{payload}</span>
        <button type="button" onClick={copy}>{copied ? 'Código copiado!' : 'Copiar Pix copia e cola'}</button>
        <p className="hint">Abra o app do banco, escolha Pix copia e cola e cole o código. Depois envie o comprovante no WhatsApp.</p>
      </div>
    </Box>
  )
}

export default PixPayment
