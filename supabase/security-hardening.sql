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
declare
  v_function regprocedure;
begin
  -- Funções antigas de outro projeto (apontam para tabelas que não existem neste banco).
  for v_function in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('finalizar_recebimento', 'match_documents')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', v_function);
  end loop;
  for v_function in
    select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  loop
    execute format('alter function %s set search_path = %L', v_function, '');
  end loop;
end;
$$;

commit;
