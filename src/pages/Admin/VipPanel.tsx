import { useCallback, useEffect, useMemo, useState } from 'react'
import { deleteVipSubscriber, fetchVipSubscribers, setVipUnsubscribed, VipSubscriber } from '../../services/vip'
import { downloadTextFile } from '../../utils/reports'
import { AdminButton, AdminNotice, AdminPanel, DataTable, PanelHeading } from './styles'

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? '' : String(value)
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

const VipPanel = () => {
  const [subscribers, setSubscribers] = useState<VipSubscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSubscribers(await fetchVipSubscribers())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a lista.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const active = useMemo(() => subscribers.filter((subscriber) => !subscriber.unsubscribedAt), [subscribers])
  const visible = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return subscribers.filter((subscriber) => !term || `${subscriber.name || ''} ${subscriber.phone}`.toLocaleLowerCase('pt-BR').includes(term))
  }, [search, subscribers])

  const exportCsv = () => {
    const header = ['Nome', 'WhatsApp', 'Entrou em', 'Autorização', 'Situação']
    const rows = subscribers.map((subscriber) => [
      subscriber.name || '', subscriber.phone, new Date(subscriber.consentedAt).toLocaleString('pt-BR'),
      subscriber.consentText, subscriber.unsubscribedAt ? 'Saiu da lista' : 'Ativa'
    ])
    downloadTextFile(`lista-vip-bella-chic-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + [header, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n'))
  }

  const copyNumbers = async () => {
    const text = active.map((subscriber) => subscriber.phone).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setNotice(`${active.length} números copiados. Cole na sua lista de transmissão do WhatsApp.`)
    } catch {
      window.prompt('Copie os números:', text)
    }
  }

  const act = async (subscriber: VipSubscriber, action: 'leave' | 'return' | 'delete') => {
    if (action === 'delete' && !window.confirm(`Apagar ${subscriber.phone} da lista de vez?`)) return
    try {
      if (action === 'delete') await deleteVipSubscriber(subscriber.id)
      else await setVipUnsubscribed(subscriber.id, action === 'leave')
      load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível atualizar a lista.')
    }
  }

  return (
    <AdminPanel>
      <PanelHeading>
        <h2>Lista VIP ({active.length})</h2>
        <div className="controls">
          <label className="sr-only" htmlFor="vip-search">Buscar</label>
          <input id="vip-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome ou WhatsApp" style={{ padding: '9px 10px', border: '1px solid #e8dedd', fontSize: 12 }} />
          <AdminButton type="button" className="secondary" onClick={copyNumbers} disabled={!active.length}>Copiar números</AdminButton>
          <AdminButton type="button" className="secondary" onClick={exportCsv} disabled={!subscribers.length}>Exportar (planilha)</AdminButton>
        </div>
      </PanelHeading>
      <p>Contatos que pediram para receber novidades, com a autorização registrada. Se alguém pedir para sair, marque “Saiu da lista” e não envie mais mensagens.</p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {notice && <AdminNotice role="status">{notice}</AdminNotice>}
      {loading ? <p>Carregando...</p> : visible.length === 0 ? <p>Ninguém na lista ainda.</p> : (
        <DataTable>
          <table>
            <thead><tr><th>Nome</th><th>WhatsApp</th><th>Entrou em</th><th>Situação</th><th /></tr></thead>
            <tbody>
              {visible.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td>{subscriber.name || <span className="muted">—</span>}</td>
                  <td>{subscriber.phone}</td>
                  <td className="muted">{new Date(subscriber.consentedAt).toLocaleDateString('pt-BR')}</td>
                  <td className={subscriber.unsubscribedAt ? 'muted' : 'in'}>{subscriber.unsubscribedAt ? 'Saiu da lista' : 'Ativa'}</td>
                  <td>
                    <div className="actions">
                      {subscriber.unsubscribedAt
                        ? <AdminButton type="button" className="secondary" onClick={() => act(subscriber, 'return')}>Voltar para a lista</AdminButton>
                        : <AdminButton type="button" className="secondary" onClick={() => act(subscriber, 'leave')}>Saiu da lista</AdminButton>}
                      <AdminButton type="button" className="danger" onClick={() => act(subscriber, 'delete')}>Apagar</AdminButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}
    </AdminPanel>
  )
}

export default VipPanel
