import { FormEvent, useEffect, useState } from 'react'
import PixPayment from '../../components/PixPayment'
import { StoreSettings, updateStoreSettings } from '../../services/settings'
import { guessPixKeyType, isValidPixKey, normalizePixKey, PixKeyType, pixText } from '../../utils/pix'
import { AdminButton, AdminNotice, AdminPanel, FormGrid } from './styles'

type SettingsPanelProps = {
  settings: StoreSettings
  onSaved: (settings: StoreSettings) => void
}

const keyLabels: Record<PixKeyType, string> = {
  cpf_cnpj: 'CPF ou CNPJ',
  phone: 'Celular',
  email: 'E-mail',
  random: 'Chave aleatória'
}

const SettingsPanel = ({ settings, onSaved }: SettingsPanelProps) => {
  const [freeShipping, setFreeShipping] = useState('')
  const [keyType, setKeyType] = useState<PixKeyType>('cpf_cnpj')
  const [pixKey, setPixKey] = useState('')
  const [pixName, setPixName] = useState('')
  const [pixCity, setPixCity] = useState('')
  const [promotionEndsAt, setPromotionEndsAt] = useState('')
  const [reservationMinutes, setReservationMinutes] = useState('120')
  const [pendingHours, setPendingHours] = useState('48')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setFreeShipping(settings.freeShippingMin ? String(settings.freeShippingMin).replace('.', ',') : '')
    setKeyType(settings.pixKey ? guessPixKeyType(settings.pixKey) : 'cpf_cnpj')
    setPixKey(settings.pixKey || '')
    setPixName(settings.pixName || 'Bella Chic Boutique')
    setPixCity(settings.pixCity || 'Belem')
    setPromotionEndsAt(settings.promotionEndsAt || '')
    setReservationMinutes(String(settings.reservationMinutes))
    setPendingHours(String(settings.pendingExpireHours))
  }, [settings])

  const normalizedKey = pixKey.trim() ? normalizePixKey(keyType, pixKey) : ''
  const keyValid = !normalizedKey || isValidPixKey(keyType, normalizedKey)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const freeMin = freeShipping.trim() ? Number(freeShipping.replace(',', '.')) : null
    const minutes = Number(reservationMinutes)
    const hours = Number(pendingHours)
    if (freeMin !== null && (!Number.isFinite(freeMin) || freeMin <= 0)) {
      setError('Informe um valor de frete grátis maior que zero, ou deixe vazio para desligar.')
      return
    }
    if (!keyValid) {
      setError(`A chave Pix não parece um ${keyLabels[keyType].toLowerCase()} válido.`)
      return
    }
    if (normalizedKey && (!pixText(pixName, 25) || !pixText(pixCity, 15))) {
      setError('Informe o nome e a cidade que aparecem no Pix.')
      return
    }
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 1440 || !Number.isInteger(hours) || hours < 3 || hours > 720) {
      setError('A reserva vai de 15 minutos a 24 horas, e o cancelamento automático de 3 horas a 30 dias.')
      return
    }
    setSaving(true)
    try {
      const saved = await updateStoreSettings({
        freeShippingMin: freeMin,
        pixKey: normalizedKey || null,
        pixName: normalizedKey ? pixText(pixName, 25) : null,
        pixCity: normalizedKey ? pixText(pixCity, 15) : null,
        promotionEndsAt: promotionEndsAt || null,
        reservationMinutes: minutes,
        pendingExpireHours: hours
      })
      onSaved(saved)
      setNotice('Configurações salvas. O site já usa os novos valores.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPanel>
      <h2>Configurações da loja</h2>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {notice && <AdminNotice role="status">{notice}</AdminNotice>}
      <form onSubmit={submit}>
        <h3 style={{ margin: '4px 0 10px', font: "17px 'Playfair Display', Georgia, serif", color: '#594548' }}>Pix copia e cola</h3>
        <FormGrid>
          <label>Tipo da chave
            <select value={keyType} onChange={(event) => setKeyType(event.target.value as PixKeyType)}>
              {(Object.keys(keyLabels) as PixKeyType[]).map((type) => <option key={type} value={type}>{keyLabels[type]}</option>)}
            </select>
          </label>
          <label>Chave Pix
            <input value={pixKey} onChange={(event) => setPixKey(event.target.value)} placeholder={keyType === 'phone' ? '(91) 98064-8559' : keyType === 'email' ? 'loja@email.com' : ''} />
            {normalizedKey && <span className="hint">{keyValid ? `Vai ser usada como: ${normalizedKey}` : 'Confira a chave.'}</span>}
          </label>
          <label>Nome que aparece no Pix
            <input value={pixName} onChange={(event) => setPixName(event.target.value)} maxLength={40} />
            <span className="hint">Até 25 letras, sem acento: {pixText(pixName, 25) || '—'}</span>
          </label>
          <label>Cidade
            <input value={pixCity} onChange={(event) => setPixCity(event.target.value)} maxLength={30} />
            <span className="hint">Até 15 letras: {pixText(pixCity, 15) || '—'}</span>
          </label>
          <p className="hint wide">Deixe a chave vazia para desligar o Pix copia e cola. Faça um pagamento de teste de poucos centavos antes de divulgar.</p>
        </FormGrid>
        {normalizedKey && keyValid && pixText(pixName, 25) && pixText(pixCity, 15) && (
          <div style={{ maxWidth: 460, margin: '12px 0 4px' }}>
            <PixPayment pixKey={normalizedKey} name={pixText(pixName, 25)} city={pixText(pixCity, 15)} amount={0.01} reference="TESTE" compact />
          </div>
        )}

        <h3 style={{ margin: '22px 0 10px', font: "17px 'Playfair Display', Georgia, serif", color: '#594548' }}>Entrega e promoções</h3>
        <FormGrid>
          <label>Frete grátis a partir de (R$)
            <input inputMode="decimal" value={freeShipping} onChange={(event) => setFreeShipping(event.target.value)} placeholder="Ex.: 200,00 (vazio = desligado)" />
            <span className="hint">Vale para entrega, pelo valor das peças depois do desconto.</span>
          </label>
          <label>Fim das “Ofertas da semana”
            <input type="date" value={promotionEndsAt} onChange={(event) => setPromotionEndsAt(event.target.value)} />
            <span className="hint">Vazio mostra “Enquanto durar o estoque”.</span>
          </label>
        </FormGrid>

        <h3 style={{ margin: '22px 0 10px', font: "17px 'Playfair Display', Georgia, serif", color: '#594548' }}>Pedidos do site</h3>
        <FormGrid>
          <label>Reserva das peças (minutos)
            <input type="number" min="15" max="1440" step="5" value={reservationMinutes} onChange={(event) => setReservationMinutes(event.target.value)} />
            <span className="hint">Por quanto tempo as peças ficam separadas depois do pedido.</span>
          </label>
          <label>Cancelar pedido parado depois de (horas)
            <input type="number" min="3" max="720" step="1" value={pendingHours} onChange={(event) => setPendingHours(event.target.value)} />
            <span className="hint">Pedidos ainda não confirmados são cancelados sozinhos.</span>
          </label>
        </FormGrid>
        <AdminButton type="submit" disabled={saving} style={{ marginTop: 18 }}>{saving ? 'Salvando...' : 'Salvar configurações'}</AdminButton>
      </form>
    </AdminPanel>
  )
}

export default SettingsPanel
