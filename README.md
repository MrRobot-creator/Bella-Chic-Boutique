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
│   ├── BoutiqueHeader/   # Marca, navegação e acesso à sacola
│   ├── CartDrawer/       # Sacola, formulário de entrega e checkout via WhatsApp
│   └── ProductCard/      # Variações e seleção de produtos
├── config/               # Identidade e dados públicos de integração
├── data/                 # Catálogo de demonstração
├── pages/Home/           # Vitrine e filtros do catálogo
├── services/             # Mensagens do pedido e links do WhatsApp
├── styles/               # Tema e estilos globais
└── types/                # Tipos de catálogo, sacola e pagamento
```

## Comandos

| Comando | Descrição |
| --- | --- |
| `npm start` | Inicia o ambiente de desenvolvimento |
| `npm run build` | Gera o build de produção (com prévia de link, robots.txt e sitemap.xml) |
| `npm run lint` | Executa o ESLint |
| `npm test -- --watchAll=false` | Executa os testes sem modo watch |
