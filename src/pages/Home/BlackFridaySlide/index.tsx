import flyer from '../../../assets/black-friday-brinde.jpg'
import { giftPromo } from '../../../config/promo'
import { Copy, Flyer, Frame, Inner, Perks } from './styles'

/** Valores da ação de Black Friday. O brinde vem de config/promo; frete e cupom: ajuste aqui e no painel. */
const GIFT_MIN = (giftPromo?.minSubtotal ?? 250).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const FREE_SHIPPING_MIN = 'R$ 300'
const COUPON = 'BLACK10'

/** Destaque da Black Friday no carrossel: relógio de brinde, frete grátis e cupom de primeira compra. */
const BlackFridaySlide = () => (
  <Frame>
    <Inner>
      <Copy>
        <span className="eyebrow">Black Friday</span>
        <h2>
          <span>Ganhe um lindo</span>
          <em>relógio</em>
        </h2>
        <p>Nas compras acima de <strong>{GIFT_MIN}</strong>, você leva um relógio rosé de presente.</p>
        <Perks>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
            <span>Frete grátis a partir de {FREE_SHIPPING_MIN}</span>
          </li>
          <li>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></svg>
            <span>Cupom <strong>{COUPON}</strong>: 10% na 1ª compra a partir de {FREE_SHIPPING_MIN}</span>
          </li>
        </Perks>
        <a className="cta" href="#catalogo">Escolher meu look</a>
      </Copy>
      <Flyer
        src={flyer}
        alt={`Black Friday Bella Chic: brinde especial, relógio rosé nas compras acima de ${GIFT_MIN}`}
        width={720}
        height={900}
        decoding="async"
        draggable={false}
      />
    </Inner>
  </Frame>
)

export default BlackFridaySlide
