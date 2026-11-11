import { passwordProblem } from './password'

describe('passwordProblem', () => {
  it('aceita senha que cumpre todas as regras', () => {
    expect(passwordProblem('Bella2026')).toBe('')
  })

  it('aponta só o que falta', () => {
    expect(passwordProblem('bella2026')).toBe('A senha precisa ter pelo menos uma letra maiúscula.')
    expect(passwordProblem('Bella')).toBe('A senha precisa ter pelo menos 8 caracteres e um número.')
  })

  it('lista tudo quando a senha está vazia', () => {
    expect(passwordProblem('')).toBe(
      'A senha precisa ter pelo menos 8 caracteres, uma letra minúscula, uma letra maiúscula e um número.'
    )
  })
})
