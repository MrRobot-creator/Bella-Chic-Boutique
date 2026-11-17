import { storeConfig } from '../../../config/store'
import modelPhoto from '../../../assets/banner-modelo-loja.jpg'
import { Copy, Frame, Photo, Pills } from './styles'

/** "@usuario" a partir do link do Instagram da loja. */
const instagramHandle = (url: string) => {
  const user = url.replace(/\/+$/, '').split('/').pop()
  return user ? `@${user}` : 'Instagram'
}

/**
 * Segundo destaque do carrossel: apresentação da loja com a modelo da casa dentro da Galeria Portuense.
 * Mesma moldura do primeiro banner, com a foto do outro lado para os dois não ficarem iguais.
 */
const WelcomeSlide = () => {
  const cities = Array.from(new Set(storeConfig.units.map((unit) => unit.city))).join(' e ')
  return (
    <Frame>
      <Photo
        src={modelPhoto}
        alt="Modelo da Bella Chic de vestido rosa, dentro da loja, ao lado dos vestidos e do letreiro da boutique"
        decoding="async"
        draggable={false}
      />
      <Copy>
        <span className="eyebrow">Bem-vinda à</span>
        <h2>
          <span>Bella Chic</span>
          <em>Boutique</em>
        </h2>
        <p>Moda feminina acessível, escolhida com carinho para você se sentir confiante e especial.</p>
        <Pills>
          <a className="place" href="#lojas">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
            {cities}<span className="state"> · PA</span>
          </a>
          <a className="instagram" href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
            {instagramHandle(storeConfig.instagramUrl)}
          </a>
        </Pills>
      </Copy>
    </Frame>
  )
}

export default WelcomeSlide
