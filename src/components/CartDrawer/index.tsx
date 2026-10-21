import { ChangeEvent, FormEvent, MouseEvent, useEffect, useRef, useState } from 'react'
import { storeConfig } from '../../config/store'
import { CartItem, PaymentMethod } from '../../types/store'
import { createOrderMessage, createOrderReference, createWhatsAppUrl } from '../../services/whatsapp'
import {
  calculateDeliveryFee,
  DeliveryCity,
  identifyDeliveryCity,
  lookupViaCepPostalCode,
  searchViaCepAddresses,
  ViaCepAddress
} from '../../services/delivery'
import {
  CloseButton,
  Drawer,
  DrawerHeader,
  EmptyCart,
  ItemDetails,
  ItemImage,
  ItemRow,
  Items,
  Overlay,
  RemoveButton,
  Summary,
  Total,
  WhatsAppButton
} from './styles'

type CartDrawerProps = {
  isOpen: boolean
  items: CartItem[]
  onClose: () => void
  onChangeQuantity: (productId: number, size: string, color: string, quantity: number) => void
  onRemove: (productId: number, size: string, color: string) => void
}

const formatPrice = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const CartDrawer = ({ isOpen, items, onClose, onChangeQuantity, onRemove }: CartDrawerProps) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState(storeConfig.units[0].id)
  const [selectedContactId, setSelectedContactId] = useState(storeConfig.whatsappContacts[0].id)
  const [fulfillment, setFulfillment] = useState('Entrega')
  const [street, setStreet] = useState('')
  const [houseNumber, setHouseNumber] = useState('')
  const [complement, setComplement] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [referencePoint, setReferencePoint] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [deliveryCity, setDeliveryCity] = useState<DeliveryCity | ''>('')
  const [addressSuggestions, setAddressSuggestions] = useState<ViaCepAddress[]>([])
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const [addressLookupMessage, setAddressLookupMessage] = useState('')
  const [payment, setPayment] = useState<PaymentMethod>('Cartão de crédito')
  const cepLookupRequest = useRef<AbortController | null>(null)
  const selectedStreetFromLookup = useRef('')
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const selectedUnit = storeConfig.units.find((unit) => unit.id === selectedUnitId) || storeConfig.units[0]
  const availableContacts = storeConfig.whatsappContacts.filter((contact) => contact.unitId === selectedUnit.id)
  const selectedContact = availableContacts.find((contact) => contact.id === selectedContactId) || availableContacts[0]
  const deliveryFee = fulfillment === 'Entrega'
    ? deliveryCity ? calculateDeliveryFee(selectedUnit.city, deliveryCity) : null
    : 0

  useEffect(() => {
    if (
      !isOpen ||
      fulfillment !== 'Entrega' ||
      !deliveryCity ||
      street.trim().length < 3 ||
      street.trim() === selectedStreetFromLookup.current
    ) {
      setAddressSuggestions([])
      setIsSearchingAddress(false)
      return undefined
    }

    const controller = new AbortController()
    const debounce = window.setTimeout(() => {
      setIsSearchingAddress(true)
      setAddressLookupMessage('')
      searchViaCepAddresses(deliveryCity, street, controller.signal)
        .then((addresses) => {
          setAddressSuggestions(addresses.slice(0, 6))
          if (!addresses.length) setAddressLookupMessage('Nenhum endereço encontrado. Você pode continuar preenchendo manualmente.')
        })
        .catch((error: Error) => {
          if (error.name !== 'AbortError') {
            setAddressSuggestions([])
            setAddressLookupMessage(`Não foi possível buscar endereços no ViaCEP: ${error.message}`)
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearchingAddress(false)
        })
    }, 450)

    return () => {
      window.clearTimeout(debounce)
      controller.abort()
    }
  }, [deliveryCity, fulfillment, isOpen, street])

  useEffect(() => () => cepLookupRequest.current?.abort(), [])

  const chooseAddress = (address: ViaCepAddress) => {
    selectedStreetFromLookup.current = address.logradouro
    setStreet(address.logradouro)
    setNeighborhood(address.bairro)
    setPostalCode(address.cep)
    setAddressSuggestions([])
    setAddressLookupMessage('Endereço preenchido pelo ViaCEP.')
  }

  const handlePostalCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    const digits = value.replace(/\D/g, '').slice(0, 8)
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
    setPostalCode(formatted)
    selectedStreetFromLookup.current = ''

    if (digits.length !== 8) {
      cepLookupRequest.current?.abort()
      return
    }

    cepLookupRequest.current?.abort()
    const controller = new AbortController()
    cepLookupRequest.current = controller
    setAddressLookupMessage('')

    lookupViaCepPostalCode(digits, controller.signal)
      .then((address) => {
        if (controller.signal.aborted) return
        if (!address) {
          setAddressLookupMessage('CEP não encontrado. Confira o número ou preencha o endereço manualmente.')
          return
        }

        if (address.logradouro) {
          selectedStreetFromLookup.current = address.logradouro
          setStreet(address.logradouro)
        }
        if (address.bairro) setNeighborhood(address.bairro)
        const detectedCity = identifyDeliveryCity(address.localidade, address.bairro)
        setDeliveryCity(
          detectedCity === 'Belém' && deliveryCity === 'Icoaraci'
            ? 'Icoaraci'
            : detectedCity || ''
        )
        setAddressLookupMessage('Endereço preenchido pelo CEP.')
      })
      .catch((error: Error) => {
        if (error.name !== 'AbortError') {
          setAddressLookupMessage(`Não foi possível consultar o CEP no ViaCEP: ${error.message}`)
        }
      })
  }

  useEffect(() => {
    const contactsForUnit = storeConfig.whatsappContacts.filter((contact) => contact.unitId === selectedUnitId)
    if (!contactsForUnit.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(contactsForUnit[0].id)
    }
  }, [selectedUnitId, selectedContactId])

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (fulfillment === 'Entrega' && (!deliveryCity || deliveryFee === null)) {
      setAddressLookupMessage('Selecione o município de entrega para calcular o frete antes de confirmar o pedido.')
      return
    }

    const reference = createOrderReference()
    const orderMessage = createOrderMessage(items, {
      reference,
      name: name.trim(),
      phone: phone.trim(),
      unitName: selectedUnit.name,
      unitAddress: selectedUnit.address,
      attendant: selectedContact.label,
      storePhone: selectedContact.number,
      fulfillment,
      street: fulfillment === 'Entrega' ? street.trim() : '',
      houseNumber: fulfillment === 'Entrega' ? houseNumber.trim() : '',
      complement: fulfillment === 'Entrega' ? complement.trim() : '',
      neighborhood: fulfillment === 'Entrega' ? neighborhood.trim() : '',
      postalCode: fulfillment === 'Entrega' ? postalCode.trim() : '',
      deliveryCity: fulfillment === 'Entrega' ? deliveryCity : '',
      referencePoint: fulfillment === 'Entrega' ? referencePoint.trim() : '',
      deliveryNotes: fulfillment === 'Entrega' ? deliveryNotes.trim() : '',
      deliveryFee,
      payment,
      subtotal: total
    })
    window.location.assign(createWhatsAppUrl(orderMessage, selectedContact.number))
  }

  return (
    <Overlay onMouseDown={(event: MouseEvent<HTMLDivElement>) => { if (event.target === event.currentTarget) onClose() }}>
      <Drawer role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <DrawerHeader>
          <div>
            <span className="eyebrow">BELLA CHIC BOUTIQUE</span>
            <h2 id="cart-title">Sua sacola <span>({items.reduce((sum, item) => sum + item.quantity, 0)})</span></h2>
          </div>
          <CloseButton type="button" onClick={onClose} aria-label="Fechar sacola">×</CloseButton>
        </DrawerHeader>

        {items.length === 0 ? (
          <EmptyCart>
            <span>♡</span>
            <h3>Sua sacola está esperando</h3>
            <p>Escolha suas peças favoritas para começar.</p>
            <button type="button" onClick={onClose}>Continuar explorando</button>
          </EmptyCart>
        ) : (
          <>
            <Items>
              {items.map(({ product, size, color, quantity }) => {
                const selectedColor = product.colors.find((option) => option.name === color)
                return (
                  <ItemRow key={`${product.id}-${size}-${color}`}>
                    <ItemImage src={selectedColor?.image || product.image} alt="" />
                    <ItemDetails>
                      <h3>{product.name}</h3>
                      <p>Tam. {size} · {color}</p>
                      <strong>{formatPrice(product.price * quantity)}</strong>
                      <div className="quantity">
                        <button type="button" aria-label={`Diminuir quantidade de ${product.name}`} onClick={() => onChangeQuantity(product.id, size, color, quantity - 1)}>−</button>
                        <span>{quantity}</span>
                        <button type="button" aria-label={`Aumentar quantidade de ${product.name}`} onClick={() => onChangeQuantity(product.id, size, color, quantity + 1)}>+</button>
                        <RemoveButton type="button" onClick={() => onRemove(product.id, size, color)}>Remover</RemoveButton>
                      </div>
                    </ItemDetails>
                  </ItemRow>
                )
              })}
            </Items>

            <Summary>
              <div className="subtotal"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <p>
                {fulfillment !== 'Entrega'
                  ? 'Retirada na loja sem taxa de entrega.'
                  : deliveryFee === null
                    ? 'Selecione o município para calcular o frete.'
                    : `Taxa de entrega para ${deliveryCity}: ${formatPrice(deliveryFee)}.`}
              </p>
              <Total>
                <span>Total {fulfillment === 'Entrega' ? '(com entrega)' : '(retirada)'}</span>
                <strong>{deliveryFee === null ? 'Aguardando município' : formatPrice(total + deliveryFee)}</strong>
              </Total>
            </Summary>

            <form className="checkout-form" onSubmit={handleSubmit}>
              <h3>Finalize seu pedido</h3>
              <label>
                Unidade
                <select value={selectedUnitId} onChange={(event) => setSelectedUnitId(event.target.value)}>
                  {storeConfig.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
                </select>
                <span className="unit-address">{selectedUnit.address}</span>
              </label>
              <label>
                WhatsApp para atendimento
                <select value={selectedContact.id} onChange={(event) => setSelectedContactId(event.target.value)}>
                  {availableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>{contact.label} · +{contact.number}</option>
                  ))}
                </select>
              </label>
              <label>
                Seu nome
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
              </label>
              <label>
                Seu WhatsApp
                <input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" autoComplete="tel" placeholder="(11) 99999-9999" required />
              </label>
              <label>
                Como deseja receber?
                <select value={fulfillment} onChange={(event) => setFulfillment(event.target.value)}>
                  <option>Entrega</option>
                  <option>Retirada na loja</option>
                </select>
              </label>
              {fulfillment === 'Entrega' && (
                <fieldset className="delivery-address">
                  <legend>Endereço para entrega</legend>
                  <label>
                    Rua / Avenida
                    <input
                      value={street}
                      onChange={(event) => {
                        selectedStreetFromLookup.current = ''
                        setStreet(event.target.value)
                        setAddressLookupMessage('')
                      }}
                      autoComplete="address-line1"
                      placeholder={deliveryCity ? 'Digite ao menos 3 letras para buscar' : 'Selecione primeiro o município'}
                      required
                    />
                    {isSearchingAddress && <span className="address-status" role="status">Buscando endereços…</span>}
                    {addressSuggestions.length > 0 && (
                      <ul className="address-suggestions" role="listbox" aria-label="Sugestões de endereço ViaCEP">
                        {addressSuggestions.map((address) => (
                          <li key={`${address.cep}-${address.logradouro}`} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected="false"
                              onClick={() => chooseAddress(address)}
                            >
                              <strong>{address.logradouro}</strong>
                              <span>{[address.bairro, address.localidade, address.cep].filter(Boolean).join(' · ')}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {addressLookupMessage && <span className="address-status" role="status">{addressLookupMessage}</span>}
                    <span className="address-hint">Sugestões pelo ViaCEP após informar município e 3 letras do logradouro.</span>
                  </label>
                  <label>
                    Número da casa
                    <input value={houseNumber} onChange={(event) => setHouseNumber(event.target.value)} autoComplete="off" placeholder="Número" required />
                  </label>
                  <label>
                    Complemento <span className="optional">(opcional)</span>
                    <input value={complement} onChange={(event) => setComplement(event.target.value)} autoComplete="address-line2" placeholder="Apto, bloco, casa..." />
                  </label>
                  <label>
                    Bairro
                    <input value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} autoComplete="address-level3" placeholder="Seu bairro" required />
                  </label>
                  <label>
                    Município / região
                    <select
                      value={deliveryCity}
                      onChange={(event) => setDeliveryCity(event.target.value as DeliveryCity | '')}
                      required
                    >
                      <option value="">Selecione o município</option>
                      <option value="Belém">Belém</option>
                      <option value="Ananindeua">Ananindeua</option>
                      <option value="Marituba">Marituba</option>
                      <option value="Icoaraci">Icoaraci</option>
                    </select>
                  </label>
                  {deliveryFee !== null && (
                    <p className="delivery-fee" role="status">
                      Entrega de {selectedUnit.city} para {deliveryCity}: <strong>{formatPrice(deliveryFee)}</strong>
                    </p>
                  )}
                  <label>
                    CEP <span className="optional">(opcional)</span>
                    <input
                      value={postalCode}
                      onChange={handlePostalCodeChange}
                      autoComplete="postal-code"
                      inputMode="numeric"
                      placeholder="00000-000"
                    />
                  </label>
                  <label>
                    Ponto de referência <span className="optional">(opcional)</span>
                    <input value={referencePoint} onChange={(event) => setReferencePoint(event.target.value)} autoComplete="off" placeholder="Ex.: próximo à praça" />
                  </label>
                  <label>
                    Observações da entrega <span className="optional">(opcional)</span>
                    <input value={deliveryNotes} onChange={(event) => setDeliveryNotes(event.target.value)} autoComplete="off" placeholder="Ex.: deixar na portaria" />
                  </label>
                </fieldset>
              )}
              <fieldset>
                <legend>Forma de pagamento</legend>
                <label className="payment-option">
                  <input type="radio" name="payment" value="Cartão de crédito" checked={payment === 'Cartão de crédito'} onChange={() => setPayment('Cartão de crédito')} />
                  Cartão de crédito ou débito <span>consultar condições com a atendente</span>
                </label>
                <label className="payment-option">
                  <input type="radio" name="payment" value="Dinheiro" checked={payment === 'Dinheiro'} onChange={() => setPayment('Dinheiro')} />
                  Dinheiro <span>combinar pagamento e troco com a atendente</span>
                </label>
                <label className="payment-option">
                  <input type="radio" name="payment" value="Pix" checked={payment === 'Pix'} onChange={() => setPayment('Pix')} />
                  Pix <span>a atendente envia os dados para pagamento no WhatsApp</span>
                </label>
                <label className="payment-option">
                  <input type="radio" name="payment" value="Link de pagamento" checked={payment === 'Link de pagamento'} onChange={() => setPayment('Link de pagamento')} />
                  Link de pagamento <span>receba o link seguro diretamente no WhatsApp</span>
                </label>
              </fieldset>
              <WhatsAppButton type="submit" disabled={fulfillment === 'Entrega' && deliveryFee === null}>
                Confirmar pedido com a atendente
                <span aria-hidden="true">↗</span>
              </WhatsAppButton>
              <p className="secure-note">O pedido e a forma de pagamento serão confirmados diretamente com a atendente pelo WhatsApp.</p>
            </form>
          </>
        )}
      </Drawer>
    </Overlay>
  )
}

export default CartDrawer
