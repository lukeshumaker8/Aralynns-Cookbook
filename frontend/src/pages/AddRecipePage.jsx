import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'To-Go']
const COOKING_METHODS = ['Oven', 'Stovetop', 'Slow Cooker']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

function AddRecipePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    prep_time: '',
    cook_time: '',
    servings: '',
    difficulty: '',
    meal_type: '',
    cooking_method: '',
    recipe_url: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
        cook_time: formData.cook_time ? parseInt(formData.cook_time) : null,
        servings: formData.servings ? parseInt(formData.servings) : null
      }

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create recipe')
      }

      const data = await res.json()
      navigate(`/recipe/${data.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="add-recipe-page">
      <h1>Add New Recipe</h1>

      {error && <div className="form-error">{error}</div>}

      <form onSubmit={handleSubmit} className="recipe-form">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="name">Recipe Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Philly Cheesesteak"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="A brief description of the recipe..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="image_url">Image URL</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Recipe Details</h2>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prep_time">Prep Time (minutes)</label>
              <input
                type="number"
                id="prep_time"
                name="prep_time"
                value={formData.prep_time}
                onChange={handleChange}
                min="0"
                placeholder="15"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cook_time">Cook Time (minutes)</label>
              <input
                type="number"
                id="cook_time"
                name="cook_time"
                value={formData.cook_time}
                onChange={handleChange}
                min="0"
                placeholder="30"
              />
            </div>

            <div className="form-group">
              <label htmlFor="servings">Servings</label>
              <input
                type="number"
                id="servings"
                name="servings"
                value={formData.servings}
                onChange={handleChange}
                min="1"
                placeholder="4"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="meal_type">Meal Type</label>
              <select
                id="meal_type"
                name="meal_type"
                value={formData.meal_type}
                onChange={handleChange}
              >
                <option value="">Select meal type</option>
                {MEAL_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="cooking_method">Cooking Method</label>
              <select
                id="cooking_method"
                name="cooking_method"
                value={formData.cooking_method}
                onChange={handleChange}
              >
                <option value="">Select method</option>
                {COOKING_METHODS.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
              >
                <option value="">Select difficulty</option>
                {DIFFICULTIES.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>External Recipe Link</h2>
          <div className="form-group">
            <label htmlFor="recipe_url">Recipe URL (optional)</label>
            <input
              type="url"
              id="recipe_url"
              name="recipe_url"
              value={formData.recipe_url}
              onChange={handleChange}
              placeholder="https://example.com/full-recipe"
            />
            <span className="form-hint">Link to the full recipe if hosted elsewhere</span>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Recipe'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddRecipePage
