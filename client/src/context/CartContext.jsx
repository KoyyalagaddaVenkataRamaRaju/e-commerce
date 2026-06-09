import { useCallback, useMemo, useState } from 'react'
import { CartContext } from './CartStore'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = useCallback((product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }

      return [...current, { ...product, quantity }]
    })
  }, [])

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])

  const updateQuantity = useCallback((id, quantity) => {
    if (quantity < 1) {
      removeItem(id)
      return
    }

    setItems((current) => current.map((item) => (item.id === id ? { ...item, quantity } : item)))
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const delivery = subtotal > 50000 || subtotal === 0 ? 0 : 750
    const tax = Math.round(subtotal * 0.18)

    return {
      subtotal,
      delivery,
      tax,
      total: subtotal + delivery + tax,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
    }
  }, [items])

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clearCart, totals }),
    [addItem, clearCart, items, removeItem, totals, updateQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
