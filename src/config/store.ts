export const storeConfig = {
  name: 'Bella Chic Boutique',
  units: [
    {
      id: 'galeria-portuense',
      name: 'Galeria Portuense',
      address: 'Tv. Padre Eutíquio, 1055 - Batista Campos',
      city: 'Belém' as const,
      hours: 'Segunda a sexta: 10h às 19:30 • Sábado: 10h às 18h • Domingo: Fechado'
    },
    {
      id: 'cidade-nova-4',
      name: 'Cidade Nova 4',
      address: 'Av. Dr. Nonato Sanova, 161A - Cidade Nova, Ananindeua',
      city: 'Ananindeua' as const,
      hours: 'Segunda a sexta: 10h às 19h • Sábado: 10h às 17h • Domingo: Fechado (sujeito a abertura, conferir no Instagram)'
    }
  ],
  whatsappContacts: [
    {
      id: 'portuense',
      label: 'Galeria Portuense',
      number: '5591980648559',
      unitId: 'galeria-portuense'
    },
    {
      id: 'cidade-nova-1',
      label: 'Cidade Nova — atendente 1',
      number: '5591980408420',
      unitId: 'cidade-nova-4'
    },
    {
      id: 'cidade-nova-2',
      label: 'Cidade Nova — atendente 2',
      number: '5591986066894',
      unitId: 'cidade-nova-4'
    }
  ],
  instagramUrl: process.env.REACT_APP_INSTAGRAM_URL || 'https://www.instagram.com/bellachicboutique__/'
}
