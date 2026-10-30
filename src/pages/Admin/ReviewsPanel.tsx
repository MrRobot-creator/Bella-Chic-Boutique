import { useCallback, useEffect, useState } from 'react'
import { deleteReview, fetchReviewsForModeration, moderateReview, ProductReview } from '../../services/reviews'
import { AdminButton, AdminNotice, AdminPanel, PanelHeading, RestockList } from './styles'

type Filter = ProductReview['status'] | 'all'

const labels: Record<Filter, string> = { pending: 'Aguardando', approved: 'Aprovadas', rejected: 'Recusadas', all: 'Todas' }

type ReviewsPanelProps = { onCountChange?: (pending: number) => void }

const ReviewsPanel = ({ onCountChange }: ReviewsPanelProps) => {
  const [filter, setFilter] = useState<Filter>('pending')
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const loaded = await fetchReviewsForModeration(filter)
      setReviews(loaded)
      if (filter === 'pending') onCountChange?.(loaded.length)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Não foi possível carregar as avaliações.')
    } finally {
      setLoading(false)
    }
  }, [filter, onCountChange])

  useEffect(() => { load() }, [load])

  const act = async (review: ProductReview, action: 'approved' | 'rejected' | 'delete') => {
    if (action === 'delete' && !window.confirm('Excluir esta avaliação de vez?')) return
    try {
      if (action === 'delete') await deleteReview(review.id)
      else await moderateReview(review.id, action)
      load()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Não foi possível atualizar a avaliação.')
    }
  }

  return (
    <AdminPanel>
      <PanelHeading>
        <h2>Avaliações</h2>
        <div className="controls">
          <label className="sr-only" htmlFor="reviews-filter">Mostrar</label>
          <select id="reviews-filter" value={filter} onChange={(event) => setFilter(event.target.value as Filter)}>
            {(Object.keys(labels) as Filter[]).map((key) => <option key={key} value={key}>{labels[key]}</option>)}
          </select>
        </div>
      </PanelHeading>
      <p>Quando você marca um pedido como entregue, a mensagem do WhatsApp leva o link para a cliente avaliar. A avaliação só aparece na peça depois que você aprovar.</p>
      {error && <AdminNotice $error role="alert">{error}</AdminNotice>}
      {loading ? <p>Carregando...</p> : reviews.length === 0 ? <p>Nenhuma avaliação aqui.</p> : (
        <RestockList>
          {reviews.map((review) => (
            <article key={review.id} className={review.status === 'approved' ? 'ready' : ''}>
              <div>
                <h3>{review.productName} <span style={{ color: '#D9A21B', letterSpacing: 1 }}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></h3>
                <p>{review.customerName} · {new Date(review.createdAt).toLocaleString('pt-BR')}</p>
                {review.comment && <p style={{ color: '#594548', fontSize: 13 }}>“{review.comment}”</p>}
                {review.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {review.photos.map((photo) => (
                      <a key={photo} href={photo} target="_blank" rel="noopener noreferrer"><img src={photo} alt="" style={{ width: 64, height: 80, objectFit: 'cover' }} /></a>
                    ))}
                  </div>
                )}
              </div>
              <div className="actions">
                {review.status !== 'approved' && <AdminButton type="button" onClick={() => act(review, 'approved')}>Aprovar</AdminButton>}
                {review.status !== 'rejected' && <AdminButton type="button" className="secondary" onClick={() => act(review, 'rejected')}>{review.status === 'approved' ? 'Tirar do site' : 'Recusar'}</AdminButton>}
                <AdminButton type="button" className="danger" onClick={() => act(review, 'delete')}>Excluir</AdminButton>
              </div>
            </article>
          ))}
        </RestockList>
      )}
    </AdminPanel>
  )
}

export default ReviewsPanel
