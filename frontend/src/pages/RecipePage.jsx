import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AddToListButton from '../components/AddToListButton'

function RecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [servings, setServings] = useState(2)

  // Scale ingredient amount based on serving multiplier
  const scaleAmount = (amount, baseServings) => {
    if (!amount) return amount

    const multiplier = servings / (baseServings || 2)

    // Handle fractions like "1/2", "3/4"
    const fractionMatch = amount.match(/^(\d+)\/(\d+)$/)
    if (fractionMatch) {
      const result = (parseInt(fractionMatch[1]) / parseInt(fractionMatch[2])) * multiplier
      return formatNumber(result)
    }

    // Handle mixed numbers like "1 1/2"
    const mixedMatch = amount.match(/^(\d+)\s+(\d+)\/(\d+)$/)
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1])
      const frac = parseInt(mixedMatch[2]) / parseInt(mixedMatch[3])
      const result = (whole + frac) * multiplier
      return formatNumber(result)
    }

    // Handle plain numbers
    const num = parseFloat(amount)
    if (!isNaN(num)) {
      return formatNumber(num * multiplier)
    }

    // Return unchanged for text amounts like "pinch", "to taste"
    return amount
  }

  // Format numbers nicely (convert decimals to fractions when appropriate)
  const formatNumber = (num) => {
    if (num === Math.floor(num)) return num.toString()

    // Common fraction conversions
    const fractions = [
      { decimal: 0.25, display: '1/4' },
      { decimal: 0.33, display: '1/3' },
      { decimal: 0.5, display: '1/2' },
      { decimal: 0.67, display: '2/3' },
      { decimal: 0.75, display: '3/4' }
    ]

    const whole = Math.floor(num)
    const decimal = num - whole

    for (const frac of fractions) {
      if (Math.abs(decimal - frac.decimal) < 0.05) {
        return whole > 0 ? `${whole} ${frac.display}` : frac.display
      }
    }

    // Default to 1 decimal place
    return num.toFixed(1).replace(/\.0$/, '')
  }

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

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this recipe?')) {
      return
    }

    try {
      setDeleting(true)
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete recipe')
      navigate('/')
    } catch (err) {
      alert(err.message)
      setDeleting(false)
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
        {recipe.image_url && (
          <div className="recipe-hero-image">
            <img src={recipe.image_url} alt={recipe.name} />
          </div>
        )}
        <header className="recipe-header">
          <div className="recipe-header-content">
            <div className="recipe-header-top">
              <span className="meal-type-badge">{recipe.meal_type}</span>
              <div className="header-actions">
                {recipe.ingredients?.length > 0 && (
                  <AddToListButton recipe={recipe} variant="full" />
                )}
                <button
                  className="delete-button"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete Recipe'}
                </button>
              </div>
            </div>
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
              <div className="ingredients-header">
                <h2>Ingredients</h2>
                <div className="servings-control">
                  <button
                    type="button"
                    className="servings-btn"
                    onClick={() => setServings(s => Math.max(1, s - 1))}
                    disabled={servings <= 1}
                  >
                    -
                  </button>
                  <span className="servings-display">
                    {servings} {servings === 1 ? 'serving' : 'servings'}
                  </span>
                  <button
                    type="button"
                    className="servings-btn"
                    onClick={() => setServings(s => s + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <ul className="ingredients-list">
                {recipe.ingredients.map((ing, index) => (
                  <li key={index} className="ingredient-item">
                    <span className="ingredient-amount">
                      {scaleAmount(ing.amount, recipe.servings || 2)} {ing.unit}
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
