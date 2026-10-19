import { Product } from '../types/store'

export const products: Product[] = [
  {
    id: 1,
    name: 'Vestido Dress',
    category: 'Vestidos',
    description: 'Vestido feminino com caimento elegante, ideal para compor looks especiais.',
    price: 75.00,
    oldPrice: 95.00,
    image: '/assets/product-01-vestido-dress.jpeg',
    sizes: ['U'],
    colors: [{ name: 'Rosa', hex: '#e5a1ad' }, { name: 'Off-white', hex: '#ede5d9' }, { name: 'Preto', hex: '#292528' }],
    tag: 'Mais vendido'
  },
  {
    id: 2,
    name: 'Conjunto Saia Marrant',
    category: 'Conjuntos',
    description: 'Conjunto feminino com saia, pensado para um visual elegante e confortável.',
    price: 100.00,
    image: '/assets/product-02-conjunto-saia-marrant.jpeg',
    sizes: ['U'],
    colors: [{ name: 'Areia', hex: '#c3ab8d' }, { name: 'Rosa', hex: '#dfa1ad' }, { name: 'Preto', hex: '#292528' }],
    tag: 'Novo'
  },
  {
    id: 3,
    name: 'Blusa Rendada',
    category: 'Blusas',
    description: 'Blusa feminina com detalhe rendado e acabamento delicado.',
    price: 45.00,
    image: '/assets/product-06-blusa-rendada.jpeg',
    sizes: ['U'],
    colors: [{ name: 'Branco', hex: '#f3eee7' }, { name: 'Rosa', hex: '#dfa1ad' }, { name: 'Azul', hex: '#9eafc2' }]
  },
  {
    id: 4,
    name: 'Calça Chiara',
    category: 'Shorts',
    description: 'Calça pantalona de cintura alta, com bolsos e tecido de ótimo caimento.',
    price: 179.9,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=85',
    sizes: ['36', '38', '40', '42', '44'],
    colors: [{ name: 'Areia', hex: '#c3ab8d' }, { name: 'Preto', hex: '#292528' }, { name: 'Off-white', hex: '#ede5d9' }],
    tag: 'Essencial'
  },
  {
    id: 5,
    name: 'Saia Lavínia',
    category: 'Saias',
    description: 'Saia midi plissada com movimento leve. Uma peça versátil para todas as estações.',
    price: 149.9,
    image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=900&q=85',
    sizes: ['P', 'M', 'G'],
    colors: [{ name: 'Rosa', hex: '#dfa1ad' }, { name: 'Champagne', hex: '#d7c5a2' }, { name: 'Preto', hex: '#292528' }]
  },
  {
    id: 6,
    name: 'Bolsa Charlotte',
    category: 'Acessórios',
    description: 'Bolsa estruturada com alça removível e acabamento sofisticado para acompanhar você.',
    price: 159.9,
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85',
    sizes: ['Único'],
    colors: [{ name: 'Caramelo', hex: '#a66b3f' }, { name: 'Preto', hex: '#292528' }, { name: 'Rosa', hex: '#dfa1ad' }],
    tag: 'Favorito'
  },
  {
    id: 7,
    name: 'Conjunto Kimono Listrado',
    category: 'Conjuntos',
    description: 'Conjunto feminino listrado com kimono, para um look leve e marcante.',
    price: 100.0,
    image: '/assets/product-03-conjunto-kimono-listrado.jpeg',
    sizes: ['U'],
    colors: [{ name: 'Floral rosa', hex: '#d797a4' }, { name: 'Floral azul', hex: '#9eafc2' }]
  },
  {
    id: 8,
    name: 'Camisa Valentina',
    category: 'Blusas',
    description: 'Camisa clássica de tecido leve, modelagem confortável e botões delicados.',
    price: 139.9,
    image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=85',
    sizes: ['P', 'M', 'G', 'GG'],
    colors: [{ name: 'Branco', hex: '#f3eee7' }, { name: 'Rosa', hex: '#dfa1ad' }, { name: 'Azul claro', hex: '#b7c9d8' }]
  },
  {
    id: 9,
    name: 'Macacaquinho Marrant Listrado',
    category: 'Macacões',
    description: 'Macacaquinho feminino listrado, leve e confortável para o dia a dia.',
    price: 85.00,
    image: '/assets/product-05-macacaquinho-marrant-listrado.jpeg',
    sizes: ['U'],
    colors: [{ name: 'Areia', hex: '#c3ab8d' }, { name: 'Rosa', hex: '#dfa1ad' }, { name: 'Preto', hex: '#292528' }]
  },
  {
    id: 10,
    name: 'Cardigan Sophie',
    category: 'Blusas',
    description: 'Cardigan aconchegante de toque macio, ideal para completar seu look.',
    price: 159.9,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85',
    sizes: ['P', 'M', 'G'],
    colors: [{ name: 'Rosa', hex: '#dfa1ad' }, { name: 'Creme', hex: '#e9ddc8' }, { name: 'Cinza', hex: '#a8a5a4' }],
    tag: 'Novo'
  },
  {
    id: 11,
    name: 'Cinto Camille',
    category: 'Acessórios',
    description: 'Cinto fino com fivela dourada delicada para dar o toque final ao visual.',
    price: 69.9,
    image: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85',
    sizes: ['P', 'M', 'G'],
    colors: [{ name: 'Caramelo', hex: '#a66b3f' }, { name: 'Preto', hex: '#292528' }]
  },
  {
    id: 12,
    name: 'Conjunto Bata Alfaiataria',
    category: 'Conjuntos',
    description: 'Conjunto feminino de alfaiataria com bata, elegante e versátil.',
    price: 80.00,
    image: '/assets/product-04-conjunto-bata-alfaiataria.jpeg',
    sizes: ['P', 'M', 'G'],
    colors: [{ name: 'Floral rosa', hex: '#d797a4' }, { name: 'Floral lilás', hex: '#b7a4c7' }],
    tag: 'Novo'
  }
]

export const categories = ['Todos', ...Array.from(new Set(products.map((product) => product.category)))]
