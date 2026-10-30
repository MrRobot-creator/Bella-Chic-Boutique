import { FormEvent, useEffect, useState } from 'react'
import PixPayment from '../../components/PixPayment'
import { StoreSettings, UnitPix, updateStoreSettings, updateUnitPix } from '../../services/settings'
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

type PixDraft = { unitId: string; name: string; keyType: PixKeyType; key: string; pixName: string; pixCity: string }

const draftOf = (unit: UnitPix): PixDraft => ({
  unitId: unit.unitId,
  name: unit.name,
  keyType: unit.pixKey ? guessPixKeyType(unit.pixKey) : 'cpf_cnpj',
  key: unit.pixKey || '',
  pixName: unit.pixName || 'Bella Chic Boutique',
  pixCity: unit.pixCity || (unit.unitId === 'cidade-nova-4' ? 'Ananindeua' : 'Belem')
})

const normalized = (draft: PixDraft) => (draft.key.trim() ? normalizePixKey(draft.keyType, draft.key) : '')

const toUnitPix = (draft: PixDraft): UnitPix => {
  const key = normalized(draft)
  return {
    unitId: draft.unitId,
    name: draft.name,
    pixKey: key || null,
    pixName: key ? pixText(draft.pixName, 25) : null,
    pixCity: key ? pixText(draft.pixCity, 15) : null
  }
}

const sameUnit = (first: UnitPix, second: UnitPix) =>
  first.pixKey === second.pixKey && first.pixName === second.pixName && first.pixCity === second.pixCity

const headingStyle = { margin: '22px 0 10px', font: "17px 'Playfair Display', Georgia, serif", color: '#594548' }

const SettingsPanel = ({ settings, onSaved }: SettingsPanelProps) => {
  const [freeShipping, setFreeShipping] = useState('')
  const [pixDrafts, setPixDrafts] = useState<PixDraft[]>([])
  const [promotionEndsAt, setPromotionEndsAt] = useState('')
  const [reservationMinutes, setReservationMinutes] = useState('120')
  const [pendingHours, setPendingHours] = useState('48')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    setFreeShipping(settings.freeShippingMin ? String(settings.freeShippingMin).replace('.', ',') : '')
    setPixDrafts(settings.units.map(draftOf))
    setPromotionEndsAt(settings.promotionEndsAt || '')
    setReservationMinutes(String(settings.reservationMinutes))
    setPendingHours(String(settings.pendingExpireHours))
  }, [settings])

  const updateDraft = (unitId: string, change: Partial<PixDraft>) =>
    setPixDrafts((current) => current.map((draft) => (draft.unitId === unitId ? { ...draft, ...change } : draft)))

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
    for (const draft of pixDrafts) {
      const key = normalized(draft)
      if (key && !isValidPixKey(draft.keyType, key)) {
        setError(`A chave Pix da ${draft.name} não parece um ${keyLabels[draft.keyType].toLowerCase()} válido.`)
        return
      }
      if (key && (!pixText(draft.pixName, 25) || !pixText(draft.pixCity, 15))) {
        setError(`Informe o nome e a cidade que aparecem no Pix da ${draft.name}.`)
        return
      }
    }
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 1440 || !Number.isInteger(hours) || hours < 3 || hours > 720) {
      setError('A reserva vai de 15 minutos a 24 horas, e o cancelamento automático de 3 horas a 30 dias.')
      return
    }
    setSaving(true)
    try {
      const units = pixDrafts.map(toUnitPix)
      for (const unit of units) {
        const before = settings.units.find((candidate) => candidate.unitId === unit.unitId)
        if (!before || !sameUnit(before, unit)) await updateUnitPix(unit)
      }
      const saved = await updateStoreSettings({
        freeShippingMin: freeMin,
        promotionEndsAt: promotionEndsAt || null,
        reservationMinutes: minutes,
        pendingExpireHours: hours
      }, units)
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
        <p>Cada loja recebe no seu Pix: o Pix copia e cola da sacola, do WhatsApp e do e-mail sai com a chave da loja que a cliente escolheu.</p>
        {pixDrafts.map((draft) => {
          const key = normalized(draft)
          const valid = !key || isValidPixKey(draft.keyType, key)
          return (
            <section key={draft.unitId} aria-labelledby={`pix-${draft.unitId}`}>
              <h3 id={`pix-${draft.unitId}`} style={headingStyle}>Pix da {draft.name}</h3>
              <FormGrid>
                <label>Tipo da chave
                  <select id={`pix-type-${draft.unitId}`} value={draft.keyType} onChange={(event) => updateDraft(draft.unitId, { keyType: event.target.value as PixKeyType })}>
                    {(Object.keys(keyLabels) as PixKeyType[]).map((type) => <option key={type} value={type}>{keyLabels[type]}</option>)}
                  </select>
                </label>
                <label>Chave Pix
                  <input id={`pix-key-${draft.unitId}`} value={draft.key} onChange={(event) => updateDraft(draft.unitId, { key: event.target.value })} placeholder={draft.keyType === 'phone' ? '(91) 98064-8559' : draft.keyType === 'email' ? 'loja@email.com' : ''} />
                  {key && <span className="hint">{valid ? `Vai ser usada como: ${key}` : 'Confira a chave.'}</span>}
                </label>
                <label>Nome que aparece no Pix
                  <input id={`pix-name-${draft.unitId}`} value={draft.pixName} onChange={(event) => updateDraft(draft.unitId, { pixName: event.target.value })} maxLength={40} />
                  <span className="hint">Até 25 letras, sem acento: {pixText(draft.pixName, 25) || '—'}</span>
                </label>
                <label>Cidade
                  <input id={`pix-city-${draft.unitId}`} value={draft.pixCity} onChange={(event) => updateDraft(draft.unitId, { pixCity: event.target.value })} maxLength={30} />
                  <span className="hint">Até 15 letras: {pixText(draft.pixCity, 15) || '—'}</span>
                </label>
                <p className="hint wide">Deixe a chave vazia para a {draft.name} não mostrar Pix copia e cola. Faça um pagamento de teste de poucos centavos antes de divulgar.</p>
              </FormGrid>
              {key && valid && pixText(draft.pixName, 25) && pixText(draft.pixCity, 15) && (
                <div style={{ maxWidth: 460, margin: '12px 0 4px' }}>
                  <PixPayment pixKey={key} name={pixText(draft.pixName, 25)} city={pixText(draft.pixCity, 15)} amount={0.01} reference="TESTE" compact />
                </div>
              )}
            </section>
          )
        })}

        <h3 style={headingStyle}>Entrega e promoções</h3>
        <FormGrid>
          <label>Frete grátis a partir de (R$)
            <input id="settings-free-shipping" inputMode="decimal" value={freeShipping} onChange={(event) => setFreeShipping(event.target.value)} placeholder="Ex.: 200,00 (vazio = desligado)" />
            <span className="hint">Vale para entrega, pelo valor das peças depois do desconto.</span>
          </label>
          <label>Fim das “Ofertas da semana”
            <input id="settings-promotion" type="date" value={promotionEndsAt} onChange={(event) => setPromotionEndsAt(event.target.value)} />
            <span className="hint">Vazio mostra “Enquanto durar o estoque”.</span>
          </label>
        </FormGrid>

        <h3 style={headingStyle}>Pedidos do site</h3>
        <FormGrid>
          <label>Reserva das peças (minutos)
            <input id="settings-reservation" type="number" min="15" max="1440" step="5" value={reservationMinutes} onChange={(event) => setReservationMinutes(event.target.value)} />
            <span className="hint">Por quanto tempo as peças ficam separadas depois do pedido.</span>
          </label>
          <label>Cancelar pedido parado depois de (horas)
            <input id="settings-pending-hours" type="number" min="3" max="720" step="1" value={pendingHours} onChange={(event) => setPendingHours(event.target.value)} />
            <span className="hint">Pedidos ainda não confirmados são cancelados sozinhos.</span>
          </label>
        </FormGrid>
        <AdminButton type="submit" disabled={saving} style={{ marginTop: 18 }}>{saving ? 'Salvando...' : 'Salvar configurações'}</AdminButton>
      </form>
    </AdminPanel>
  )
}

export default SettingsPanel
