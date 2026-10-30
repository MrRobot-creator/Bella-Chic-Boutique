import { FormEvent, MouseEvent, useEffect, useRef, useState } from 'react'
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
  .info { padding: 14px; border-radius: 14px; background: ${colors.blush}; color: ${colors.plum}; font-size: 14px; line-height: 1.6; }
  @media (max-width: 480px) { padding: 28px 20px; }
`

const Close = styled(RoundButton)`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 40px;
  height: 40px;
  font-size: 20px;
`

const AccountModal = ({ isOpen, customer, recoveringPassword, onClose, onNotify, onPasswordUpdated }: AccountModalProps) => {
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const firstFieldRef = useRef<HTMLInputElement>(null)

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
      <ModalCard role="dialog" aria-modal="true" aria-labelledby="account-title">
        <Close type="button" onClick={onClose} aria-label="Fechar">×</Close>
        {customer && mode !== 'newPassword' ? (
          <Body as="div">
            <img src={boutiqueLogo} alt="" />
            <h2 id="account-title">Olá{customer.name ? `, ${customer.name.split(' ')[0]}` : ''}!</h2>
            <p className="lead">{customer.email}</p>
            <div className="info">
              Ao finalizar um pedido, seu nome e e-mail já aparecem preenchidos. Em breve você vai acompanhar seus pedidos por aqui.
            </div>
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
            {mode === 'signin' && <button type="button" className="link" onClick={() => switchMode('signup')}>Ainda não tem conta? <strong>Cadastre-se</strong></button>}
            {(mode === 'signup' || mode === 'forgot') && <button type="button" className="link" onClick={() => switchMode('signin')}>Já tenho conta · <strong>Entrar</strong></button>}
          </Body>
        )}
      </ModalCard>
    </Backdrop>
  )
}

export default AccountModal
