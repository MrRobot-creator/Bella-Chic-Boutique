/** Regras de senha iguais às do Supabase Auth (mínimo 8, minúscula, maiúscula e número). */
export const PASSWORD_MIN_LENGTH = 8

export const PASSWORD_HINT = 'Use pelo menos 8 caracteres, com letra minúscula, letra maiúscula e número.'

/** Retorna o que falta na senha, em português, ou '' quando ela está válida. */
export const passwordProblem = (password: string): string => {
  const missing: string[] = []
  if (password.length < PASSWORD_MIN_LENGTH) missing.push(`${PASSWORD_MIN_LENGTH} caracteres`)
  if (!/[a-z]/.test(password)) missing.push('uma letra minúscula')
  if (!/[A-Z]/.test(password)) missing.push('uma letra maiúscula')
  if (!/[0-9]/.test(password)) missing.push('um número')
  if (missing.length === 0) return ''
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} e ${missing[missing.length - 1]}`
  return `A senha precisa ter pelo menos ${list}.`
}
