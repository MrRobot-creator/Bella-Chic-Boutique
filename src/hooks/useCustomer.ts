import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../services/catalog'

export type Customer = {
  id: string
  email: string
  name: string
}

const toCustomer = (session: Session | null): Customer | null => {
  const user = session?.user
  if (!user) return null
  const metadataName = typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : ''
  return { id: user.id, email: user.email || '', name: metadataName }
}

/** Cliente logada (Supabase Auth). null quando ninguém entrou. */
export const useCustomer = () => {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [recoveringPassword, setRecoveringPassword] = useState(false)

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (active) setCustomer(toCustomer(data.session))
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setCustomer(toCustomer(session))
      // A cliente abriu o link de "esqueci minha senha" do e-mail.
      if (event === 'PASSWORD_RECOVERY') setRecoveringPassword(true)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return { customer, recoveringPassword, finishPasswordRecovery: () => setRecoveringPassword(false) }
}

const authError = (error: Error) => {
  const message = error.message.toLowerCase()
  if (message.includes('invalid login credentials')) return new Error('E-mail ou senha incorretos.')
  if (message.includes('email not confirmed')) return new Error('Confirme seu e-mail pelo link que enviamos antes de entrar.')
  if (message.includes('already registered') || message.includes('already been registered')) return new Error('Este e-mail já tem cadastro. Entre com sua senha.')
  if (message.includes('password') && message.includes('characters')) return new Error('A senha precisa ter pelo menos 6 caracteres.')
  if (message.includes('rate limit')) return new Error('Muitas tentativas. Aguarde alguns minutos e tente de novo.')
  return error
}

const requireSupabase = () => {
  if (!supabase) throw new Error('O login ainda não está configurado.')
  return supabase
}

export const signInCustomer = async (email: string, password: string) => {
  const { error } = await requireSupabase().auth.signInWithPassword({ email: email.trim(), password })
  if (error) throw authError(error)
}

/** Cria a conta. Devolve true quando é preciso confirmar o e-mail antes de entrar. */
export const signUpCustomer = async (name: string, email: string, password: string) => {
  const { data, error } = await requireSupabase().auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() }, emailRedirectTo: window.location.origin }
  })
  if (error) throw authError(error)
  return !data.session
}

export const sendPasswordReset = async (email: string) => {
  const { error } = await requireSupabase().auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
  if (error) throw authError(error)
}

export const signOutCustomer = async () => {
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw authError(error)
}

export const updateCustomerPassword = async (password: string) => {
  const { error } = await requireSupabase().auth.updateUser({ password })
  if (error) throw authError(error)
}
