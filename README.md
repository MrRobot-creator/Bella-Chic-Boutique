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

No checkout, a cliente escolhe a unidade e o WhatsApp de atendimento. Os números disponíveis são filtrados pela unidade escolhida, e o pedido encaminha para o contato selecionado com os dados da loja, cliente e produtos. Os endereços e contatos atuais ficam em `src/config/store.ts`.

O checkout não processa pagamentos nem gera QR Code Pix ou boleto bancário. O cliente escolhe a forma de pagamento, envia o pedido profissional pelo WhatsApp e combina com a atendente o pagamento, frete e confirmação do pedido. O endereço, número da casa, bairro e ponto de referência são solicitados apenas para pedidos com entrega.

## Catálogo

Os produtos iniciais de demonstração ficam em `src/data/products.ts` e são copiados para o Supabase ao executar `supabase/setup.sql`. Depois da configuração, gerencie o catálogo e a disponibilidade pelo painel `/admin`.

## Painel administrativo

O painel fica em `/admin` e permite entrar com e-mail e senha, adicionar, editar e remover peças, definir os tamanhos e cores disponíveis e marcar uma peça inteira como esgotada. Para tamanhos ou cores sem estoque, remova a variação da lista do produto; a marcação “esgotado” desativa todas as variações daquele produto. O painel usa Supabase Auth e banco de dados compartilhado; as alterações feitas no painel passam a aparecer na vitrine pública. Sem as variáveis de ambiente, o catálogo de demonstração continua disponível e o painel informa que precisa ser configurado.

1. Crie um projeto no Supabase e configure `REACT_APP_SUPABASE_URL` e `REACT_APP_SUPABASE_ANON_KEY` no arquivo `.env.local` (use a URL do projeto e a chave `anon`/publishable, nunca a `service_role`).
2. No SQL Editor do Supabase, execute o conteúdo de `supabase/setup.sql`. Ele cria as tabelas, políticas de segurança (RLS) e cadastra os produtos de demonstração.
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
