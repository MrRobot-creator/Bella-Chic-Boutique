import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import { fetchMyOrders, orderStatusLabel, orderTotal, StoreOrder, StoreOrderItem } from '../../services/orders'
import { StoreSettings, unitPix } from '../../services/settings'
import PixPayment from '../PixPayment'
import styled from 'styled-components'
import { Backdrop, ModalCard, PrimaryButton, RoundButton } from '../ui'
import { colors, fonts } from '../../styles/tokens'
import {
  Customer,
  sendPasswordReset,
  signInCustomer,
  signOutCustomer,
  signUpCustomer,
  updateCustomerPassword
} from '../../hooks/useCustomer'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'

type Mode = 'signin' | 'signup' | 'forgot' | 'newPassword'

type AccountModalProps = {
  isOpen: boolean
  customer: Customer | null
  recoveringPassword: boolean
  onClose: () => void
  onNotify: (message: string) => void
  onPasswordUpdated: () => void
  settings: StoreSettings
  onReorder: (items: StoreOrderItem[]) => void
}

const Body = styled.form`
  padding: 34px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  > img { width: 60px; height: 60px; border-radius: 50%; align-self: center; }
  h2 { margin: 0; text-align: center; color: ${colors.plum}; font: 400 28px ${fonts.serif}; }
  .lead { margin: -6px 0 4px; text-align: center; color: ${colors.muted}; font-size: 14px; line-height: 1.5; }
  label { display: flex; flex-direction: column; gap: 6px; color: #6B5659; font-size: 13px; }
  input { height: 48px; padding: 0 16px; border: 1px solid ${colors.lineStrong}; border-radius: 12px; color: ${colors.plum}; font: 14px ${fonts.sans}; }
  input:focus-visible { outline: 2px solid ${colors.rose}; outline-offset: 0; }
  .link { align-self: center; border: 0; background: none; color: #6B5659; font: 14px ${fonts.sans}; cursor: pointer; }
  .link strong { color: ${colors.roseDark}; }
  .small-link { align-self: flex-end; margin-top: -6px; border: 0; background: none; color: ${colors.roseDark}; font: 13px ${fonts.sans}; cursor: pointer; }
  .error { padding: 10px 12px; border-radius: 10px; background: #FFF1F2; color: #A12C3B; font-size: 13px; }
  .ok { padding: 10px 12px; border-radius: 10px; background: #EEF7F0; color: ${colors.success}; font-size: 13px; }
  .consent { margin-top: -4px; color: ${colors.muted}; font-size: 12px; line-height: 1.5; text-align: center; }
  .consent a { color: ${colors.roseDark}; text-decoration: underline; }
  .info { padding: 14px; border-radius: 14px; background: ${colors.blush}; color: ${colors.plum}; font-size: 14px; line-height: 1.6; }
  @media (max-width: 480px) { padding: 28px 20px; }
`

const Orders = styled.section`
  display: grid;
  gap: 10px;
  max-height: 46vh;
  overflow-y: auto;
  h3 { color: ${colors.plum}; font: italic 400 20px ${fonts.serif}; }
  .muted { color: ${colors.muted}; font-size: 13px; }
  article { display: grid; gap: 6px; padding: 14px; border: 1px solid ${colors.line}; border-radius: 16px; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .top strong { font-size: 14px; letter-spacing: .4px; }
  .items { color: ${colors.plum}; font-size: 13px; line-height: 1.5; }
  .pill { padding: 3px 10px; border-radius: 999px; background: #EFE9E9; color: #6F5F61; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .pill.pending { background: #FFF2DC; color: #9A5B00; }
  .pill.confirmed, .pill.paid, .pill.shipped { background: ${colors.blush}; color: ${colors.roseDark}; }
  .pill.delivered { background: #EAF5EC; color: ${colors.success}; }
  .actions { display: flex; flex-wrap: wrap; gap: 8px; }
  .actions button, .actions a { min-height: 36px; padding: 0 14px; display: inline-flex; align-items: center; border: 0; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font: 600 12px ${fonts.sans}; cursor: pointer; }
  .actions .ghost { border: 1px solid ${colors.lineStrong}; background: ${colors.white}; color: ${colors.plum}; }
`

const Close = styled(RoundButton)`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 40px;
  height: 40px;
  font-size: 20px;
`

const formatPrice = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const AccountModal = ({ isOpen, customer, recoveringPassword, onClose, onNotify, onPasswordUpdated, settings, onReorder }: AccountModalProps) => {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const [orders, setOrders] = useState<StoreOrder[]>([])
  const [ordersState, setOrdersState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [pixOrderId, setPixOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !customer) return undefined
    let active = true
    setOrdersState('loading')
    fetchMyOrders(customer.id)
      .then((loaded) => { if (active) { setOrders(loaded); setOrdersState('idle') } })
      .catch(() => { if (active) setOrdersState('error') })
    return () => { active = false }
  }, [customer, isOpen])

  useEffect(() => {
    if (!isOpen) return undefined
    setError('')
    setSuccess('')
    setPassword('')
    if (recoveringPassword) setMode('newPassword')
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.setTimeout(() => firstFieldRef.current?.focus(), 50)
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose, recoveringPassword])

  if (!isOpen) return null

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setSuccess('')
    try {
      if (mode === 'signin') {
        await signInCustomer(email, password)
        onNotify('Bem-vinda de volta ♡')
        onClose()
      } else if (mode === 'signup') {
        if (name.trim().length < 2) throw new Error('Informe seu nome.')
        const needsConfirmation = await signUpCustomer(name, email, password)
        if (needsConfirmation) {
          setSuccess(`Quase lá! Enviamos um link de confirmação para ${email.trim()}. Abra seu e-mail para ativar a conta.`)
        } else {
          onNotify('Conta criada! Bem-vinda ♡')
          onClose()
        }
      } else if (mode === 'forgot') {
        await sendPasswordReset(email)
        setSuccess('Se este e-mail tiver cadastro, você vai receber um link para criar uma nova senha.')
      } else if (mode === 'newPassword') {
        if (password.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.')
        await updateCustomerPassword(password)
        onPasswordUpdated()
        onNotify('Senha atualizada ♡')
        onClose()
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível concluir agora. Tente novamente.')
    } finally {
      setBusy(false)
    }
  }

  const handleSignOut = async () => {
    setBusy(true)
    try {
      await signOutCustomer()
      onNotify('Você saiu da sua conta')
      onClose()
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Não foi possível sair agora.')
    } finally {
      setBusy(false)
    }
  }

  const titles: Record<Mode, string> = {
    signin: 'Que bom te ver!',
    signup: 'Crie sua conta',
    forgot: 'Esqueci minha senha',
    newPassword: 'Crie uma nova senha'
  }

  return (
    <Backdrop $center $z={120} onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }}>
      <ModalCard role="dialog" aria-modal="true" aria-labelledby="account-title" $width={customer && mode !== 'newPassword' ? '520px' : undefined}>
        <Close type="button" onClick={onClose} aria-label="Fechar">×</Close>
        {customer && mode !== 'newPassword' ? (
          <Body as="div">
            <img src={boutiqueLogo} alt="" />
            <h2 id="account-title">Olá{customer.name ? `, ${customer.name.split(' ')[0]}` : ''}!</h2>
            <p className="lead">{customer.email}</p>
            <Orders aria-labelledby="my-orders-title">
              <h3 id="my-orders-title">Meus pedidos</h3>
              {ordersState === 'loading' && <p className="muted">Carregando seus pedidos...</p>}
              {ordersState === 'error' && <p className="muted">Não foi possível carregar seus pedidos agora.</p>}
              {ordersState === 'idle' && orders.length === 0 && (
                <p className="muted">Seus pedidos feitos com a conta aparecem aqui, com a etapa de cada um.</p>
              )}
              {orders.map((order) => {
                const pix = unitPix(settings, order.unit_id || order.unit.name)
                const canPay = order.payment === 'Pix' && (order.status === 'pending' || order.status === 'confirmed') && Boolean(pix)
                return (
                  <article key={order.id}>
                    <div className="top">
                      <strong>{order.reference}</strong>
                      <span className={`pill ${order.status}`}>{orderStatusLabel(order)}</span>
                    </div>
                    <p className="muted">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')} · {order.items.reduce((sum, item) => sum + item.quantity, 0)} peça(s) · {formatPrice(orderTotal(order))}
                    </p>
                    <p className="items">{order.items.map((item) => `${item.quantity}x ${item.name} (${item.size}, ${item.color})`).join(' · ')}</p>
                    <div className="actions">
                      {canPay && (
                        <button type="button" onClick={() => setPixOrderId((current) => (current === order.id ? null : order.id))}>
                          {pixOrderId === order.id ? 'Fechar Pix' : 'Pagar com Pix'}
                        </button>
                      )}
                      {order.status === 'delivered' && order.review_token && (
                        <a href={`/avaliar/${order.review_token}`}>Avaliar peças</a>
                      )}
                      {order.status !== 'pending' && (
                        <button type="button" className="ghost" onClick={() => onReorder(order.items)}>Comprar de novo</button>
                      )}
                    </div>
                    {canPay && pixOrderId === order.id && pix && (
                      <PixPayment pixKey={pix.key} name={pix.name} city={pix.city} amount={orderTotal(order)} reference={order.reference} compact />
                    )}
                  </article>
                )
              })}
            </Orders>
            {error && <p className="error" role="alert">{error}</p>}
            <PrimaryButton type="button" onClick={handleSignOut} disabled={busy}>{busy ? 'Saindo...' : 'Sair da conta'}</PrimaryButton>
          </Body>
        ) : (
          <Body onSubmit={handleSubmit}>
            <img src={boutiqueLogo} alt="" />
            <h2 id="account-title">{titles[mode]}</h2>
            <p className="lead">
              {mode === 'forgot' ? 'Informe seu e-mail e enviaremos um link para criar uma nova senha.'
                : mode === 'newPassword' ? 'Digite a nova senha da sua conta.'
                  : 'Entre para finalizar mais rápido e salvar seus dados.'}
            </p>
            {mode === 'signup' && (
              <label>Nome
                <input ref={firstFieldRef} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} />
              </label>
            )}
            {mode !== 'newPassword' && (
              <label>E-mail
                <input
                  ref={mode === 'signup' ? undefined : firstFieldRef}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="voce@email.com"
                  required
                />
              </label>
            )}
            {mode !== 'forgot' && (
              <label>{mode === 'newPassword' ? 'Nova senha' : 'Senha'}
                <input
                  ref={mode === 'newPassword' ? firstFieldRef : undefined}
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  minLength={6}
                  required
                />
              </label>
            )}
            {mode === 'signin' && <button type="button" className="small-link" onClick={() => switchMode('forgot')}>Esqueci minha senha</button>}
            {error && <p className="error" role="alert">{error}</p>}
            {success && <p className="ok" role="status">{success}</p>}
            <PrimaryButton type="submit" disabled={busy}>
              {busy ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Enviar link' : 'Salvar nova senha'}
            </PrimaryButton>
            {mode === 'signup' && (
              <p className="consent">
                Ao criar a conta, você concorda com os <a href="/termos-e-condicoes" target="_blank" rel="noreferrer">Termos</a> e a{' '}
                <a href="/privacidade" target="_blank" rel="noreferrer">Política de Privacidade</a>.
              </p>
            )}
            {mode === 'signin' && <button type="button" className="link" onClick={() => switchMode('signup')}>Ainda não tem conta? <strong>Cadastre-se</strong></button>}
            {(mode === 'signup' || mode === 'forgot') && <button type="button" className="link" onClick={() => switchMode('signin')}>Já tenho conta · <strong>Entrar</strong></button>}
          </Body>
        )}
      </ModalCard>
    </Backdrop>
  )
}

export default AccountModal
