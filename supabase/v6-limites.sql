-- v6-limites.sql — limites contra reserva abusiva de estoque nos pedidos do site.
-- Rodar no SQL Editor do Supabase depois da v3-gestao.sql e da v5-unidades.sql. Pode rodar mais de uma vez.
--
-- Por quê: cada pedido do site reserva as peças por 2 h. Sem limite, um pedido só podia segurar todo o
-- estoque de uma peça (até 10 mil unidades), e o mesmo WhatsApp podia manter vários pedidos reservados.
-- Regras (vendas no balcão não entram):
--   * no máximo 5 unidades da mesma peça (mesmo tamanho e cor) por pedido;
--   * no máximo 20 peças por pedido;
--   * no máximo 3 pedidos com peças reservadas ao mesmo tempo para o mesmo WhatsApp.
-- Atacado ou quantidade maior: a cliente fala com a loja pelo WhatsApp e a venda entra pelo balcão.

do $$
begin
  if to_regclass('public.store_orders') is null or to_regprocedure('public.create_store_order(jsonb)') is null then
    raise exception 'Rode supabase/v3-gestao.sql antes deste arquivo.';
  end if;
end;
$$;

create or replace function public.limit_site_orders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(new.customer->>'phone', ''), '\D', '', 'g');
  v_item jsonb;
  v_quantity integer;
  v_total integer := 0;
begin
  if new.channel = 'balcao' then
    return new;
  end if;

  for v_item in select value from jsonb_array_elements(coalesce(new.items, '[]'::jsonb))
  loop
    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    if v_quantity > 5 then
      raise exception 'Too many units of the same item';
    end if;
    v_total := v_total + v_quantity;
  end loop;

  if v_total > 20 then
    raise exception 'Too many units in one order';
  end if;

  -- Conta só pedidos que ainda seguram estoque: confirmados, cancelados ou com reserva vencida não contam.
  if (
    select count(*) from public.store_orders
    where customer_phone_digits = v_phone
      and status = 'pending'
      and stock_taken
  ) >= 3 then
    raise exception 'Too many open orders from this phone';
  end if;

  return new;
end;
$$;

revoke execute on function public.limit_site_orders() from public, anon, authenticated;

drop trigger if exists limit_site_orders on public.store_orders;
create trigger limit_site_orders
  before insert on public.store_orders
  for each row execute function public.limit_site_orders();
