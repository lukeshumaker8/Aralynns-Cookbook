import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useShoppingList } from '../context/ShoppingListContext'

function RecipeCard({ recipe }) {
  const { addRecipe, removeRecipe, checkRecipeInList } = useShoppingList()
  const [isAdding, setIsAdding] = useState(false)

  const isInList = checkRecipeInList(recipe.id)

  const difficultyColor = {
    Easy: '#22c55e',
    Medium: '#f59e0b',
    Hard: '#ef4444'
  }

  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  const handleAddToList = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (isInList) {
      removeRecipe(recipe.id)
      return
    }

    setIsAdding(true)
    try {
      // Fetch full recipe with ingredients
      const res = await fetch(`/api/recipes/${recipe.id}`)
      const fullRecipe = await res.json()

      if (fullRecipe.ingredients?.length) {
        addRecipe(fullRecipe)
      }
    } catch (error) {
      console.error('Error adding to list:', error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card">
      <div className="recipe-card-image">
        {recipe.image_url ? (
          <img src={recipe.image_url} alt={recipe.name} className="recipe-card-img" />
        ) : (
          <div className="recipe-card-placeholder">
            <span>🍽️</span>
          </div>
        )}
        <button
          className={`add-to-list-btn ${isInList ? 'in-list' : ''}`}
          onClick={handleAddToList}
          disabled={isAdding}
          title={isInList ? 'Remove from list' : 'Add to shopping list'}
        >
          {isAdding ? '...' : isInList ? '✓' : '+'}
        </button>
        <div className="recipe-card-badges">
          <span
            className="badge difficulty"
            style={{ backgroundColor: difficultyColor[recipe.difficulty] }}
          >
            {recipe.difficulty}
          </span>
          <span className="badge cooking-method">{recipe.cooking_method}</span>
        </div>
      </div>
      <div className="recipe-card-content">
        <span className="meal-type">{recipe.meal_type}</span>
        <h3 className="recipe-title">{recipe.name}</h3>
        <p className="recipe-description">{recipe.description}</p>
        <div className="recipe-meta">
          <div className="meta-item">
            <span className="meta-icon">⏱️</span>
            <span>{formatTime(recipe.total_time)}</span>
          </div>
        </div>
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="recipe-tags">
            {recipe.tags.slice(0, 3).map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}

export default RecipeCard
