import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { colors, fonts } from '../../styles/tokens'
import { fetchReviewRequest, ReviewRequest, submitReview, uploadReviewPhoto } from '../../services/reviews'
import { trackEvent } from '../../services/analytics'
import boutiqueLogo from '../../assets/bella-chic-logo.jpg'

const Page = styled.main`
  min-height: 100vh;
  padding: 40px 16px 64px;
  background: ${colors.page};
  color: ${colors.plum};
`

const Content = styled.div`
  width: min(720px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 20px;
  .brand { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .brand img { width: 64px; height: 64px; border-radius: 50%; }
  .brand a { color: ${colors.roseDark}; font-size: 14px; font-weight: 600; }
  h1 { font: 400 clamp(28px, 5vw, 40px)/1.15 ${fonts.serif}; }
  h1 em { color: ${colors.rose}; }
  .lead { color: ${colors.muted}; font-size: 15px; line-height: 1.6; }
  .state { padding: 28px; border-radius: 20px; background: ${colors.blushSoft}; color: ${colors.muted}; text-align: center; }
`

const ItemCard = styled.form`
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr);
  gap: 18px;
  padding: 20px;
  border: 1px solid ${colors.line};
  border-radius: 20px;
  background: ${colors.white};
  > img { width: 96px; height: 128px; border-radius: 14px; object-fit: cover; background: ${colors.photoBg}; }
  .body { display: grid; gap: 12px; min-width: 0; }
  h2 { font-size: 17px; font-weight: 600; }
  .variant { color: ${colors.muted}; font-size: 13px; }
  fieldset { border: 0; padding: 0; margin: 0; }
  legend { margin-bottom: 6px; color: #6B5659; font-size: 13px; }
  .stars { display: flex; gap: 4px; }
  .stars label { cursor: pointer; font-size: 30px; line-height: 1; color: #E6D3D6; transition: color .15s; }
  .stars label.on { color: #D9A21B; }
  .stars input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .stars input:focus-visible + span { outline: 2px solid ${colors.rose}; outline-offset: 2px; border-radius: 4px; }
  textarea { width: 100%; min-height: 96px; padding: 12px 14px; border: 1px solid ${colors.lineStrong}; border-radius: 14px; color: ${colors.plum}; font: 14px/1.5 ${fonts.sans}; resize: vertical; }
  .photos { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .photos img { width: 64px; height: 80px; border-radius: 10px; object-fit: cover; }
  .photos label { display: inline-flex; align-items: center; min-height: 40px; padding: 0 14px; border: 1px dashed ${colors.roseLight}; border-radius: 999px; color: ${colors.roseDark}; font-size: 13px; font-weight: 600; cursor: pointer; }
  .photos input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .photos .remove { border: 0; background: none; color: ${colors.muted}; font-size: 12px; text-decoration: underline; cursor: pointer; }
  button[type='submit'] { justify-self: start; min-height: 46px; padding: 0 26px; border: 0; border-radius: 999px; background: ${colors.rose}; color: ${colors.white}; font: 600 14px ${fonts.sans}; cursor: pointer; }
  button[type='submit']:disabled { opacity: .6; cursor: wait; }
  .error { color: #A12C3B; font-size: 13px; font-weight: 600; }
  .done { color: ${colors.success}; font-weight: 600; }
  @media (max-width: 520px) { grid-template-columns: 1fr; > img { width: 100%; height: 220px; } }
`

type Draft = { rating: number; comment: string; files: File[]; sending: boolean; error: string }

const emptyDraft: Draft = { rating: 0, comment: '', files: [], sending: false, error: '' }

const ReviewPage = () => {
  const { token = '' } = useParams()
  const [request, setRequest] = useState<ReviewRequest | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'invalid' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})

  useEffect(() => {
    document.title = 'Avalie suas peças | Bella Chic Boutique'
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, nofollow'
    document.head.appendChild(robots)
    return () => robots.remove()
  }, [])

  useEffect(() => {
    let active = true
    fetchReviewRequest(token)
      .then((loaded) => {
        if (!active) return
        setRequest(loaded)
        setState(loaded ? 'ready' : 'invalid')
      })
      .catch((error: Error) => {
        if (!active) return
        setMessage(error.message)
        setState('error')
      })
    return () => { active = false }
  }, [token])

  const draftOf = (productId: number) => drafts[productId] || emptyDraft
  const update = (productId: number, change: Partial<Draft>) =>
    setDrafts((current) => ({ ...current, [productId]: { ...(current[productId] || emptyDraft), ...change } }))

  const addFiles = (productId: number, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    const current = draftOf(productId).files
    update(productId, { files: [...current, ...files].slice(0, 3), error: '' })
  }

  const send = async (productId: number, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const draft = draftOf(productId)
    if (!draft.rating) {
      update(productId, { error: 'Escolha de 1 a 5 estrelas.' })
      return
    }
    update(productId, { sending: true, error: '' })
    try {
      const photos: string[] = []
      for (const file of draft.files) photos.push(await uploadReviewPhoto(token, file))
      await submitReview({ token, productId, rating: draft.rating, comment: draft.comment, photos })
      trackEvent('review_sent', { item_id: String(productId), rating: draft.rating })
      setRequest((current) => current && {
        ...current,
        items: current.items.map((item) => (item.productId === productId ? { ...item, reviewed: true } : item))
      })
      update(productId, { sending: false })
    } catch (error) {
      update(productId, { sending: false, error: error instanceof Error ? error.message : 'Não foi possível enviar.' })
    }
  }

  return (
    <Page>
      <Content>
        <div className="brand">
          <img src={boutiqueLogo} alt="Bella Chic Boutique" />
          <Link to="/">Voltar à loja</Link>
        </div>

        {state === 'loading' && <p className="state">Carregando seu pedido...</p>}
        {state === 'invalid' && (
          <p className="state">Este link de avaliação não vale mais. Ele funciona por 60 dias depois da entrega. Se precisar, fale com a loja pelo WhatsApp.</p>
        )}
        {state === 'error' && <p className="state">{message}</p>}

        {state === 'ready' && request && (
          <>
            <div>
              <h1>Como foram suas peças{request.firstName ? `, ${request.firstName}` : ''}? <em>{'♡'}</em></h1>
              <p className="lead">Pedido {request.reference}. Sua opinião ajuda outras clientes a escolher. A avaliação aparece no site depois que a loja conferir, só com seu primeiro nome e a inicial do sobrenome.</p>
            </div>
            {request.items.map((item) => {
              const draft = draftOf(item.productId)
              return (
                <ItemCard key={item.productId} onSubmit={(event: FormEvent<HTMLFormElement>) => send(item.productId, event)} noValidate>
                  {item.image ? <img src={item.image} alt="" /> : <img src={boutiqueLogo} alt="" />}
                  <div className="body">
                    <div>
                      <h2>{item.name}</h2>
                      <span className="variant">Tamanho {item.size} · {item.color}</span>
                    </div>
                    {item.reviewed ? (
                      <p className="done" role="status">Avaliação enviada. Obrigada!</p>
                    ) : (
                      <>
                        <fieldset>
                          <legend>Sua nota</legend>
                          <div className="stars" role="radiogroup" aria-label={`Nota para ${item.name}`}>
                            {[1, 2, 3, 4, 5].map((value) => (
                              <label key={value} className={value <= draft.rating ? 'on' : ''}>
                                <input type="radio" name={`rating-${item.productId}`} value={value} checked={draft.rating === value} onChange={() => update(item.productId, { rating: value, error: '' })} aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`} />
                                <span aria-hidden="true">★</span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <label htmlFor={`comment-${item.productId}`} className="variant">Conte o que achou (opcional)
                          <textarea id={`comment-${item.productId}`} value={draft.comment} maxLength={600} onChange={(event) => update(item.productId, { comment: event.target.value })} placeholder="Caimento, tecido, tamanho, entrega..." />
                        </label>
                        <div className="photos">
                          {draft.files.map((file, index) => (
                            <span key={`${file.name}-${index}`}>
                              <img src={URL.createObjectURL(file)} alt={`Foto ${index + 1}`} />
                              <button type="button" className="remove" onClick={() => update(item.productId, { files: draft.files.filter((_file, fileIndex) => fileIndex !== index) })}>remover</button>
                            </span>
                          ))}
                          {draft.files.length < 3 && (
                            <label>
                              + Adicionar foto
                              <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => addFiles(item.productId, event)} />
                            </label>
                          )}
                        </div>
                        {draft.error && <p className="error" role="alert">{draft.error}</p>}
                        <button type="submit" disabled={draft.sending}>{draft.sending ? 'Enviando...' : 'Enviar avaliação'}</button>
                      </>
                    )}
                  </div>
                </ItemCard>
              )
            })}
          </>
        )}
      </Content>
    </Page>
  )
}

export default ReviewPage
