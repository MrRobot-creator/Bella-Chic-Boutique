begin;

update public.catalog_products
set name = 'Vestido Dress',
    category = 'Vestidos',
    description = 'Vestido feminino com caimento elegante, ideal para compor looks especiais.',
    price = 75.00,
    old_price = 95.00,
    image = '/assets/product-01-vestido-dress.jpeg',
    sizes = '["U"]'::jsonb,
    colors = '[{"name":"Rosa","hex":"#e5a1ad"},{"name":"Off-white","hex":"#ede5d9"},{"name":"Preto","hex":"#292528"}]'::jsonb,
    tag = 'Mais vendido',
    updated_at = now()
where id = 1;

update public.catalog_products
set name = 'Conjunto Saia Marrant',
    category = 'Conjuntos',
    description = 'Conjunto feminino com saia, pensado para um visual elegante e confortável.',
    price = 100.00,
    old_price = null,
    image = '/assets/product-02-conjunto-saia-marrant.jpeg',
    sizes = '["U"]'::jsonb,
    colors = '[{"name":"Areia","hex":"#c3ab8d"},{"name":"Rosa","hex":"#dfa1ad"},{"name":"Preto","hex":"#292528"}]'::jsonb,
    tag = 'Novo',
    updated_at = now()
where id = 2;

update public.catalog_products
set name = 'Blusa Rendada',
    category = 'Blusas',
    description = 'Blusa feminina com detalhe rendado e acabamento delicado.',
    price = 45.00,
    old_price = null,
    image = '/assets/product-06-blusa-rendada.jpeg',
    sizes = '["U"]'::jsonb,
    colors = '[{"name":"Branco","hex":"#f3eee7"},{"name":"Rosa","hex":"#dfa1ad"},{"name":"Azul","hex":"#9eafc2"}]'::jsonb,
    tag = null,
    updated_at = now()
where id = 3;

update public.catalog_products
set name = 'Conjunto Kimono Listrado',
    category = 'Conjuntos',
    description = 'Conjunto feminino listrado com kimono, para um look leve e marcante.',
    price = 100.00,
    old_price = null,
    image = '/assets/product-03-conjunto-kimono-listrado.jpeg',
    sizes = '["U"]'::jsonb,
    colors = '[{"name":"Floral rosa","hex":"#d797a4"},{"name":"Floral azul","hex":"#9eafc2"}]'::jsonb,
    tag = null,
    updated_at = now()
where id = 7;

update public.catalog_products
set name = 'Macacaquinho Marrant Listrado',
    category = 'Macacões',
    description = 'Macacaquinho feminino listrado, leve e confortável para o dia a dia.',
    price = 85.00,
    old_price = null,
    image = '/assets/product-05-macacaquinho-marrant-listrado.jpeg',
    sizes = '["U"]'::jsonb,
    colors = '[{"name":"Areia","hex":"#c3ab8d"},{"name":"Rosa","hex":"#dfa1ad"},{"name":"Preto","hex":"#292528"}]'::jsonb,
    tag = null,
    updated_at = now()
where id = 9;

update public.catalog_products
set name = 'Conjunto Bata Alfaiataria',
    category = 'Conjuntos',
    description = 'Conjunto feminino de alfaiataria com bata, elegante e versátil.',
    price = 80.00,
    old_price = null,
    image = '/assets/product-04-conjunto-bata-alfaiataria.jpeg',
    sizes = '["P","M","G"]'::jsonb,
    colors = '[{"name":"Floral rosa","hex":"#d797a4"},{"name":"Floral lilás","hex":"#b7a4c7"}]'::jsonb,
    tag = 'Novo',
    updated_at = now()
where id = 12;

commit;
