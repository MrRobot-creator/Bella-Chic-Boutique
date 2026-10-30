-- Ajustes de segurança apontados pelo verificador do Supabase (Advisors).
-- Pode ser executado mais de uma vez sem problema.
--
-- 1. Funções só de administradora deixam de ser chamáveis por visitantes sem login.
--    (Elas já recusavam quem não é admin; isto apenas fecha a porta antes.)
-- 2. Funções antigas de outro projeto, que apontam para tabelas que não existem
--    neste banco, deixam de ser chamáveis pelo site.
-- 3. A função de "atualizado em" passa a usar um search_path fixo.

begin;

revoke execute on function public.confirm_store_order(uuid) from public, anon;
revoke execute on function public.cancel_store_order(uuid) from public, anon;
revoke execute on function public.is_store_admin() from public, anon;

do $$
begin
  if to_regprocedure('public.finalizar_recebimento(uuid)') is not null then
    execute 'revoke execute on function public.finalizar_recebimento(uuid) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.match_documents(vector, integer, jsonb)') is not null then
    execute 'revoke execute on function public.match_documents(vector, integer, jsonb) from public, anon, authenticated';
  end if;
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set search_path = ''''';
  end if;
end;
$$;

commit;
