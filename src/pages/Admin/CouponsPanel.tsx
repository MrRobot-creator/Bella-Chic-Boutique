import { FormEvent, useCallback, useEffect, useState } from 'react'
import { deleteCoupon, describeCoupon, fetchCoupons, normalizeCouponCode, saveCoupon, StoreCoupon } from '../../services/coupon'
import { AdminButton, AdminNotice, AdminPanel, DataTable, FormGrid } from './styles'

type Draft = {
  code: string
  kind: StoreCoupon['kind']
  value: string
  minSubtotal: string
  startsAt: string
  endsAt: string
  maxUses: string
  oncePerCustomer: boolean
  firstPurchaseOnly: boolean
  active: boolean
  description: string
}

const blank: Draft = {
  code: '', kind: 'percent', value: '', minSubtotal: '', startsAt: '', endsAt: '', maxUses: '',
  oncePerCustomer: true, firstPurchaseOnly: false, active: true, description: ''
}

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const toLocalInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)
const number = (value: string) => Number(value.replace(',', '.'))

const couponState = (coupon: StoreCoupon) => {
  const now = Date.now()
  if (!coupon.active) return { label: 'Pausado', tone: 'muted' }
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now) return { label: 'Agendado', tone: '' }
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() < now) return { label: 'Vencido', tone: 'muted' }
  return { label: 'Ativo', tone: 'in' }
}

const CouponsPanel = () => {
  const [coupons, setCoupons] = useState<StoreCoupon[]>([])
  const [draft, setDraft] = useState<Draft>(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setCoupons(await fetchCoupons())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar os cupons.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const edit = (coupon: StoreCoupon) => {
    setEditing(coupon.code)
    setDraft({
      code: coupon.code,
      kind: coupon.kind,
      value: String(coupon.value).replace('.', ','),
      minSubtotal: coupon.minSubtotal ? String(coupon.minSubtotal).replace('.', ',') : '',
      startsAt: toLocalInput(coupon.startsAt),
      endsAt: toLocalInput(coupon.endsAt),
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      oncePerCustomer: coupon.oncePerCustomer,
      firstPurchaseOnly: coupon.firstPurchaseOnly,
      active: coupon.active,
      description: coupon.description || ''
    })
    setError('')
    setNotice('')
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const value = number(draft.value)
    const minSubtotal = draft.minSubtotal ? number(draft.minSubtotal) : 0
    const maxUses = draft.maxUses ? Number(draft.maxUses) : null
    if (!/^[A-Z0-9_-]{3,30}$/.test(normalizeCouponCode(draft.code))) {
      setError('Use de 3 a 30 letras, números, - ou _ no código.')
      return
    }
    if (!Number.isFinite(value) || value <= 0 || (draft.kind === 'percent' && value > 90)) {
      setError(draft.kind === 'percent' ? 'Informe uma porcentagem entre 1 e 90.' : 'Informe um valor de desconto maior que zero.')
      return
    }
    if (!Number.isFinite(minSubtotal) || minSubtotal < 0 || (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1))) {
      setError('Confira o valor mínimo e o limite de usos.')
      return
    }
    setSaving(true)
    try {
      const saved = await saveCoupon({
        code: normalizeCouponCode(draft.code),
        kind: draft.kind,
        value,
        minSubtotal,
        startsAt: fromLocalInput(draft.startsAt),
        endsAt: fromLocalInput(draft.endsAt),
        maxUses,
        oncePerCustomer: draft.oncePerCustomer,
        firstPurchaseOnly: draft.firstPurchaseOnly,
        active: draft.active,
        description: draft.description
      }, editing === null)
      setNotice(`Cupom ${saved.code} ${editing ? 'atualizado' : 'criado'}.`)
      setDraft(blank)
      setEditing(null)
      load()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar o cupom.')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (coupon: StoreCoupon) => {
    try {
      await saveCoupon({ ...coupon, active: !coupon.active }, false)
      load()
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Não foi possível alterar o cupom.')
    }
  }

  const remove = async (coupon: StoreCoupon) => {
    if (!window.confirm(`Excluir o cupom ${coupon.code}? Pedidos que já usaram continuam registrados.`)) return
    try {
      await deleteCoupon(coupon.code)
      load()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Não foi possível excluir o cupom.')
    }
  }

  return (
    <AdminPanel>
      <h2>Cupons</h2>
      <p>Crie cupons em porcentagem ou em reais, com validade, valor mínimo e limite de usos. A sacola confere o cupom no servidor antes de aplicar.</p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {notice && <AdminNotice role="status">{notice}</AdminNotice>}

      <form onSubmit={submit} style={{ marginBottom: 22 }}>
        <FormGrid>
          <label>Código
            <input value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value.toUpperCase() })} placeholder="NATAL15" disabled={editing !== null} required />
          </label>
          <label>Tipo
            <select value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as StoreCoupon['kind'] })}>
              <option value="percent">Porcentagem (%)</option>
              <option value="fixed">Valor em reais (R$)</option>
            </select>
          </label>
          <label>{draft.kind === 'percent' ? 'Desconto (%)' : 'Desconto (R$)'}
            <input inputMode="decimal" value={draft.value} onChange={(event) => setDraft({ ...draft, value: event.target.value })} placeholder={draft.kind === 'percent' ? '10' : '20,00'} required />
          </label>
          <label>Compra mínima (R$)
            <input inputMode="decimal" value={draft.minSubtotal} onChange={(event) => setDraft({ ...draft, minSubtotal: event.target.value })} placeholder="0,00" />
          </label>
          <label>Começa em (opcional)
            <input type="datetime-local" value={draft.startsAt} onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })} />
          </label>
          <label>Termina em (opcional)
            <input type="datetime-local" value={draft.endsAt} onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })} />
          </label>
          <label>Limite de usos (opcional)
            <input type="number" min="1" step="1" value={draft.maxUses} onChange={(event) => setDraft({ ...draft, maxUses: event.target.value })} placeholder="Sem limite" />
          </label>
          <label className="wide">Descrição interna (opcional)
            <input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} maxLength={140} placeholder="Campanha de Natal no Instagram" />
          </label>
          <label className="check"><input type="checkbox" checked={draft.oncePerCustomer} onChange={(event) => setDraft({ ...draft, oncePerCustomer: event.target.checked })} />Uma vez por cliente</label>
          <label className="check"><input type="checkbox" checked={draft.firstPurchaseOnly} onChange={(event) => setDraft({ ...draft, firstPurchaseOnly: event.target.checked })} />Só na primeira compra</label>
          <label className="check"><input type="checkbox" checked={draft.active} onChange={(event) => setDraft({ ...draft, active: event.target.checked })} />Ativo</label>
        </FormGrid>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <AdminButton type="submit" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar cupom' : 'Criar cupom'}</AdminButton>
          {editing && <AdminButton type="button" className="secondary" onClick={() => { setEditing(null); setDraft(blank) }}>Cancelar edição</AdminButton>}
        </div>
      </form>

      {loading ? <p>Carregando cupons...</p> : coupons.length === 0 ? <p>Nenhum cupom criado.</p> : (
        <DataTable>
          <table>
            <thead><tr><th>Código</th><th>Desconto</th><th>Regras</th><th>Validade</th><th>Situação</th><th /></tr></thead>
            <tbody>
              {coupons.map((coupon) => {
                const state = couponState(coupon)
                return (
                  <tr key={coupon.code}>
                    <td><strong>{coupon.code}</strong>{coupon.description ? <div className="muted">{coupon.description}</div> : null}</td>
                    <td>{describeCoupon(coupon)}</td>
                    <td>
                      {[coupon.minSubtotal ? `a partir de ${formatPrice(coupon.minSubtotal)}` : 'sem mínimo',
                        coupon.oncePerCustomer ? '1 vez por cliente' : '',
                        coupon.firstPurchaseOnly ? 'primeira compra' : '',
                        coupon.maxUses ? `até ${coupon.maxUses} usos` : ''].filter(Boolean).join(' · ')}
                    </td>
                    <td className="muted">
                      {coupon.startsAt ? `de ${new Date(coupon.startsAt).toLocaleDateString('pt-BR')} ` : ''}
                      {coupon.endsAt ? `até ${new Date(coupon.endsAt).toLocaleDateString('pt-BR')}` : coupon.startsAt ? '' : 'sem prazo'}
                    </td>
                    <td className={state.tone}>{state.label}</td>
                    <td>
                      <div className="actions">
                        <AdminButton type="button" className="secondary" onClick={() => edit(coupon)}>Editar</AdminButton>
                        <AdminButton type="button" className="secondary" onClick={() => toggle(coupon)}>{coupon.active ? 'Pausar' : 'Ativar'}</AdminButton>
                        <AdminButton type="button" className="danger" onClick={() => remove(coupon)}>Excluir</AdminButton>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </DataTable>
      )}
    </AdminPanel>
  )
}

export default CouponsPanel
