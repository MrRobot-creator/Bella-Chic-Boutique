import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Product } from '../../types/store'
import { createRestockRequest, formatPhoneInput } from '../../services/restock'
import { trackEvent } from '../../services/analytics'
import { RestockBox } from './styles'

type RestockFormProps = {
  product: Product
  size: string
  color: string
  idPrefix: string
}

const RestockForm = ({ product, size, color, idPrefix }: RestockFormProps) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    setFeedback(null)
  }, [size, color])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const honeypot = event.currentTarget.elements.namedItem('website') as HTMLInputElement | null
    if (honeypot?.value) return

    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 11) {
      setFeedback({ ok: false, text: 'Informe seu WhatsApp com DDD, por exemplo (91) 99999-9999.' })
      return
    }

    setSending(true)
    setFeedback(null)
    try {
      await createRestockRequest({ productId: product.id, size, color, name: name.trim() || undefined, phone })
      trackEvent('restock_request', { item_id: String(product.id), item_name: product.name, item_variant: `${size} / ${color}` })
      setFeedback({ ok: true, text: 'Pronto! Vamos te chamar no WhatsApp quando essa peça voltar. 💕' })
    } catch (error) {
      setFeedback({ ok: false, text: error instanceof Error ? error.message : 'Não foi possível registrar o aviso agora.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <RestockBox onSubmit={handleSubmit} aria-labelledby={`${idPrefix}-restock-title`}>
      <h3 id={`${idPrefix}-restock-title`}>Avise-me quando chegar</h3>
      <p>
        {size && color ? <><strong>{product.name}</strong> · {size} · {color} está esgotada.</> : 'Esta peça está esgotada.'}{' '}
        Deixe seu WhatsApp e a loja te avisa quando repor.
      </p>
      <div className="fields">
        <label htmlFor={`${idPrefix}-restock-name`}>Seu nome (opcional)
          <input id={`${idPrefix}-restock-name`} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={120} />
        </label>
        <label htmlFor={`${idPrefix}-restock-phone`}>Seu WhatsApp
          <input
            id={`${idPrefix}-restock-phone`}
            type="tel"
            value={phone}
            onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
            autoComplete="tel"
            placeholder="(91) 99999-9999"
            required
          />
        </label>
      </div>
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        defaultValue=""
        style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }}
      />
      <button type="submit" disabled={sending || !size || !color}>{sending ? 'Enviando...' : 'Quero ser avisada'}</button>
      {feedback && <span className={`feedback ${feedback.ok ? 'ok' : 'error'}`} role="status">{feedback.text}</span>}
      <p>Usamos seu número só para este aviso. <Link to="/privacidade">Política de Privacidade</Link>.</p>
    </RestockBox>
  )
}

export default RestockForm
