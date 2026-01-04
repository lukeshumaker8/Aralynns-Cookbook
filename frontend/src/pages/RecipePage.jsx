import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

function RecipePage() {
  const { id } = useParams()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRecipe()
  }, [id])

  const fetchRecipe = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/recipes/${id}`)
      if (!res.ok) throw new Error('Recipe not found')
      const data = await res.json()
      setRecipe(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${minutes} min`
  }

  const difficultyColor = {
    Easy: '#22c55e',
    Medium: '#f59e0b',
    Hard: '#ef4444'
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading recipe...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-page">
        <h2>Oops!</h2>
        <p>{error}</p>
        <Link to="/" className="back-link">← Back to recipes</Link>
      </div>
    )
  }

  if (!recipe) return null

  return (
    <div className="recipe-page">
      <Link to="/" className="back-link">← Back to recipes</Link>

      <article className="recipe-detail">
        <header className="recipe-header">
          <div className="recipe-header-content">
            <span className="meal-type-badge">{recipe.meal_type}</span>
            <h1>{recipe.name}</h1>
            <p className="recipe-description-full">{recipe.description}</p>

            <div className="recipe-info-grid">
              <div className="info-item">
                <span className="info-label">Prep Time</span>
                <span className="info-value">{formatTime(recipe.prep_time)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Cook Time</span>
                <span className="info-value">{formatTime(recipe.cook_time)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Total Time</span>
                <span className="info-value">{formatTime(recipe.total_time)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Servings</span>
                <span className="info-value">{recipe.servings}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Difficulty</span>
                <span
                  className="info-value difficulty-badge"
                  style={{ color: difficultyColor[recipe.difficulty] }}
                >
                  {recipe.difficulty}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Method</span>
                <span className="info-value">{recipe.cooking_method}</span>
              </div>
            </div>

            {recipe.tags && recipe.tags.length > 0 && (
              <div className="recipe-tags-detail">
                {recipe.tags.map(tag => (
                  <span key={tag} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </header>

        <div className="recipe-content">
          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <section className="ingredients-section">
              <h2>Ingredients</h2>
              <ul className="ingredients-list">
                {recipe.ingredients.map((ing, index) => (
                  <li key={index} className="ingredient-item">
                    <span className="ingredient-amount">
                      {ing.amount} {ing.unit}
                    </span>
                    <span className="ingredient-name">{ing.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {recipe.instructions && recipe.instructions.length > 0 && (
            <section className="instructions-section">
              <h2>Instructions</h2>
              <ol className="instructions-list">
                {recipe.instructions.map((step) => (
                  <li key={step.step_number} className="instruction-step">
                    <span className="step-number">{step.step_number}</span>
                    <p>{step.instruction}</p>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {(!recipe.ingredients || recipe.ingredients.length === 0) &&
           (!recipe.instructions || recipe.instructions.length === 0) && (
            <div className="no-recipe-content">
              <p>No detailed recipe information available yet.</p>
            </div>
          )}
        </div>

        {recipe.recipe_url && (
          <div className="recipe-external-link">
            <a href={recipe.recipe_url} target="_blank" rel="noopener noreferrer" className="external-link">
              Learn more here
              <span className="external-icon">→</span>
            </a>
          </div>
        )}
      </article>
    </div>
  )
}

export default RecipePage
