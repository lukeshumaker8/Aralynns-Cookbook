import { Link } from 'react-router-dom'

function RecipeCard({ recipe }) {
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

  return (
    <Link to={`/recipe/${recipe.id}`} className="recipe-card">
      <div className="recipe-card-image">
        <div className="recipe-card-placeholder">
          <span>🍽️</span>
        </div>
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
