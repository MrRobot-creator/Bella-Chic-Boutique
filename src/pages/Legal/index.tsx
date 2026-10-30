import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { storeConfig } from '../../config/store'
import { cardFeeRates } from '../../config/paymentFees'
import { clearConsent, getConsent, isAnalyticsConfigured, onConsentChange } from '../../services/analytics'

const Page = styled.main`
  min-height: 100vh;
  padding: 38px 20px 70px;
  background: #fbf7f5;
  color: #604f51;
`

const Content = styled.article`
  width: min(850px, 100%);
  margin: 0 auto;
  padding: clamp(24px, 5vw, 54px);
  border: 1px solid #eadbdc;
  background: #fffdfb;
  box-shadow: 0 12px 40px rgba(80, 59, 63, 0.06);

  .back-link { color: #c2405b; font-size: 13px; }
  .eyebrow { margin-top: 30px; color: #c2405b; font-size: 10px; letter-spacing: 1.8px; text-transform: uppercase; }
  h1 { margin-top: 8px; color: #533f42; font: clamp(32px, 5vw, 46px)/1.15 'Playfair Display', Georgia, serif; }
  .updated { margin-top: 10px; color: #9b8c8d; font-size: 12px; }
  h2 { margin: 30px 0 9px; color: #604a4e; font: 22px 'Playfair Display', Georgia, serif; }
  h3 { margin: 20px 0 7px; color: #684b50; font-size: 15px; }
  p, li { color: #79696b; font-size: 14px; line-height: 1.8; }
  p + p { margin-top: 10px; }
  ul { display: grid; gap: 7px; margin: 10px 0 0; padding-left: 21px; }
  li::marker { color: #e8637c; }
  a { color: #c2405b; text-decoration: underline; }
  dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 18px; margin: 12px 0; }
  dl div { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #f0e5e5; }
  dt, dd { color: #604a4e; font-size: 13px; }
  dd { margin: 0; font-weight: 600; white-space: nowrap; }
  .notice { margin-top: 22px; padding: 15px 17px; border-left: 3px solid #e8637c; background: #faf0f1; }
  @media (max-width: 560px) {
    padding: 25px 20px;
    dl { grid-template-columns: 1fr; }
    p, li { font-size: 13px; }
  }
`

function BusinessIdentification() {
  return (
    <p>
      <strong>{storeConfig.name}</strong>, CNPJ {storeConfig.cnpj}, com endereço em{' '}
      {storeConfig.registeredAddress}. Contato: <a href={`mailto:${storeConfig.contactEmail}`}>
        {storeConfig.contactEmail}
      </a>.
    </p>
  )
}

function TermsContent() {
  return (
    <>
      <h2>1. Sobre a loja e estes termos</h2>
      <BusinessIdentification />
      <p>
        Ao navegar pelo site ou enviar um pedido, você declara que leu estas condições.
        Se tiver dúvidas, entre em contato antes de concluir o pagamento.
      </p>

      <h2>2. Produtos, preços e disponibilidade</h2>
      <p>
        O catálogo e o estoque exibidos são consultados no sistema da loja e podem mudar
        enquanto o pedido não for confirmado. O envio do pedido pelo site registra uma
        solicitação pendente: não reserva unidades nem conclui a venda. A atendente
        confere os itens, a disponibilidade, a entrega e o total com você pelo WhatsApp.
      </p>
      <p>
        As opções de retirada/entrega e seus valores são apresentados durante o pedido
        e confirmados pela atendente antes do pagamento.
      </p>

      <h2>3. Formas de pagamento e taxas de cartão</h2>
      <p>
        A loja aceita Pix, dinheiro, cartão de crédito ou débito e link de pagamento,
        conforme disponibilidade e confirmação pela atendente. Todas as compras no
        cartão estão sujeitas a taxa, independentemente do valor da compra.
      </p>
      <dl aria-label="Percentuais informados para pagamento com cartão">
        {cardFeeRates.map(({ label, rate }) => (
          <div key={label}><dt>{label}</dt><dd>{rate}</dd></div>
        ))}
      </dl>
      <p>
        Para parcelamentos de 5x a 20x, a atendente informará o percentual aplicável e
        o total final antes de você autorizar o pagamento. A compra só deve ser paga
        depois de você confirmar o valor total.
      </p>

      <h2>4. Pedidos e atendimento</h2>
      <p>
        Ao enviar um pedido, você autoriza o contato da loja para validar os dados,
        confirmar estoque, combinar entrega/retirada e orientar o pagamento. O pedido
        só é confirmado após essa validação com a atendente.
      </p>

      <h2>5. Trocas, devoluções e direitos legais</h2>
      <p>
        Consulte a seção <a href="/#trocas-devolucoes">Trocas e devoluções</a>{' '}
        na página inicial do site. Essas condições comerciais não afastam direitos assegurados
        pela legislação aplicável, inclusive os relativos a compras realizadas fora do
        estabelecimento, quando cabíveis. Em caso de dúvida, fale com a loja pelo e-mail
        indicado acima.
      </p>

      <h2>6. Privacidade</h2>
      <p>
        Os dados informados para validar e registrar o pedido são tratados conforme a{' '}
        <Link to="/privacidade">Política de Privacidade</Link>.
      </p>

      <p className="notice">
        Estes termos descrevem o funcionamento atual do site e não substituem orientação
        jurídica ou contábil. As condições de troca e devolução devem ser revisadas por
        profissional para garantir compatibilidade com os direitos obrigatórios do consumidor.
      </p>
    </>
  )
}

function PrivacyContent() {
  return (
    <>
      <h2>1. Quem é responsável pelos dados</h2>
      <BusinessIdentification />
      <p>
        Esta política explica quais dados o site utiliza, por que são utilizados e como
        você pode entrar em contato para exercer seus direitos.
      </p>

      <h2>2. Dados tratados e finalidades</h2>
      <ul>
        <li>
          <strong>Identificação e contato:</strong> nome, telefone e e-mail para validar
          o pedido, falar com você e prestar atendimento.
        </li>
        <li>
          <strong>Pedido:</strong> produtos, tamanhos, cores, quantidades, preços,
          descontos, forma de pagamento escolhida, unidade/atendente escolhida e
          referência/status do pedido para conferir estoque e registrar e acompanhar
          a compra.
        </li>
        <li>
          <strong>Entrega:</strong> município, endereço, CEP, ponto de referência e
          observações fornecidas para calcular e realizar a entrega.
        </li>
        <li>
          <strong>Cupons:</strong> o e-mail, o telefone e o histórico de pedidos são usados
          para aplicar as regras promocionais, como o uso do cupom uma vez por cliente.
        </li>
        <li>
          <strong>Avise-me quando chegar:</strong> se você pedir aviso de uma peça esgotada,
          guardamos seu nome (opcional), WhatsApp, a peça, o tamanho e a cor, apenas para
          avisar quando ela voltar ao estoque. Você pode pedir a remoção a qualquer momento.
        </li>
        <li>
          <strong>Conta da cliente (opcional):</strong> se você criar uma conta, guardamos nome,
          e-mail e a senha protegida (criptografada pelo Supabase, a loja não tem acesso a ela)
          para você entrar no site e ter seus dados preenchidos ao fazer um pedido. Você pode
          pedir a exclusão da conta pelo e-mail abaixo.
        </li>
      </ul>
      <p>
        O site não solicita nem armazena número completo do cartão, código de segurança
        ou senha bancária. A escolha do meio de pagamento é registrada para a atendente
        combinar a conclusão da compra.
      </p>

      <h2>3. Onde os dados são armazenados ou compartilhados</h2>
      <ul>
        <li>
          <strong>Supabase:</strong> armazena o registro do pedido, os pedidos de aviso de
          reposição e os dados necessários para conferência e atendimento. Pedidos ficam
          pendentes até serem confirmados ou cancelados pela loja.
        </li>
        <li>
          <strong>WhatsApp:</strong> quando você prossegue para o atendimento, os detalhes
          do pedido são preparados para envio à atendente. O WhatsApp é um serviço externo
          sujeito às próprias políticas.
        </li>
        <li>
          <strong>ViaCEP:</strong> o CEP ou a combinação de cidade e trecho de endereço
          pode ser consultada no ViaCEP para localizar endereços e apoiar a entrega.
        </li>
        <li>
          <strong>Armazenamento do navegador:</strong> sacola, favoritos, uso local de cupom,
          sua escolha sobre cookies e, se você entrar na conta, a sessão de login ficam no
          armazenamento do seu dispositivo (localStorage). Esses dados não saem do seu
          navegador, exceto a sessão de login, que é usada para falar com o Supabase.
        </li>
        <li>
          <strong>Vercel e Google Fonts:</strong> o site é hospedado na Vercel e carrega as fontes
          do Google Fonts. Como em qualquer site, esses serviços recebem dados técnicos da
          visita (como endereço IP e navegador) para entregar as páginas e as fontes.
        </li>
      </ul>
      {isAnalyticsConfigured() ? (
        <>
          <p>
            <strong>Google Analytics (cookies de medição):</strong> somente se você aceitar no
            aviso de cookies, usamos o Google Analytics para entender de forma estatística
            quais páginas e peças são mais vistas, de onde vêm as visitas e se os pedidos
            chegam ao WhatsApp. O Google Analytics é um serviço do Google, sujeito às
            políticas do Google. Não usamos pixels publicitários. Se você recusar, nenhum
            cookie de medição é instalado e o site funciona normalmente.
          </p>
          <CookiePreferences />
        </>
      ) : (
        <p>
          O site não utiliza, no momento desta atualização, ferramentas de analytics,
          pixels publicitários ou cookies de rastreamento.
        </p>
      )}
      <p>
        O armazenamento local do navegador mencionado acima não é um cookie de rastreamento;
        ele pode ser removido nas configurações do navegador, mas isso pode apagar carrinho,
        favoritos ou sua escolha sobre cookies.
      </p>

      <h2>4. Retenção e segurança</h2>
      <p>
        Os dados são mantidos pelo tempo necessário para validar e atender o pedido,
        resolver questões posteriores e cumprir obrigações legais, fiscais e de
        conservação de registros. Quando não houver mais necessidade ou dever de guarda,
        os dados poderão ser eliminados ou anonimizados, conforme permitido pela lei.
      </p>
      <p>
        A loja adota medidas técnicas e administrativas razoáveis para proteger os dados.
        Nenhum meio de transmissão ou armazenamento pode ser considerado absolutamente
        livre de riscos.
      </p>

      <h2>5. Seus direitos e contato</h2>
      <p>
        Você pode solicitar informações sobre o tratamento, correção ou atualização de
        dados e, quando aplicável, eliminação, anonimização ou acesso, respeitadas as
        obrigações legais de guarda. Para solicitações, escreva para{' '}
        <a href={`mailto:${storeConfig.contactEmail}`}>{storeConfig.contactEmail}</a>.
      </p>

      <h2>6. Atualizações desta política</h2>
      <p>
        Esta política poderá ser atualizada para refletir mudanças no funcionamento do
        site, nos serviços utilizados ou nas obrigações legais. A data de atualização
        será indicada no início do documento.
      </p>
    </>
  )
}

function CookiePreferences() {
  const [consent, setConsentState] = useState(getConsent)
  useEffect(() => onConsentChange(() => setConsentState(getConsent())), [])
  const label = consent === 'granted' ? 'aceitos' : consent === 'denied' ? 'recusados' : 'ainda não escolhidos'
  return (
    <p className="notice">
      Sua escolha atual: cookies de medição <strong>{label}</strong>.{' '}
      <button
        type="button"
        onClick={() => clearConsent()}
        style={{ background: 'none', padding: 0, color: '#a72f48', textDecoration: 'underline', font: 'inherit', cursor: 'pointer' }}
      >
        Alterar minha escolha
      </button>
    </p>
  )
}

function LegalPage() {
  const isPrivacy = useLocation().pathname === '/privacidade'
  const title = isPrivacy
    ? 'Política de Privacidade e Cookies'
    : 'Termos e Condições de Uso'

  return (
    <Page>
      <Content>
        <Link className="back-link" to="/">← Voltar à loja</Link>
          <p className="eyebrow">{storeConfig.name}</p>
        <h1>{title}</h1>
        <p className="updated">Última atualização: 30 de outubro de 2026</p>
        {isPrivacy ? <PrivacyContent /> : <TermsContent />}
      </Content>
    </Page>
  )
}

export default LegalPage
