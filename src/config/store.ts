export const storeConfig = {
  name: 'Bella Chic Boutique',
  units: [
    {
      id: 'galeria-portuense',
      name: 'Galeria Portuense',
      address: 'Tv. Padre Eutíquio, 105 - Batista Campos',
      city: 'Belém' as const
    },
    {
      id: 'cidade-nova-04',
      name: 'Cidade Nova 04',
      address: 'Av. Dr. Nonato Sanova, 161A - Cidade Nova, Ananindeua',
      city: 'Ananindeua' as const
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
      unitId: 'cidade-nova-04'
    },
    {
      id: 'cidade-nova-2',
      label: 'Cidade Nova — atendente 2',
      number: '5591986066894',
      unitId: 'cidade-nova-04'
    }
  ],
  instagramUrl: process.env.REACT_APP_INSTAGRAM_URL || 'https://www.instagram.com/bellachicboutique__/'
}
