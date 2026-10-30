# Bella Chic Boutique

Loja virtual de moda feminina feita com React, TypeScript e Styled Components. O catálogo, a sacola e o checkout estão organizados por responsabilidade nas pastas de `src`.

## Rodar localmente

```bash
npm install
npm start
```

O site abre em [http://localhost:3000](http://localhost:3000).

## Configurar a loja

Copie `.env.example` para `.env.local` e preencha os dados públicos da loja:

| Variável | Descrição |
| --- | --- |
| `REACT_APP_SUPABASE_URL` | URL do projeto Supabase. |
| `REACT_APP_SUPABASE_ANON_KEY` | Chave `anon`/publishable do Supabase. Nunca use `service_role`. |
| `REACT_APP_INSTAGRAM_URL` | Link do perfil da boutique no Instagram. |
| `REACT_APP_SITE_URL` | Endereço público do site, sem barra no final. Usado na prévia do link e no sitemap. |
| `REACT_APP_GA_ID` | Opcional. ID do Google Analytics 4 (`G-...`). O Analytics só carrega depois que a visitante aceita o aviso de cookies. |
| `REACT_APP_CUSTOMER_ACCOUNTS` | Opcional. `true` mostra “Entrar \| Cadastre-se”. Só ative depois de configurar um e-mail próprio (SMTP) no Supabase: o e-mail padrão do Supabase só envia para a equipe do projeto. |
| `REACT_APP_PROMO_ENDS_AT` | Opcional. Último dia das “Ofertas da semana”, no formato `AAAA-MM-DD`. Sem data (ou com data vencida), o site mostra “Enquanto durar o estoque”. |

Reinicie `npm start` após alterar `.env.local`. Essas variáveis são incorporadas ao site público no build; use somente a chave pública `anon`/publishable e nunca coloque senhas ou credenciais secretas nelas. Os contatos das duas unidades e seus endereços são configurados em `src/config/store.ts`.

No checkout, a cliente escolhe a unidade e o WhatsApp de atendimento. Os números disponíveis são filtrados pela unidade escolhida, e o pedido encaminha para o contato selecionado com os dados da loja, cliente e produtos.

O autocomplete gratuito do endereço usa o ViaCEP: depois de escolher o município e digitar pelo menos três letras da rua, o checkout mostra sugestões de logradouros; ao preencher um CEP válido de oito dígitos, rua e bairro são completados. Não é necessária chave de API. A consulta de logradouros do ViaCEP retorna até 50 correspondências, das quais a loja apresenta as seis primeiras.

O frete é calculado a partir da unidade selecionada: R$ 12,00 dentro de Belém ou Ananindeua, R$ 15,00 entre essas cidades e R$ 20,00 para Marituba ou Icoaraci. O total e a taxa seguem no pedido enviado pelo WhatsApp.

O checkout não processa pagamentos nem gera QR Code Pix ou boleto bancário. O cliente escolhe a forma de pagamento, envia o pedido profissional pelo WhatsApp e combina com a atendente o pagamento, frete e confirmação do pedido. O endereço, número da casa, bairro e ponto de referência são solicitados apenas para pedidos com entrega.

## Catálogo

O Supabase é a única fonte do catálogo: a vitrine carrega os produtos diretamente da tabela `catalog_products`, e as alterações feitas no painel `/admin` aparecem na loja sem uma cópia local ou script manual de sincronização. A configuração inicial cria a tabela vazia; cadastre os produtos oficiais pelo painel. Se o Supabase não estiver configurado ou não puder ser acessado, a vitrine informa o erro em vez de mostrar produtos de demonstração. No cadastro e na edição de um tamanho único, o campo opcional “Numeração que o tamanho único veste” aceita uma faixa como `36-40`; essa informação aparece na vitrine, sacola e pedido enviado pelo WhatsApp. Para catálogos Supabase já existentes, execute `supabase/product-size-fit.sql` no SQL Editor antes de salvar essa informação pelo painel.

Na vitrine, é possível buscar e filtrar produtos por categoria, tamanho, cor e preço, além de ordenar por preço ou nome. A sacola é salva no armazenamento local do navegador e restaurada ao retornar no mesmo dispositivo e navegador. A página de detalhes apresenta sugestões de peças relacionadas por categoria e cores.

O guia de medidas mostra referências corporais aproximadas em centímetros. Como modelagem e tecido variam por produto, atualize a tabela em `src/components/ProductCard/index.tsx` caso a loja disponha de medidas específicas de cada peça.

## Painel administrativo

O painel fica em `/admin` e permite entrar com e-mail e senha, adicionar, editar e remover peças, definir tamanhos e cores e registrar o estoque de cada combinação de tamanho e cor. Combinações novas começam com zero unidades; sem saldo, a variação não pode ser adicionada à sacola. Ao enviar o checkout, o pedido é gravado como pendente no Supabase e a cliente segue para o WhatsApp. Depois de confirmar a venda com a cliente, use “Confirmar venda e baixar estoque” no admin; a operação verifica e baixa todos os itens de forma atômica. Se o estoque não for mais suficiente, a confirmação falha sem baixar nenhum item. Pedidos não confirmados não reservam unidades; pedidos pendentes podem ser cancelados pelo painel. O painel usa Supabase Auth e banco de dados compartilhado; as alterações feitas no painel passam a aparecer na vitrine pública. Sem as variáveis de ambiente, o catálogo não é carregado e o painel informa que precisa ser configurado.

1. Crie um projeto no Supabase e configure `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY` no arquivo `.env.local` (use a URL do projeto e a chave `anon`/publishable, nunca a `service_role`).
2. No SQL Editor do Supabase, execute o conteúdo de `supabase/setup.sql`. Ele cria as tabelas e políticas de segurança (RLS), configura o armazenamento de imagens e adiciona os campos de galeria, numeração do tamanho único e estoque por variação. Não insere produtos de demonstração nem altera os dados existentes; as variações existentes começam com saldo zero até serem preenchidas no painel.
3. Como o projeto Supabase já existe, execute também `supabase/order-management.sql` no SQL Editor. Essa migração adiciona o estoque por variação (se ainda não existir), cria a tabela de pedidos e as funções protegidas para registrar, confirmar e cancelar pedidos. O cliente pode registrar um pedido pendente; somente uma administradora autorizada pode confirmar a venda e baixar o estoque.
   Em seguida, execute `supabase/order-protection.sql`. Ele adiciona as proteções dos pedidos no servidor: limite de pedidos repetidos por WhatsApp (anti-spam), cupom Bella10 uma vez por e-mail ou WhatsApp, conferência da taxa de frete e da unidade/WhatsApp oficiais da loja. Se mudar telefones, unidades ou valores de frete no código, atualize também esse arquivo e execute de novo.
   Para a gestão completa (reserva de 2 horas, etapas do pedido, cancelar com devolução ao estoque, venda no balcão, histórico de estoque, cupons pelo painel, Meus pedidos, avaliações com foto, lista VIP e configurações de frete grátis e Pix), execute `supabase/v3-gestao.sql`. Ele já inclui o conteúdo de `security-hardening.sql` e funciona com o site antigo. Os testes desse arquivo ficam em `supabase/tests/v3-gestao.test.mjs` (rodam num Postgres local, veja o cabeçalho do arquivo).
   Para os e-mails automáticos de pedido (recebido com Pix copia e cola, confirmado, pago, enviado ou pronto para retirar, entregue com link de avaliação e cancelado), execute `supabase/v4-emails.sql` depois da v3. Os envios saem pelo [Resend](https://resend.com) com o domínio da loja, e a chave da API fica no cofre do Supabase (Vault), nunca no site. Depois ligue em **/admin › Configurações › E-mails para as clientes**. Os modelos dos e-mails da conta (confirmar cadastro, trocar senha) e o passo a passo do Resend ficam em `supabase/email-templates/README.md`; os testes, em `supabase/tests/v4-emails.test.mjs`.
   Depois, execute `supabase/security-hardening.sql`: ele fecha para visitantes sem login as funções só de administradora e trava funções antigas que sobraram no banco.
   Para o “Avise-me quando chegar”, execute também `supabase/restock-alerts.sql`. Ele cria a tabela de pedidos de aviso (só administradoras leem) e a função que a vitrine usa para registrar o aviso, com limite anti-spam.
4. Em **Authentication → Users**, crie o usuário da administradora com e-mail e senha.
5. No SQL Editor, associe esse usuário à lista de administradores, substituindo pelo e-mail usado no passo anterior:

   ```sql
   insert into public.store_admins (user_id)
   select id from auth.users where email = 'admin@seudominio.com'
   on conflict (user_id) do nothing;
   ```

6. Reinicie `npm start` e acesse `http://localhost:3000/admin`. Em produção, configure as mesmas variáveis no provedor de hospedagem e publique uma nova versão.

As regras RLS permitem leitura pública do catálogo, mas somente usuários registrados em `store_admins` podem alterar produtos. A tabela de administradores não tem escrita pública; cadastros são feitos no SQL Editor do Supabase. Não coloque senha, `service_role` ou outras chaves secretas em variáveis `REACT_APP_*`.

### Envio de imagens

O formulário de produtos aceita uma URL pública ou envio de arquivo PNG, JPG/JPEG ou WebP de até 5 MB. Para habilitar o envio, execute também o conteúdo de `supabase/storage.sql` no SQL Editor. Ele cria o bucket público `bella-chic-products`; leitura das imagens é pública para a vitrine e upload/alteração/exclusão exigem uma conta listada em `store_admins`. Se já executou `supabase/setup.sql`, basta executar `storage.sql`; não é necessário recriar as tabelas do catálogo.

No painel, cada cor também pode ter sua própria foto (URL ou upload separado). Ao selecionar a cor na vitrine, a imagem do produto muda para a foto daquela variação; se uma cor não tiver imagem, usa a imagem principal. O dado da foto por cor é armazenado junto ao JSONB `colors`. Também é possível enviar várias fotos de outros ângulos para a galeria do produto; elas ficam no campo JSONB `images` e são exibidas como miniaturas ao lado da imagem principal em telas maiores e abaixo dela em telas menores.

### Catálogo e imagens

Não execute scripts de sincronização de produtos a partir de dados locais: o catálogo oficial é mantido no Supabase e deve ser atualizado pelo painel administrativo. Imagens que usam caminhos `/assets/` precisam estar incluídas na publicação; imagens enviadas pelo painel ficam no Storage do Supabase.

## Recursos da vitrine e do painel

- **Link por peça:** cada peça tem endereço próprio, como `/produto/1-vestido-dress`. Ao abrir os detalhes, o endereço muda e pode ser compartilhado (botões “Compartilhar” e “Enviar no WhatsApp”). O número no começo garante que o link continue funcionando se o nome mudar. Como o site é de página única, a prévia do link no WhatsApp mostra a imagem geral da loja.
- **Últimas unidades:** peças com 2 unidades ou menos no total ganham o selo “Últimas unidades”, e a variação escolhida mostra quantas restam. O limite fica em `LOW_STOCK_LIMIT` (`src/utils/inventory.ts`).
- **Avise-me quando chegar:** em peças ou variações esgotadas, a cliente deixa nome e WhatsApp. No `/admin`, o quadro “Avise-me quando chegar” mostra em verde quem já pode ser avisada e abre o WhatsApp com a mensagem pronta.
- **Resumo de vendas:** o painel mostra faturamento confirmado, vendas, ticket médio, pendentes, peças mais vendidas e variações com estoque baixo, por período, e exporta os pedidos em planilha CSV (abre no Excel).
- **Painel em abas:** Resumo, Pedidos, Venda no balcão, Peças, Estoque, Cupons, Avaliações, Lista VIP e Configurações.
- **Reserva e etapas do pedido:** o pedido do site separa as peças por 2 horas (ajustável em Configurações). No painel você confirma, marca pago, enviado ou pronto para retirar e entregue, e cada etapa tem a mensagem pronta no WhatsApp. Cancelar devolve as peças ao estoque, inclusive em vendas já entregues (trocas e devoluções). Pedidos sem confirmação em 48 h são cancelados sozinhos.
- **Venda no balcão e histórico:** a venda da loja física baixa o estoque na hora e entra no resumo como balcão. Toda entrada e saída de estoque fica no histórico, com motivo.
- **Pix copia e cola:** com a chave cadastrada em Configurações, a cliente que escolhe Pix vê o QR Code e o código com o valor do pedido, e o painel copia o Pix de cada pedido.
- **Avaliações:** a mensagem de “entregue” leva o link `/avaliar/<código>`. A cliente dá nota, comenta e envia até 3 fotos; aparece na peça depois da sua aprovação.
- **Prévia da peça no link:** `api/produto.js` (função da Vercel) coloca a foto, o nome e o preço da peça na prévia do WhatsApp e no Google, e o `sitemap.xml` passa a listar as peças.
- **Promoções:** toda peça com “Preço anterior” maior que o preço atual entra na seção Promoções e na aba Ofertas do catálogo. A de maior desconto aparece em destaque.
- **Combos:** peças cadastradas com uma categoria que contenha “Combo” (por exemplo, “Combos”) formam a seção Combos de roupas. Sem combos cadastrados, a seção não aparece. Use “Preço anterior” para mostrar o valor das peças separadas.
- **Banner da peça:** o segundo banner mostra a peça à venda com mais cores (no empate, a mais nova).
- **Favoritos:** o coração das peças salva os favoritos no navegador da cliente; eles aparecem na aba Favoritos.
- **Conta da cliente:** desligada até `REACT_APP_CUSTOMER_ACCOUNTS=true`. Antes de ligar, configure um SMTP em Authentication › Emails › SMTP Settings (Brevo e Resend têm plano grátis). “Entrar | Cadastre-se” usa o Supabase Auth (e-mail e senha). Em Authentication › URL Configuration, coloque o endereço do site em Site URL e em Redirect URLs, para os links de confirmação e de nova senha voltarem para a loja. Com a conta, nome e e-mail já chegam preenchidos na sacola.
- **Google Analytics:** com `REACT_APP_GA_ID`, aparece o aviso de cookies; só depois do aceite o site registra páginas vistas, peças abertas, adições à sacola, compartilhamentos, pedidos de aviso e pedidos enviados ao WhatsApp. A visitante pode mudar a escolha na Política de Privacidade.

## Publicar o site

O projeto já vem pronto para a **Vercel** (`vercel.json`) e também funciona na **Netlify** (`public/_redirects` e `public/_headers`). Os dois arquivos fazem as rotas `/admin`, `/privacidade` e `/termos-e-condicoes` abrirem corretamente ao acessar o link direto ou atualizar a página, além de enviar cabeçalhos de segurança.

1. Envie o código para o GitHub (`git push`).
2. Na Vercel, clique em **Add New → Project**, importe o repositório e mantenha as configurações detectadas.
3. Em **Settings → Environment Variables**, cadastre:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_INSTAGRAM_URL`
   - `REACT_APP_SITE_URL` (o endereço final do site, por exemplo `https://www.bellachicboutique.com.br`, sem barra no final)
4. Publique. Depois de ligar o domínio, atualize `REACT_APP_SITE_URL` e publique de novo.
5. No Supabase, em **Authentication → URL Configuration**, coloque o endereço do site em **Site URL**.

Depois do `npm run build`, o script `scripts/postbuild-seo.js` coloca o endereço do site na prévia do link (WhatsApp, Instagram e Facebook usam `public/og-image.jpg`) e gera `robots.txt` e `sitemap.xml`. Depois de publicar, cadastre o site no [Google Search Console](https://search.google.com/search-console) e envie o `sitemap.xml`.

### Manter o Supabase ativo

No plano gratuito, o Supabase pausa o projeto depois de cerca de 7 dias sem acesso. O workflow `.github/workflows/supabase-keepalive.yml` consulta o catálogo a cada 3 dias. Para ativá-lo, cadastre no GitHub, em **Settings → Secrets and variables → Actions**, os secrets `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os mesmos valores do `.env.local`. Para testar, abra a aba **Actions**, escolha **Supabase keepalive** e clique em **Run workflow**.

## Estrutura

```text
src/
├── components/
│   ├── AccountModal/     # Entrar, cadastrar e recuperar senha da cliente
│   ├── CartDrawer/       # Sacola, formulário de entrega e checkout via WhatsApp
│   ├── ProductCard/      # Card da vitrine e formulário avise-me
│   ├── ProductDialog/    # Janela da peça: fotos com zoom, variações e compra
│   ├── SideMenu/         # Menu lateral (hambúrguer)
│   ├── SiteHeader/       # Cabeçalho com busca, conta, favoritos e sacola
│   ├── Toast/            # Avisos rápidos
│   └── ui.ts             # Botões, painéis e títulos compartilhados
├── hooks/                # Favoritos e conta da cliente
├── config/               # Identidade e dados públicos de integração
├── data/                 # Catálogo de demonstração
├── pages/Home/           # Vitrine e filtros do catálogo
├── services/             # Mensagens do pedido e links do WhatsApp
├── styles/               # Tema, cores (tokens.ts) e estilos globais
└── types/                # Tipos de catálogo, sacola e pagamento
```

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera o build de produção (com prévia de link, robots.txt e sitemap.xml) |
| `npm run lint` | Executa o ESLint |
| `npm test -- --watchAll=false` | Executa os testes sem modo watch |
