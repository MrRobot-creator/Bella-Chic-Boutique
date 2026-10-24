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
| `REACT_APP_INSTAGRAM_URL` | Link do perfil da boutique no Instagram. |

Reinicie `npm start` após alterar `.env.local`. Essa variável é incorporada ao site público no build, então não coloque senhas ou credenciais secretas nela. Os contatos das duas unidades e seus endereços são configurados em `src/config/store.ts`.

No checkout, a cliente escolhe a unidade e o WhatsApp de atendimento. Os números disponíveis são filtrados pela unidade escolhida, e o pedido encaminha para o contato selecionado com os dados da loja, cliente e produtos.

O autocomplete gratuito do endereço usa o ViaCEP: depois de escolher o município e digitar pelo menos três letras da rua, o checkout mostra sugestões de logradouros; ao preencher um CEP válido de oito dígitos, rua e bairro são completados. Não é necessária chave de API. A consulta de logradouros do ViaCEP retorna até 50 correspondências, das quais a loja apresenta as seis primeiras.

O frete é calculado a partir da unidade selecionada: R$ 12,00 dentro de Belém ou Ananindeua, R$ 15,00 entre essas cidades e R$ 20,00 para Marituba ou Icoaraci. O total e a taxa seguem no pedido enviado pelo WhatsApp.

O checkout não processa pagamentos nem gera QR Code Pix ou boleto bancário. O cliente escolhe a forma de pagamento, envia o pedido profissional pelo WhatsApp e combina com a atendente o pagamento, frete e confirmação do pedido. O endereço, número da casa, bairro e ponto de referência são solicitados apenas para pedidos com entrega.

## Catálogo

Os produtos iniciais de demonstração ficam em `src/data/products.ts` e são copiados para o Supabase ao executar `supabase/setup.sql`. Depois da configuração, gerencie o catálogo e a disponibilidade pelo painel `/admin`. No cadastro e na edição de um tamanho único, o campo opcional “Numeração que o tamanho único veste” aceita uma faixa como `38-42`; essa informação aparece na vitrine, sacola e pedido enviado pelo WhatsApp. Para catálogos Supabase já existentes, execute `supabase/product-size-fit.sql` no SQL Editor antes de salvar essa informação pelo painel.

Na vitrine, é possível buscar e filtrar produtos por categoria, tamanho, cor e preço, além de ordenar por preço ou nome. A sacola é salva no armazenamento local do navegador e restaurada ao retornar no mesmo dispositivo e navegador. A página de detalhes apresenta sugestões de peças relacionadas por categoria e cores.

O guia de medidas mostra referências corporais aproximadas em centímetros. Como modelagem e tecido variam por produto, atualize a tabela em `src/components/ProductCard/index.tsx` caso a loja disponha de medidas específicas de cada peça.

## Painel administrativo

O painel fica em `/admin` e permite entrar com e-mail e senha, adicionar, editar e remover peças, definir os tamanhos e cores disponíveis e marcar uma peça inteira como esgotada. Para tamanhos ou cores sem estoque, remova a variação da lista do produto; a marcação “esgotado” desativa todas as variações daquele produto. O painel usa Supabase Auth e banco de dados compartilhado; as alterações feitas no painel passam a aparecer na vitrine pública. Sem as variáveis de ambiente, o catálogo de demonstração continua disponível e o painel informa que precisa ser configurado.

1. Crie um projeto no Supabase e configure `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY` no arquivo `.env.local` (use a URL do projeto e a chave `anon`/publishable, nunca a `service_role`).
2. No SQL Editor do Supabase, execute o conteúdo de `supabase/setup.sql`. Ele cria as tabelas, políticas de segurança (RLS), adiciona os campos de galeria de imagens e numeração do tamanho único, e cadastra os produtos de demonstração. Se o catálogo já estava configurado, execute `supabase/product-gallery.sql` e `supabase/product-size-fit.sql` para adicionar esses campos sem reaplicar a configuração inicial.
3. Em **Authentication → Users**, crie o usuário da administradora com e-mail e senha.
4. No SQL Editor, associe esse usuário à lista de administradores, substituindo pelo e-mail usado no passo anterior:

   ```sql
   insert into public.store_admins (user_id)
   select id from auth.users where email = 'admin@seudominio.com'
   on conflict (user_id) do nothing;
   ```

5. Reinicie `npm start` e acesse `http://localhost:3000/admin`. Em produção, configure as mesmas variáveis no provedor de hospedagem e publique uma nova versão.

As regras RLS permitem leitura pública do catálogo, mas somente usuários registrados em `store_admins` podem alterar produtos. A tabela de administradores não tem escrita pública; cadastros são feitos no SQL Editor do Supabase. Não coloque senha, `service_role` ou outras chaves secretas em variáveis `REACT_APP_*`.

### Envio de imagens

O formulário de produtos aceita uma URL pública ou envio de arquivo PNG, JPG/JPEG ou WebP de até 5 MB. Para habilitar o envio, execute também o conteúdo de `supabase/storage.sql` no SQL Editor. Ele cria o bucket público `bella-chic-products`; leitura das imagens é pública para a vitrine e upload/alteração/exclusão exigem uma conta listada em `store_admins`. Se já executou `supabase/setup.sql`, basta executar `storage.sql`; não é necessário recriar as tabelas do catálogo.

No painel, cada cor também pode ter sua própria foto (URL ou upload separado). Ao selecionar a cor na vitrine, a imagem do produto muda para a foto daquela variação; se uma cor não tiver imagem, usa a imagem principal. O dado da foto por cor é armazenado junto ao JSONB `colors`. Também é possível enviar várias fotos de outros ângulos para a galeria do produto; elas ficam no campo JSONB `images` e são exibidas como miniaturas ao lado da imagem principal em telas maiores e abaixo dela em telas menores.

### Sincronizar o catálogo local com o Supabase

As seis fotos selecionadas também estão em `public/assets` e são usadas pelo catálogo local em `src/data/products.ts`. Quando alterar os dados localmente e quiser publicá-los, atualize `supabase/catalog-sync.sql` com os mesmos campos e execute o script no SQL Editor do Supabase. O script atual sincroniza os seis produtos com IDs 1, 2, 3, 7, 9 e 12, incluindo nomes, preços, tamanhos, cores e imagens. Publique também a aplicação para servir os arquivos em `/assets/`.

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
| `npm run build` | Gera o build de produção |
| `npm run lint` | Executa o ESLint |
| `npm test -- --watchAll=false` | Executa os testes sem modo watch |
