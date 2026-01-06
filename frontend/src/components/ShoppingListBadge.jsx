import { useShoppingList } from '../context/ShoppingListContext'

function ShoppingListBadge() {
  const { getUncheckedCount } = useShoppingList()
  const count = getUncheckedCount()

  if (count === 0) return null

  return (
    <span className="shopping-list-badge">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default ShoppingListBadge
