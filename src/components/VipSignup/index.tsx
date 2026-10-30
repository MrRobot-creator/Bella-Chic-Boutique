import { FormEvent, useState } from 'react'
import styled from 'styled-components'
import { colors, fonts } from '../../styles/tokens'
import { joinVipList, VIP_CONSENT_TEXT } from '../../services/vip'
import { trackEvent } from '../../services/analytics'

const Band = styled.section`
  padding: 56px 0;
  background: ${colors.plum};
  color: ${colors.white};
`

const Inner = styled.div`
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 0 40px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 32px;
  align-items: center;
  .eyebrow { color: ${colors.logoPink}; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; }
  h2 { margin-top: 6px; font: italic 400 clamp(28px, 3.6vw, 38px)/1.15 ${fonts.serif}; }
  .lead { margin-top: 10px; max-width: 420px; color: #E2C9CE; font-size: 15px; line-height: 1.6; }
  form { display: grid; gap: 12px; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  label { display: grid; gap: 6px; color: #F3DDE1; font-size: 13px; }
  input[type='text'], input[type='tel'] { height: 48px; padding: 0 16px; border: 0; border-radius: 999px; background: ${colors.white}; color: ${colors.plum}; font: 14px ${fonts.sans}; }
  .consent { display: flex; align-items: flex-start; gap: 10px; color: #E2C9CE; font-size: 12px; line-height: 1.5; cursor: pointer; }
  .consent input { width: 18px; height: 18px; flex: none; margin-top: 1px; accent-color: ${colors.logoPink}; }
  .consent a { color: ${colors.logoPink}; text-decoration: underline; }
  button { justify-self: start; height: 48px; padding: 0 28px; border: 0; border-radius: 999px; background: ${colors.logoPink}; color: ${colors.plum}; font: 700 14px ${fonts.sans}; cursor: pointer; }
  button:disabled { opacity: .6; cursor: wait; }
  .feedback { font-size: 14px; font-weight: 600; }
  .feedback.error { color: #FFC2CC; }
  .done { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 600; }
  .done span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: ${colors.logoPink}; color: ${colors.plum}; }
  @media (max-width: 860px) { grid-template-columns: 1fr; }
  @media (max-width: 600px) { padding: 0 16px; .fields { grid-template-columns: 1fr; } button { justify-self: stretch; } }
`

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

const VipSignup = () => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const honeypot = event.currentTarget.elements.namedItem('company') as HTMLInputElement | null
    if (honeypot?.value) return
    setError('')
    if (!consent) {
      setError('Marque a autorização para entrar na lista.')
      return
    }
    setSending(true)
    try {
      await joinVipList(name, phone, consent)
      setDone(true)
      trackEvent('sign_up', { method: 'lista_vip' })
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Não foi possível entrar na lista agora.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Band id="lista-vip" aria-labelledby="vip-title">
      <Inner>
        <div>
          <span className="eyebrow">Lista VIP</span>
          <h2 id="vip-title">Novidades antes de todo mundo</h2>
          <p className="lead">Receba os lançamentos, as promoções e cupons exclusivos no seu WhatsApp. Sem spam, e você sai quando quiser.</p>
        </div>
        {done ? (
          <p className="done" role="status"><span aria-hidden="true">✓</span>Pronto! Você está na lista VIP da Bella Chic {'♡'}</p>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="fields">
              <label htmlFor="vip-name">Seu nome (opcional)
                <input id="vip-name" type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="given-name" maxLength={120} />
              </label>
              <label htmlFor="vip-phone">WhatsApp com DDD
                <input id="vip-phone" type="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} autoComplete="tel" placeholder="(91) 99999-9999" required />
              </label>
            </div>
            <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, opacity: 0 }} />
            <label className="consent" htmlFor="vip-consent">
              <input id="vip-consent" type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span>{VIP_CONSENT_TEXT} <a href="/privacidade">Política de Privacidade</a>.</span>
            </label>
            {error && <p className="feedback error" role="alert">{error}</p>}
            <button type="submit" disabled={sending}>{sending ? 'Enviando...' : 'Entrar na lista VIP'}</button>
          </form>
        )}
      </Inner>
    </Band>
  )
}

export default VipSignup
