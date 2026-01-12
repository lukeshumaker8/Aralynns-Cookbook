import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'To-Go']
const COOKING_METHODS = ['Oven', 'Stovetop', 'Slow Cooker']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const CLOUDINARY_CLOUD_NAME = 'djzk1n1zc'
const CLOUDINARY_UPLOAD_PRESET = 'acookbook'

function AddRecipePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    prep_time: '',
    cook_time: '',
    difficulty: '',
    meal_type: '',
    cooking_method: '',
    recipe_url: ''
  })

  const [ingredients, setIngredients] = useState([{ amount: '', unit: '', name: '' }])
  const [instructions, setInstructions] = useState([''])

  const handleImportRecipe = async () => {
    if (!importUrl.trim()) return

    setImporting(true)
    setImportError(null)

    try {
      const res = await fetch('/api/import-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import recipe')
      }

      // Auto-fill the form with imported data
      setFormData({
        name: data.name || '',
        description: data.description || '',
        image_url: '',
        prep_time: data.prep_time || '',
        cook_time: data.cook_time || '',
        difficulty: data.difficulty || '',
        meal_type: data.meal_type || '',
        cooking_method: data.cooking_method || '',
        recipe_url: data.recipe_url || importUrl
      })

      // Set ingredients
      if (data.ingredients && data.ingredients.length > 0) {
        setIngredients(data.ingredients)
      }

      // Set instructions
      if (data.instructions && data.instructions.length > 0) {
        setInstructions(data.instructions)
      }

      setImportUrl('')
    } catch (err) {
      setImportError(err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Show local preview immediately
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)

    // Upload to Cloudinary
    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: uploadData }
      )

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setFormData(prev => ({ ...prev, image_url: data.secure_url }))
    } catch (err) {
      setError('Failed to upload image. Please try again.')
      setImagePreview(null)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: '' }))
  }

  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients]
    updated[index][field] = value
    setIngredients(updated)
  }

  const addIngredient = () => {
    setIngredients([...ingredients, { amount: '', unit: '', name: '' }])
  }

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index))
    }
  }

  const handleInstructionChange = (index, value) => {
    const updated = [...instructions]
    updated[index] = value
    setInstructions(updated)
  }

  const addInstruction = () => {
    setInstructions([...instructions, ''])
  }

  const removeInstruction = (index) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const validIngredients = ingredients.filter(ing => ing.name.trim())
      const validInstructions = instructions.filter(inst => inst.trim())

      const payload = {
        ...formData,
        prep_time: formData.prep_time ? parseInt(formData.prep_time) : null,
        cook_time: formData.cook_time ? parseInt(formData.cook_time) : null,
        ingredients: validIngredients,
        instructions: validInstructions
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

      <div className="import-section">
        <h2>Import from URL</h2>
        <p className="import-hint">Paste a recipe URL and let AI automatically extract the ingredients and instructions</p>
        <div className="import-input-group">
          <input
            type="url"
            className="import-url-input"
            placeholder="https://example.com/recipe..."
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImportRecipe())}
            disabled={importing}
          />
          <button
            type="button"
            className="btn-import"
            onClick={handleImportRecipe}
            disabled={importing || !importUrl.trim()}
          >
            {importing ? 'Importing...' : 'Import Recipe'}
          </button>
        </div>
        {importError && <div className="import-error">{importError}</div>}
      </div>

      <div className="form-divider">
        <span>or fill in manually</span>
      </div>

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
            <label>Recipe Image</label>
            <div className="image-upload-area">
              {imagePreview || formData.image_url ? (
                <div className="image-preview-container">
                  <img
                    src={imagePreview || formData.image_url}
                    alt="Recipe preview"
                    className="image-preview"
                  />
                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={removeImage}
                  >
                    Remove
                  </button>
                  {uploading && <div className="upload-overlay">Uploading...</div>}
                </div>
              ) : (
                <label className="upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                  />
                  <span className="upload-icon">+</span>
                  <span className="upload-text">
                    {uploading ? 'Uploading...' : 'Click to upload image'}
                  </span>
                </label>
              )}
            </div>
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
          <h2>Ingredients</h2>
          <div className="ingredients-input-list">
            {ingredients.map((ing, index) => (
              <div key={index} className="ingredient-input-row">
                <input
                  type="text"
                  placeholder="Amount"
                  value={ing.amount}
                  onChange={(e) => handleIngredientChange(index, 'amount', e.target.value)}
                  className="ingredient-amount-input"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={ing.unit}
                  onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                  className="ingredient-unit-input"
                />
                <input
                  type="text"
                  placeholder="Ingredient name"
                  value={ing.name}
                  onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                  className="ingredient-name-input"
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeIngredient(index)}
                  disabled={ingredients.length === 1}
                >
                  X
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="add-btn" onClick={addIngredient}>
            + Add Ingredient
          </button>
        </div>

        <div className="form-section">
          <h2>Instructions</h2>
          <div className="instructions-input-list">
            {instructions.map((inst, index) => (
              <div key={index} className="instruction-input-row">
                <span className="step-label">Step {index + 1}</span>
                <textarea
                  placeholder="Describe this step..."
                  value={inst}
                  onChange={(e) => handleInstructionChange(index, e.target.value)}
                  className="instruction-input"
                  rows="2"
                />
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeInstruction(index)}
                  disabled={instructions.length === 1}
                >
                  X
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="add-btn" onClick={addInstruction}>
            + Add Step
          </button>
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
