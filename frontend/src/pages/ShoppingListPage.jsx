import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useShoppingList } from '../context/ShoppingListContext'
import { getCategoryInfo, getCategoryOrder } from '../utils/ingredientCategories'

function ShoppingListPage() {
  const {
    items,
    loading,
    toggleItem,
    toggleMerged,
    clearAll,
    clearChecked,
    getMergedList
  } = useShoppingList()

  const [showMerged, setShowMerged] = useState(true)
  const [hideChecked, setHideChecked] = useState(false)

  // Group items by category
  const groupedItems = useMemo(() => {
    const listToGroup = showMerged ? getMergedList() : items
    const filtered = hideChecked
      ? listToGroup.filter(item => !item.checked)
      : listToGroup

    const groups = {}
    const categoryOrder = getCategoryOrder()

    // Initialize categories in order
    categoryOrder.forEach(catId => {
      groups[catId] = []
    })

    filtered.forEach(item => {
      const category = item.category || 'other'
      if (!groups[category]) groups[category] = []
      groups[category].push(item)
    })

    // Remove empty categories
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) delete groups[key]
    })

    return groups
  }, [items, showMerged, hideChecked, getMergedList])

  const handleToggle = (item) => {
    if (showMerged && item.itemIds) {
      toggleMerged(item.itemIds)
    } else {
      toggleItem(item.id)
    }
  }

  const checkedCount = items.filter(i => i.checked).length
  const totalCount = items.length

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading shopping list...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="shopping-list-page">
        <h1>Shopping List</h1>
        <div className="empty-list">
          <span className="empty-icon">🛒</span>
          <h2>Your shopping list is empty</h2>
          <p>Add recipes to your shopping list from the recipe pages</p>
          <Link to="/" className="btn-primary">Browse Recipes</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="shopping-list-page">
      <header className="shopping-list-header">
        <h1>Shopping List</h1>
        <p className="shopping-list-summary">
          {checkedCount} of {totalCount} items checked
        </p>
      </header>

      <div className="shopping-list-controls">
        <div className="control-group">
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={showMerged}
              onChange={(e) => setShowMerged(e.target.checked)}
            />
            <span>Combine duplicates</span>
          </label>
          <label className="toggle-control">
            <input
              type="checkbox"
              checked={hideChecked}
              onChange={(e) => setHideChecked(e.target.checked)}
            />
            <span>Hide checked</span>
          </label>
        </div>
        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={clearChecked}
            disabled={checkedCount === 0}
          >
            Clear Checked
          </button>
          <button
            className="btn-danger"
            onClick={() => {
              if (window.confirm('Clear entire shopping list?')) {
                clearAll()
              }
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="shopping-list-categories">
        {Object.entries(groupedItems).map(([categoryId, categoryItems]) => {
          const categoryInfo = getCategoryInfo(categoryId)

          return (
            <section key={categoryId} className="category-section">
              <h2 className="category-header">
                <span className="category-icon">{categoryInfo.icon}</span>
                <span className="category-name">{categoryInfo.name}</span>
                <span className="category-count">({categoryItems.length})</span>
              </h2>

              <ul className="shopping-items">
                {categoryItems.map((item, index) => (
                  <li
                    key={showMerged ? `merged-${categoryId}-${index}` : item.id}
                    className={`shopping-item ${item.checked ? 'checked' : ''}`}
                  >
                    <label className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => handleToggle(item)}
                      />
                      <span className="checkmark"></span>
                    </label>

                    <div className="item-details">
                      <span className="item-name">
                        {item.name || item.ingredient?.name}
                      </span>

                      {showMerged && item.recipes ? (
                        <div className="item-amounts">
                          {item.recipes.map((recipe, i) => (
                            <span key={i} className="amount-tag">
                              {recipe.amount} {recipe.unit}
                              <Link
                                to={`/recipe/${recipe.id}`}
                                className="recipe-link"
                              >
                                ({recipe.name})
                              </Link>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="item-amount">
                          {item.ingredient?.amount} {item.ingredient?.unit}
                          <Link
                            to={`/recipe/${item.recipeId}`}
                            className="recipe-link"
                          >
                            ({item.recipeName})
                          </Link>
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}

export default ShoppingListPage
