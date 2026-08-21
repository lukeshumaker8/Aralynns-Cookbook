import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AddToListButton from '../components/AddToListButton'
import { parseAmount, formatAmount } from '../utils/formatAmount'

function RecipePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  // Null until the cook adjusts the stepper. The baseline comes from the
  // recipe itself — hardcoding 2 here meant every recipe (all of which are
  // written for 4, 6 or 8) opened showing halved or quartered quantities.
  const [servingsOverride, setServingsOverride] = useState(null)
  const [unitSystem, setUnitSystem] = useState('original')

  const baseServings = recipe?.servings || 2
  const servings = servingsOverride ?? baseServings
  const multiplier = servings / baseServings

  // Mise en place is per-cook, not per-recipe, so this lives in sessionStorage
  // rather than the database. Keyed by ingredient name so editing the recipe
  // later doesn't shuffle which boxes are ticked.
  const [checked, setChecked] = useState(() => new Set())

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`cookbook-checked-${id}`)
      setChecked(new Set(stored ? JSON.parse(stored) : []))
    } catch {
      setChecked(new Set())
    }
  }, [id])

  const toggleChecked = (name) => {
    setChecked((current) => {
      const next = new Set(current)
      if (next.has(name)) next.delete(name)
      else next.add(name)

      try {
        sessionStorage.setItem(`cookbook-checked-${id}`, JSON.stringify([...next]))
      } catch {
        // Private browsing — ticks just won't survive a reload.
      }

      return next
    })
  }

  // Conversion factors, all relative to a base unit.
  const unitConversions = {
    // Volume (base: ml)
    cup: { toMl: 237, type: 'volume' },
    cups: { toMl: 237, type: 'volume' },
    tbsp: { toMl: 15, type: 'volume' },
    tablespoon: { toMl: 15, type: 'volume' },
    tablespoons: { toMl: 15, type: 'volume' },
    tsp: { toMl: 5, type: 'volume' },
    teaspoon: { toMl: 5, type: 'volume' },
    teaspoons: { toMl: 5, type: 'volume' },
    'fl oz': { toMl: 30, type: 'volume' },
    'fluid oz': { toMl: 30, type: 'volume' },
    ml: { toMl: 1, type: 'volume' },
    l: { toMl: 1000, type: 'volume' },
    liter: { toMl: 1000, type: 'volume' },
    liters: { toMl: 1000, type: 'volume' },
    // Weight (base: g)
    oz: { toG: 28.35, type: 'weight' },
    ounce: { toG: 28.35, type: 'weight' },
    ounces: { toG: 28.35, type: 'weight' },
    lb: { toG: 454, type: 'weight' },
    lbs: { toG: 454, type: 'weight' },
    pound: { toG: 454, type: 'weight' },
    pounds: { toG: 454, type: 'weight' },
    g: { toG: 1, type: 'weight' },
    gram: { toG: 1, type: 'weight' },
    grams: { toG: 1, type: 'weight' },
    kg: { toG: 1000, type: 'weight' },
    kilogram: { toG: 1000, type: 'weight' },
    kilograms: { toG: 1000, type: 'weight' }
  }

  // Takes and returns a NUMBER. The previous version accepted the formatted
  // string and ran parseFloat over it, so "1 1/2" silently became 1.
  const convertUnit = (value, unit) => {
    if (value === null || !unit || unitSystem === 'original') {
      return { value, unit }
    }

    const conversion = unitConversions[unit.toLowerCase().trim()]
    if (!conversion) return { value, unit }

    if (conversion.type === 'volume') {
      const ml = value * conversion.toMl

      if (unitSystem === 'metric') {
        return ml >= 1000 ? { value: ml / 1000, unit: 'L' } : { value: ml, unit: 'ml' }
      }
      if (unitSystem === 'cups') {
        if (ml >= 237) return { value: ml / 237, unit: 'cups' }
        if (ml >= 15) return { value: ml / 15, unit: 'tbsp' }
        return { value: ml / 5, unit: 'tsp' }
      }
      if (unitSystem === 'tbsp') {
        return ml >= 15 ? { value: ml / 15, unit: 'tbsp' } : { value: ml / 5, unit: 'tsp' }
      }
    }

    if (conversion.type === 'weight') {
      const g = value * conversion.toG

      if (unitSystem === 'metric') {
        return g >= 1000 ? { value: g / 1000, unit: 'kg' } : { value: g, unit: 'g' }
      }
      if (unitSystem === 'imperial') {
        return g >= 454 ? { value: g / 454, unit: 'lbs' } : { value: g / 28.35, unit: 'oz' }
      }
    }

    return { value, unit }
  }

  // Parse -> scale -> convert -> format, all numeric until the last step.
  // Unparseable amounts ("to taste", "a pinch") pass through untouched.
  const displayIngredient = (ingredient) => {
    const parsed = parseAmount(ingredient.amount)

    if (parsed === null) {
      return { amount: ingredient.amount || '', unit: ingredient.unit || '' }
    }

    const converted = convertUnit(parsed * multiplier, ingredient.unit)
    return { amount: formatAmount(converted.value), unit: converted.unit || '' }
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
                {recipe.instructions?.length > 0 && (
                  <Link to={`/recipe/${id}/cook`} className="cook-mode-btn">
                    <span className="cook-mode-btn-icon">▶</span>
                    Start Cooking
                  </Link>
                )}
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
                <div className="ingredients-controls">
                  <div className="servings-control">
                    <button
                      type="button"
                      className="servings-btn"
                      onClick={() => setServingsOverride(Math.max(1, servings - 1))}
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
                      onClick={() => setServingsOverride(servings + 1)}
                    >
                      +
                    </button>
                  </div>
                  <select
                    className="unit-selector"
                    value={unitSystem}
                    onChange={(e) => setUnitSystem(e.target.value)}
                  >
                    <option value="original">Original Units</option>
                    <option value="metric">Metric (ml/g)</option>
                    <option value="cups">US Cups</option>
                    <option value="tbsp">Tablespoons</option>
                  </select>
                </div>
              </div>
              <ul className="ingredients-list">
                {recipe.ingredients.map((ing, index) => {
                  const display = displayIngredient(ing)
                  const isChecked = checked.has(ing.name)
                  return (
                    <li
                      key={index}
                      className={`ingredient-item ${isChecked ? 'is-checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="ingredient-check"
                        checked={isChecked}
                        onChange={() => toggleChecked(ing.name)}
                        aria-label={`Mark ${ing.name} as prepared`}
                      />
                      <span className="ingredient-amount">
                        {display.amount} {display.unit}
                      </span>
                      <span className="ingredient-name">{ing.name}</span>
                    </li>
                  )
                })}
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
