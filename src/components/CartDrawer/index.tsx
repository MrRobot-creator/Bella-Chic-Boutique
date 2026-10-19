import { FormEvent, MouseEvent, useEffect, useState } from 'react'
import { storeConfig } from '../../config/store'
import { CartItem, PaymentMethod } from '../../types/store'
import { createOrderMessage, createOrderReference, createWhatsAppUrl } from '../../services/whatsapp'
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
  const [payment, setPayment] = useState<PaymentMethod>('Cartão de crédito')
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const selectedUnit = storeConfig.units.find((unit) => unit.id === selectedUnitId) || storeConfig.units[0]
  const availableContacts = storeConfig.whatsappContacts.filter((contact) => contact.unitId === selectedUnit.id)
  const selectedContact = availableContacts.find((contact) => contact.id === selectedContactId) || availableContacts[0]

  useEffect(() => {
    const contactsForUnit = storeConfig.whatsappContacts.filter((contact) => contact.unitId === selectedUnitId)
    if (!contactsForUnit.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(contactsForUnit[0].id)
    }
  }, [selectedUnitId, selectedContactId])

  if (!isOpen) return null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
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
      referencePoint: fulfillment === 'Entrega' ? referencePoint.trim() : '',
      deliveryNotes: fulfillment === 'Entrega' ? deliveryNotes.trim() : '',
      deliveryFee: fulfillment === 'Entrega' ? null : 0,
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
              {items.map(({ product, size, color, quantity }) => (
                <ItemRow key={`${product.id}-${size}-${color}`}>
                  <ItemImage src={product.image} alt="" />
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
              ))}
            </Items>

            <Summary>
              <div className="subtotal"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              <p>Frete e prazo de entrega confirmados com a atendente pelo WhatsApp.</p>
              <Total><span>Total dos produtos</span><strong>{formatPrice(total)}</strong></Total>
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
                    <input value={street} onChange={(event) => setStreet(event.target.value)} autoComplete="address-line1" placeholder="Nome da rua ou avenida" required />
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
                    CEP <span className="optional">(opcional)</span>
                    <input value={postalCode} onChange={(event) => setPostalCode(event.target.value)} autoComplete="postal-code" inputMode="numeric" placeholder="00000-000" />
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
              </fieldset>
              <WhatsAppButton type="submit">
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
