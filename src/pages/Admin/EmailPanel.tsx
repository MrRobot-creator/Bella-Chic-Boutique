import { FormEvent, useCallback, useEffect, useState } from 'react'
import {
  EmailSettings,
  emailEventLabel,
  emailStatus,
  fetchEmailSettings,
  fetchRecentEmails,
  isFreeMailbox,
  isValidEmail,
  normalizeSiteUrl,
  SentEmail,
  sendTestEmail,
  updateEmailSettings
} from '../../services/emails'
import { AdminButton, AdminNotice, AdminPanel, DataTable, FormGrid } from './styles'

type EmailPanelProps = {
  adminEmail: string
}

const statusLabels = {
  sent: 'Enviado',
  waiting: 'Na fila',
  error: 'Erro',
  unknown: 'Sem retorno'
}

const emptySettings: EmailSettings = { enabled: false, senderName: 'Bella Chic Boutique', senderAddress: '', replyTo: '', siteUrl: '' }

const EmailPanel = ({ adminEmail }: EmailPanelProps) => {
  const [installed, setInstalled] = useState<boolean | null>(null)
  const [draft, setDraft] = useState<EmailSettings>(emptySettings)
  const [recent, setRecent] = useState<SentEmail[]>([])
  const [testTo, setTestTo] = useState(adminEmail)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const loadRecent = useCallback(async () => {
    try {
      setRecent(await fetchRecentEmails(15))
    } catch {
      setRecent([])
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchEmailSettings().then((loaded) => {
      if (!active) return
      setInstalled(Boolean(loaded))
      if (loaded) {
        setDraft({ ...loaded, senderName: loaded.senderName || emptySettings.senderName, siteUrl: loaded.siteUrl || window.location.origin })
        loadRecent()
      }
    })
    return () => { active = false }
  }, [loadRecent])

  useEffect(() => { setTestTo(adminEmail) }, [adminEmail])

  const update = (change: Partial<EmailSettings>) => setDraft((current) => ({ ...current, ...change }))

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const address = draft.senderAddress.trim()
    if (address && !isValidEmail(address)) {
      setError('O remetente precisa ser um e-mail, por exemplo pedidos@bellachicboutique.com.br.')
      return
    }
    if (address && isFreeMailbox(address)) {
      setError('O Resend não envia por Gmail, Hotmail e parecidos. Use um e-mail do domínio da loja, verificado no Resend.')
      return
    }
    if (draft.replyTo.trim() && !isValidEmail(draft.replyTo)) {
      setError('Confira o e-mail para respostas.')
      return
    }
    if (draft.siteUrl.trim() && !normalizeSiteUrl(draft.siteUrl)) {
      setError('Confira o endereço do site.')
      return
    }
    if (draft.enabled && !address) {
      setError('Informe o remetente antes de ligar os e-mails.')
      return
    }
    setSaving(true)
    try {
      const saved = await updateEmailSettings(draft)
      setDraft(saved)
      setNotice(saved.enabled ? 'Salvo. As clientes que informarem e-mail no pedido vão receber os avisos.' : 'Salvo. Os e-mails de pedido estão desligados.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  const test = async () => {
    setError('')
    setNotice('')
    if (!isValidEmail(testTo)) {
      setError('Informe um e-mail válido para o teste.')
      return
    }
    setTesting(true)
    try {
      await sendTestEmail(testTo)
      setNotice(`E-mail de teste enviado para ${testTo.trim()}. Confira a caixa de entrada e o spam em 1 minuto.`)
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Não foi possível enviar o teste.')
    } finally {
      setTesting(false)
    }
  }

  if (installed === null) return null

  return (
    <AdminPanel>
      <h2>E-mails para as clientes</h2>
      {!installed ? (
        <AdminNotice role="status">
          Para mandar e-mails de pedido (recebido com Pix, confirmado, pago, enviado, entregue e cancelado), rode
          {' '}<b>supabase/v4-emails.sql</b> no SQL Editor do Supabase e siga o guia em supabase/email-templates/README.md.
        </AdminNotice>
      ) : (
        <>
          <p>Quando a cliente informa o e-mail no pedido, ela recebe um aviso a cada etapa. Os envios saem pelo Resend, com o domínio da loja.</p>
          {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
          {notice && <AdminNotice role="status">{notice}</AdminNotice>}
          <form onSubmit={submit}>
            <FormGrid>
              <label className="check wide">
                <input type="checkbox" checked={draft.enabled} onChange={(event) => update({ enabled: event.target.checked })} />
                Mandar e-mails de pedido para as clientes
              </label>
              <label>Nome do remetente
                <input value={draft.senderName} onChange={(event) => update({ senderName: event.target.value })} maxLength={60} />
              </label>
              <label>E-mail do remetente
                <input type="email" value={draft.senderAddress} onChange={(event) => update({ senderAddress: event.target.value })} placeholder="pedidos@bellachicboutique.com.br" />
                <span className="hint">Precisa ser do domínio verificado no Resend.</span>
              </label>
              <label>Respostas vão para
                <input type="email" value={draft.replyTo} onChange={(event) => update({ replyTo: event.target.value })} placeholder="bellachicboutique12@gmail.com" />
                <span className="hint">Quando a cliente responder o e-mail. Pode ser Gmail.</span>
              </label>
              <label className="wide">Endereço do site
                <input value={draft.siteUrl} onChange={(event) => update({ siteUrl: event.target.value })} placeholder="https://bellachicboutique.com.br" />
                <span className="hint">Usado no logo e no link de avaliação: {normalizeSiteUrl(draft.siteUrl) || '—'}</span>
              </label>
            </FormGrid>
            <AdminButton type="submit" disabled={saving} style={{ marginTop: 16 }}>{saving ? 'Salvando...' : 'Salvar e-mails'}</AdminButton>
          </form>

          <h3 style={{ margin: '24px 0 10px', font: "17px 'Playfair Display', Georgia, serif", color: '#594548' }}>Testar</h3>
          <FormGrid>
            <label>Mandar um pedido de exemplo para
              <input type="email" value={testTo} onChange={(event) => setTestTo(event.target.value)} />
            </label>
            <div style={{ alignSelf: 'end' }}>
              <AdminButton type="button" className="secondary" onClick={test} disabled={testing}>{testing ? 'Enviando...' : 'Mandar e-mail de teste'}</AdminButton>
            </div>
          </FormGrid>

          <h3 style={{ margin: '24px 0 10px', font: "17px 'Playfair Display', Georgia, serif", color: '#594548' }}>Últimos envios</h3>
          {recent.length === 0 ? <p>Nenhum e-mail de pedido enviado ainda.</p> : (
            <DataTable>
              <table>
                <thead><tr><th>Quando</th><th>Pedido</th><th>Etapa</th><th>Para</th><th>Situação</th></tr></thead>
                <tbody>
                  {recent.map((email) => {
                    const status = emailStatus(email)
                    return (
                      <tr key={email.id}>
                        <td className="muted">{new Date(email.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                        <td>{email.reference || '—'}</td>
                        <td>{emailEventLabel(email.event)}</td>
                        <td>{email.toEmail}</td>
                        <td className={status === 'sent' ? 'in' : status === 'error' ? 'out' : 'muted'} title={email.error || undefined}>
                          {statusLabels[status]}{status === 'error' && email.error ? `: ${email.error.slice(0, 80)}` : ''}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </DataTable>
          )}
          <AdminButton type="button" className="secondary" onClick={loadRecent} style={{ marginTop: 12 }}>Atualizar lista</AdminButton>
        </>
      )}
    </AdminPanel>
  )
}

export default EmailPanel
