import { useState, useEffect } from 'react'
import RecipeCard from '../components/RecipeCard'
import FilterBar from '../components/FilterBar'

function HomePage() {
  const [recipes, setRecipes] = useState([])
  const [filterOptions, setFilterOptions] = useState({})
  const [filters, setFilters] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchRecipes()
  }, [filters])

  const fetchFilterOptions = async () => {
    try {
      const res = await fetch('/api/recipes/filters/options')
      const data = await res.json()
      setFilterOptions(data)
    } catch (err) {
      console.error('Error fetching filter options:', err)
    }
  }

  const fetchRecipes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })

      const res = await fetch(`/api/recipes?${params}`)
      const data = await res.json()
      setRecipes(data)
      setError(null)
    } catch (err) {
      setError('Failed to load recipes')
      console.error('Error fetching recipes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  return (
    <div className="home-page">
      <section className="hero">
        <h2>Welcome to Aralynn's Cookbook</h2>
        <p>Discover delicious recipes for every occasion</p>
      </section>

      <FilterBar
        filters={filters}
        options={filterOptions}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading recipes...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : recipes.length === 0 ? (
        <div className="no-results">
          <p>No recipes found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="recipe-grid">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}

    </div>
  )
}

export default HomePage
