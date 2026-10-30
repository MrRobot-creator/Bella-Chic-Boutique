import { FormEvent, useCallback, useEffect, useState } from 'react'
import { storeConfig } from '../../config/store'
import { fetchTeam, removeTeamMember, saveTeamMember, TeamMember } from '../../services/team'
import { isValidEmail } from '../../services/emails'
import { unitNameOf } from '../../utils/units'
import { AdminButton, AdminNotice, AdminPanel, DataTable, FormGrid } from './styles'

const OWNER = 'dona'

const roleLabel = (unitId: string | null) => (unitId ? `Atendente da ${unitNameOf(unitId)}` : 'Dona (as duas lojas)')

const TeamPanel = () => {
  const [team, setTeam] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState(storeConfig.units[0].id)
  const [saving, setSaving] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setTeam(await fetchTeam())
      setError('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar a equipe.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const save = async (memberEmail: string, nextRole: string, success: string) => {
    setError('')
    setNotice('')
    setSaving(true)
    try {
      await saveTeamMember(memberEmail, nextRole === OWNER ? null : nextRole)
      setNotice(success)
      await load()
      return true
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Não foi possível salvar.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const add = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValidEmail(email)) {
      setError('Informe o e-mail da conta da atendente.')
      return
    }
    const ok = await save(email, role, `${email.trim()} agora entra no painel como ${roleLabel(role === OWNER ? null : role).toLowerCase()}.`)
    if (ok) setEmail('')
  }

  const remove = async (member: TeamMember) => {
    setError('')
    setNotice('')
    setSaving(true)
    try {
      await removeTeamMember(member.userId)
      setConfirmRemove(null)
      setNotice(`${member.email} não entra mais no painel.`)
      await load()
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Não foi possível tirar da equipe.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPanel>
      <h2>Equipe</h2>
      <p>A dona vê as duas lojas. A atendente vê o estoque das duas lojas, para ajudar nas vendas, mas os pedidos, as vendas no balcão, o histórico e o faturamento só da loja dela.</p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {notice && <AdminNotice role="status">{notice}</AdminNotice>}

      {loading ? <p>Carregando...</p> : (
        <DataTable style={{ marginBottom: 20 }}>
          <table>
            <thead><tr><th>E-mail</th><th>Acesso</th><th /></tr></thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.userId}>
                  <td>{member.email}{member.isMe && <span className="muted"> · você</span>}</td>
                  <td>
                    {member.isMe ? roleLabel(member.unitId) : (
                      <select
                        id={`team-role-${member.userId}`}
                        aria-label={`Acesso de ${member.email}`}
                        value={member.unitId || OWNER}
                        disabled={saving}
                        onChange={(event) => save(member.email, event.target.value, `${member.email}: ${roleLabel(event.target.value === OWNER ? null : event.target.value).toLowerCase()}.`)}
                        style={{ padding: 8 }}
                      >
                        {storeConfig.units.map((unit) => <option key={unit.id} value={unit.id}>Atendente da {unit.name}</option>)}
                        <option value={OWNER}>Dona (as duas lojas)</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {!member.isMe && (confirmRemove === member.userId ? (
                      <div className="actions">
                        <AdminButton type="button" className="danger" disabled={saving} onClick={() => remove(member)}>Tirar do painel</AdminButton>
                        <AdminButton type="button" className="secondary" onClick={() => setConfirmRemove(null)}>Manter</AdminButton>
                      </div>
                    ) : (
                      <AdminButton type="button" className="secondary" onClick={() => setConfirmRemove(member.userId)}>Tirar</AdminButton>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTable>
      )}

      <h3 style={{ margin: '4px 0 10px', font: "17px 'Playfair Display', Georgia, serif", color: '#594548' }}>Adicionar pessoa</h3>
      <p className="muted" style={{ fontSize: 12 }}>
        Primeiro crie a conta dela em Supabase › Authentication › Users › Add user (e-mail e senha, marcando “Auto Confirm User”). Depois informe o e-mail aqui.
      </p>
      <form onSubmit={add}>
        <FormGrid>
          <label>E-mail da conta
            <input id="team-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="atendente@email.com" />
          </label>
          <label>Acesso
            <select id="team-role" value={role} onChange={(event) => setRole(event.target.value)}>
              {storeConfig.units.map((unit) => <option key={unit.id} value={unit.id}>Atendente da {unit.name}</option>)}
              <option value={OWNER}>Dona (as duas lojas)</option>
            </select>
          </label>
          <div style={{ alignSelf: 'end' }}>
            <AdminButton type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Adicionar ao painel'}</AdminButton>
          </div>
        </FormGrid>
      </form>
    </AdminPanel>
  )
}

export default TeamPanel
