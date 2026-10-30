# E-mails da Bella Chic com o Resend

São dois tipos de e-mail, e os dois saem pelo Resend com o domínio da loja:

- **E-mails da conta** (confirmar cadastro, trocar senha, trocar e-mail): enviados pelo Supabase Auth,
  com os modelos desta pasta.
- **E-mails de pedido** (recebido com Pix copia e cola, confirmado, pagamento recebido, saiu para
  entrega ou pronto para retirar, entregue com link de avaliação, cancelado): enviados pelo banco,
  com o `supabase/v4-emails.sql`.

O Resend não envia de Gmail. O remetente precisa ser de um domínio da loja, por isso o passo 1 é ter o
domínio. A conta do Resend (`bellachicboutique12@gmail.com`) continua sendo o login; o Gmail pode ser
o endereço que recebe as respostas das clientes.

## 1. Comprar o domínio

1. Em [registro.br](https://registro.br), pesquise `bellachicboutique.com.br` e registre no CPF ou CNPJ
   da loja (custa cerca de R$ 40 por ano; confira o valor na compra).
2. Deixe o DNS no próprio Registro.br por enquanto (opção padrão). É lá que entram os registros da
   Vercel e do Resend.

## 2. Ligar o domínio ao site (Vercel)

1. Vercel › projeto `bella-chic-boutique` › **Settings › Domains › Add** › `bellachicboutique.com.br`
   (aceite também o `www`).
2. A Vercel mostra os registros (um `A` para a raiz e um `CNAME` para o `www`). Crie esses registros em
   Registro.br › domínio › **DNS › Editar zona**.
3. Em **Settings › Environment Variables**, crie ou troque:
   - `REACT_APP_SITE_URL` = `https://bellachicboutique.com.br`
   - `REACT_APP_CUSTOMER_ACCOUNTS` = `true` (mostra "Entrar / Minha conta" no site; deixe para o fim)
4. Faça um novo deploy.

## 3. Verificar o domínio no Resend

1. Resend › **Domains › Add Domain** › `bellachicboutique.com.br`, região **São Paulo (sa-east-1)**.
2. O Resend mostra 3 ou 4 registros (DKIM em `resend._domainkey`, SPF/MX em `send`, e um DMARC
   opcional). Copie cada um para Registro.br › **Editar zona**, com o mesmo tipo, nome e valor.
3. Volte ao Resend e clique em **Verify DNS Records**. Costuma levar de 5 a 30 minutos.

Esses registros não mexem no site nem em e-mail que o domínio já receba.

## 4. Conectar o Resend ao Supabase (e-mails da conta)

1. Resend › **Settings › Integrations › Connect to Supabase** e entre na conta do Supabase.
2. Escolha o projeto **BellaChicBoutique_estoque**, depois o domínio `bellachicboutique.com.br` e clique
   em **Add API Key**.
3. Nome do remetente: `Bella Chic Boutique`. Clique em **Configure SMTP Integration**.

Isso cria uma chave no Resend e preenche o SMTP do Supabase sozinho. Se preferir fazer à mão:
Supabase › **Authentication › Emails › SMTP Settings** › Host `smtp.resend.com`, porta `465`,
usuário `resend`, senha = uma chave de API do Resend, remetente `contato@bellachicboutique.com.br`.

Depois, em **Authentication › URL Configuration**:

- **Site URL:** `https://bellachicboutique.com.br`
- **Redirect URLs:** `https://bellachicboutique.com.br/**` e `https://bella-chic-boutique.vercel.app/**`

E em **Authentication › Emails › Templates**, cole cada modelo (aba "Source") e troque o assunto:

| Modelo no Supabase | Assunto | Arquivo |
| --- | --- | --- |
| Confirm sign up | Confirme seu e-mail na Bella Chic | `confirmar-cadastro.html` |
| Reset password | Crie uma nova senha · Bella Chic | `redefinir-senha.html` |
| Change email address | Confirme seu novo e-mail · Bella Chic | `trocar-email.html` |
| Magic link | Seu link de acesso · Bella Chic | `link-de-acesso.html` |
| Reauthentication | Seu código de confirmação · Bella Chic | `reautenticacao.html` |

O nome da cliente não entra nesses e-mails de propósito: ele é digitado no cadastro, e quem cadastrasse
o e-mail de outra pessoa poderia usar o campo para mandar uma mensagem falsa.

## 5. Ligar os e-mails de pedido

1. No SQL Editor do Supabase, rode `supabase/v3-gestao.sql` (se ainda não rodou) e depois
   `supabase/v4-emails.sql`.
2. Resend › **API Keys › Create API Key**, permissão **Sending access**, domínio da loja. Copie a chave
   (começa com `re_`). Ela só aparece uma vez.
3. No SQL Editor, rode a linha abaixo colando a sua chave no lugar de `re_SUA_CHAVE`. A chave fica
   criptografada no cofre do Supabase e nunca vai para o site:

   ```sql
   select vault.create_secret('re_SUA_CHAVE', 'resend_api_key', 'Chave do Resend para e-mails de pedido');
   ```

4. Em `/admin › Configurações › E-mails para as clientes`:
   - marque **Mandar e-mails de pedido para as clientes**;
   - remetente `Bella Chic Boutique` / `pedidos@bellachicboutique.com.br`;
   - respostas para `bellachicboutique12@gmail.com`;
   - endereço do site `https://bellachicboutique.com.br`;
   - salve e clique em **Mandar e-mail de teste**.

A lista **Últimos envios** mostra cada e-mail e a resposta do Resend. Um erro no envio nunca impede o
pedido: ele só fica registrado ali.

Para trocar a chave depois:

```sql
select vault.update_secret((select id from vault.secrets where name = 'resend_api_key'), 're_NOVA_CHAVE');
```

## Limites do plano grátis do Resend

100 e-mails por dia e 3.000 por mês. Cada pedido completo usa de 4 a 5 e-mails, então dá para cerca de
20 pedidos por dia. Se passar disso, o Resend tem plano pago.
