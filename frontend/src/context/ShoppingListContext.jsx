import { createContext, useContext, useState, useEffect } from 'react'
import {
  getShoppingList,
  addRecipeToList,
  removeRecipeFromList,
  toggleItemChecked,
  clearShoppingList,
  clearCheckedItems,
  isRecipeInList,
  getMergedShoppingList,
  toggleMergedItems,
  addStandaloneItem
} from '../utils/shoppingListStorage'

const ShoppingListContext = createContext(null)

export function ShoppingListProvider({ children }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    setItems(getShoppingList())
    setLoading(false)
  }, [])

  // Add a recipe's ingredients to the list
  const addRecipe = (recipe) => {
    addRecipeToList(recipe)
    setItems(getShoppingList())
  }

  // Remove a recipe's ingredients from the list
  const removeRecipe = (recipeId) => {
    removeRecipeFromList(recipeId)
    setItems(getShoppingList())
  }

  // Toggle a single item's checked status
  const toggleItem = (itemId) => {
    const updated = toggleItemChecked(itemId)
    setItems(updated)
  }

  // Toggle multiple items (for merged view)
  const toggleMerged = (itemIds) => {
    const updated = toggleMergedItems(itemIds)
    setItems(updated)
  }

  // Clear entire list
  const clearAll = () => {
    clearShoppingList()
    setItems([])
  }

  // Clear only checked items
  const clearChecked = () => {
    const remaining = clearCheckedItems()
    setItems(remaining)
  }

  // Add a standalone item (not from a recipe)
  const addItem = (name, category) => {
    const updated = addStandaloneItem(name, category)
    setItems(updated)
  }

  // Check if a recipe is in the list
  const checkRecipeInList = (recipeId) => {
    return isRecipeInList(recipeId)
  }

  // Get merged list (duplicates combined)
  const getMergedList = () => {
    return getMergedShoppingList()
  }

  // Get total item count
  const getItemCount = () => items.length

  // Get unchecked item count
  const getUncheckedCount = () => items.filter(item => !item.checked).length

  // Get unique recipe count
  const getRecipeCount = () => {
    return new Set(items.map(item => item.recipeId)).size
  }

  const value = {
    items,
    loading,
    addRecipe,
    removeRecipe,
    addItem,
    toggleItem,
    toggleMerged,
    clearAll,
    clearChecked,
    checkRecipeInList,
    getMergedList,
    getItemCount,
    getUncheckedCount,
    getRecipeCount
  }

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  )
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext)
  if (!context) {
    throw new Error('useShoppingList must be used within ShoppingListProvider')
  }
  return context
}
