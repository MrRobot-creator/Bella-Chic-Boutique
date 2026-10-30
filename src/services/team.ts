import { supabase } from './catalog'

/** Equipe do painel. unitId null é a dona (vê as duas lojas). */
export type TeamMember = {
  userId: string
  email: string
  unitId: string | null
  isMe: boolean
  createdAt: string
}

type TeamRow = {
  user_id: string
  email: string
  unit_id: string | null
  is_me: boolean
  created_at: string
}

const requireSupabase = () => {
  if (!supabase) throw new Error('O Supabase não está configurado.')
  return supabase
}

const teamError = (message: string) => {
  if (/user not found/i.test(message)) return new Error('Não existe conta com esse e-mail. Crie o usuário em Supabase › Authentication › Users e tente de novo.')
  if (/cannot change your own access/i.test(message)) return new Error('Você não pode mudar o seu próprio acesso.')
  if (/not authorized/i.test(message)) return new Error('Só a dona da loja mexe na equipe.')
  if (/invalid store unit/i.test(message)) return new Error('Escolha uma loja da lista.')
  if (/could not find the function|schema cache/i.test(message)) return new Error('Rode supabase/v5-unidades.sql no SQL Editor do Supabase para liberar a equipe.')
  return new Error(message)
}

export const fetchTeam = async (): Promise<TeamMember[]> => {
  const { data, error } = await requireSupabase().rpc('list_store_team')
  if (error) throw teamError(error.message)
  return ((data || []) as TeamRow[]).map((row) => ({
    userId: row.user_id,
    email: row.email,
    unitId: row.unit_id,
    isMe: row.is_me,
    createdAt: row.created_at
  }))
}

export const saveTeamMember = async (email: string, unitId: string | null) => {
  const { error } = await requireSupabase().rpc('save_store_team_member', { p_email: email.trim(), p_unit_id: unitId })
  if (error) throw teamError(error.message)
}

export const removeTeamMember = async (userId: string) => {
  const { error } = await requireSupabase().rpc('remove_store_team_member', { p_user_id: userId })
  if (error) throw teamError(error.message)
}
