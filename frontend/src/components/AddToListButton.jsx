import { useState } from 'react'
import { useShoppingList } from '../context/ShoppingListContext'

function AddToListButton({ recipe, variant = 'icon' }) {
  const { addRecipe, removeRecipe, checkRecipeInList } = useShoppingList()
  const [isAdding, setIsAdding] = useState(false)

  const isInList = checkRecipeInList(recipe.id)

  const handleClick = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAdding(true)
    try {
      if (isInList) {
        removeRecipe(recipe.id)
      } else {
        addRecipe(recipe)
      }
    } finally {
      setIsAdding(false)
    }
  }

  if (variant === 'icon') {
    return (
      <button
        className={`add-to-list-btn ${isInList ? 'in-list' : ''}`}
        onClick={handleClick}
        disabled={isAdding || !recipe.ingredients?.length}
        title={isInList ? 'Remove from shopping list' : 'Add to shopping list'}
        aria-label={isInList ? 'Remove from shopping list' : 'Add to shopping list'}
      >
        {isAdding ? '...' : isInList ? '✓' : '+'}
      </button>
    )
  }

  // Full button variant for recipe detail page
  return (
    <button
      className={`add-to-list-btn-full ${isInList ? 'in-list' : ''}`}
      onClick={handleClick}
      disabled={isAdding || !recipe.ingredients?.length}
    >
      {isAdding ? 'Adding...' : isInList ? '✓ In Shopping List' : '+ Add to Shopping List'}
    </button>
  )
}

export default AddToListButton
