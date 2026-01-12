import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useShoppingList } from '../context/ShoppingListContext'
import { getCategoryInfo, getCategoryOrder } from '../utils/ingredientCategories'
import { searchGroceryItems } from '../utils/groceryDatabase'

function ShoppingListPage() {
  const {
    items,
    loading,
    addItem,
    updateItem,
    toggleItem,
    toggleMerged,
    clearAll,
    clearChecked,
    getMergedList
  } = useShoppingList()

  const [showMerged, setShowMerged] = useState(true)
  const [hideChecked, setHideChecked] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [editingItem, setEditingItem] = useState(null)
  const [editAmount, setEditAmount] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const searchRef = useRef(null)
  const dropdownRef = useRef(null)

  const handleEditClick = (item) => {
    setEditingItem(item.id)
    setEditAmount(item.ingredient?.amount || '')
    setEditUnit(item.ingredient?.unit || '')
  }

  const handleEditSave = () => {
    if (editingItem) {
      updateItem(editingItem, editAmount, editUnit)
      setEditingItem(null)
      setEditAmount('')
      setEditUnit('')
    }
  }

  const handleEditCancel = () => {
    setEditingItem(null)
    setEditAmount('')
    setEditUnit('')
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave()
    } else if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  // Search grocery items as user types
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const results = searchGroceryItems(searchQuery, 8)
      setSearchResults(results)
      setShowDropdown(true)
      setSelectedIndex(-1)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchKeyDown = (e) => {
    if (!showDropdown) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleAddItem(searchResults[selectedIndex])
      } else if (searchQuery.trim()) {
        // Add custom item
        handleAddCustomItem()
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  const handleAddItem = (item) => {
    addItem(item.name, item.category)
    setSearchQuery('')
    setShowDropdown(false)
    setSelectedIndex(-1)
  }

  const handleAddCustomItem = () => {
    if (searchQuery.trim()) {
      addItem(searchQuery.trim())
      setSearchQuery('')
      setShowDropdown(false)
    }
  }

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

        <div className="grocery-search-container">
          <div className="grocery-search" ref={searchRef}>
            <input
              type="text"
              className="grocery-search-input"
              placeholder="Search groceries to add (e.g., strawberries, milk)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery('')
                  setShowDropdown(false)
                }}
              >
                x
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="grocery-search-dropdown" ref={dropdownRef}>
              {searchResults.length > 0 ? (
                <>
                  {searchResults.map((item, index) => {
                    const categoryInfo = getCategoryInfo(item.category)
                    return (
                      <button
                        key={item.name}
                        type="button"
                        className={`dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                        onClick={() => handleAddItem(item)}
                      >
                        <span className="dropdown-item-icon">{categoryInfo.icon}</span>
                        <span className="dropdown-item-name">{item.name}</span>
                        <span className="dropdown-item-category">{categoryInfo.name}</span>
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    className={`dropdown-item dropdown-item-custom ${selectedIndex === -1 && searchQuery ? 'hint' : ''}`}
                    onClick={handleAddCustomItem}
                  >
                    <span className="dropdown-item-icon">+</span>
                    <span className="dropdown-item-name">Add "{searchQuery}"</span>
                    <span className="dropdown-item-category">Custom item</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="dropdown-item dropdown-item-custom"
                  onClick={handleAddCustomItem}
                >
                  <span className="dropdown-item-icon">+</span>
                  <span className="dropdown-item-name">Add "{searchQuery}"</span>
                  <span className="dropdown-item-category">Custom item</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="empty-list">
          <span className="empty-icon">🛒</span>
          <h2>Your shopping list is empty</h2>
          <p>Search above to add items, or add recipes from the recipe pages</p>
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

      <div className="grocery-search-container">
        <div className="grocery-search" ref={searchRef}>
          <input
            type="text"
            className="grocery-search-input"
            placeholder="Search groceries to add (e.g., strawberries, milk)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => {
                setSearchQuery('')
                setShowDropdown(false)
              }}
            >
              x
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="grocery-search-dropdown" ref={dropdownRef}>
            {searchResults.length > 0 ? (
              <>
                {searchResults.map((item, index) => {
                  const categoryInfo = getCategoryInfo(item.category)
                  return (
                    <button
                      key={item.name}
                      type="button"
                      className={`dropdown-item ${index === selectedIndex ? 'selected' : ''}`}
                      onClick={() => handleAddItem(item)}
                    >
                      <span className="dropdown-item-icon">{categoryInfo.icon}</span>
                      <span className="dropdown-item-name">{item.name}</span>
                      <span className="dropdown-item-category">{categoryInfo.name}</span>
                    </button>
                  )
                })}
                <button
                  type="button"
                  className={`dropdown-item dropdown-item-custom ${selectedIndex === -1 && searchQuery ? 'hint' : ''}`}
                  onClick={handleAddCustomItem}
                >
                  <span className="dropdown-item-icon">+</span>
                  <span className="dropdown-item-name">Add "{searchQuery}"</span>
                  <span className="dropdown-item-category">Custom item</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="dropdown-item dropdown-item-custom"
                onClick={handleAddCustomItem}
              >
                <span className="dropdown-item-icon">+</span>
                <span className="dropdown-item-name">Add "{searchQuery}"</span>
                <span className="dropdown-item-category">Custom item</span>
              </button>
            )}
          </div>
        )}
      </div>

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
                      ) : editingItem === item.id ? (
                        <div className="item-edit-form">
                          <input
                            type="text"
                            className="edit-amount-input"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            placeholder="Amt"
                            autoFocus
                          />
                          <input
                            type="text"
                            className="edit-unit-input"
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            placeholder="Unit"
                          />
                          <button
                            type="button"
                            className="edit-save-btn"
                            onClick={handleEditSave}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="edit-cancel-btn"
                            onClick={handleEditCancel}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span className="item-amount">
                          {item.ingredient?.amount} {item.ingredient?.unit}
                          {item.recipeId ? (
                            <Link
                              to={`/recipe/${item.recipeId}`}
                              className="recipe-link"
                            >
                              ({item.recipeName})
                            </Link>
                          ) : (
                            <span className="recipe-link">({item.recipeName})</span>
                          )}
                        </span>
                      )}
                    </div>

                    {!showMerged && editingItem !== item.id && (
                      <button
                        type="button"
                        className="edit-item-btn"
                        onClick={() => handleEditClick(item)}
                        title="Edit amount"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    )}
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
