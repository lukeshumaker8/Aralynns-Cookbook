import { categorizeIngredient } from './ingredientCategories'

const STORAGE_KEY = 'aralynns_shopping_list'

// Get all items from shopping list
export function getShoppingList() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error reading shopping list:', error)
    return []
  }
}

// Save shopping list to localStorage
export function saveShoppingList(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.error('Error saving shopping list:', error)
  }
}

// Add a recipe's ingredients to the shopping list
export function addRecipeToList(recipe) {
  if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) {
    return []
  }

  const currentList = getShoppingList()
  const timestamp = Date.now()

  const newItems = recipe.ingredients.map((ingredient, index) => ({
    id: `${recipe.id}-${index}-${timestamp}`,
    recipeId: recipe.id,
    recipeName: recipe.name,
    ingredient: {
      name: ingredient.name,
      amount: ingredient.amount || '',
      unit: ingredient.unit || ''
    },
    category: categorizeIngredient(ingredient.name),
    checked: false,
    addedAt: new Date().toISOString()
  }))

  const updatedList = [...currentList, ...newItems]
  saveShoppingList(updatedList)
  return newItems
}

// Remove all items from a specific recipe
export function removeRecipeFromList(recipeId) {
  const currentList = getShoppingList()
  const filtered = currentList.filter(item => item.recipeId !== recipeId)
  saveShoppingList(filtered)
  return filtered
}

// Toggle an item's checked status
export function toggleItemChecked(itemId) {
  const currentList = getShoppingList()
  const updated = currentList.map(item =>
    item.id === itemId ? { ...item, checked: !item.checked } : item
  )
  saveShoppingList(updated)
  return updated
}

// Clear entire shopping list
export function clearShoppingList() {
  saveShoppingList([])
}

// Clear only checked items
export function clearCheckedItems() {
  const currentList = getShoppingList()
  const unchecked = currentList.filter(item => !item.checked)
  saveShoppingList(unchecked)
  return unchecked
}

// Check if a recipe is already in the list
export function isRecipeInList(recipeId) {
  const currentList = getShoppingList()
  return currentList.some(item => item.recipeId === recipeId)
}

// Get list of recipe IDs currently in shopping list
export function getRecipeIdsInList() {
  const currentList = getShoppingList()
  return [...new Set(currentList.map(item => item.recipeId))]
}

// Merge duplicate ingredients across recipes
export function getMergedShoppingList() {
  const currentList = getShoppingList()
  const merged = {}

  currentList.forEach(item => {
    const key = item.ingredient.name.toLowerCase().trim()

    if (merged[key]) {
      // Add to existing - track multiple recipes
      merged[key].recipes.push({
        id: item.recipeId,
        name: item.recipeName,
        amount: item.ingredient.amount,
        unit: item.ingredient.unit
      })
      merged[key].itemIds.push(item.id)
      // Mark unchecked if any instance is unchecked
      if (!item.checked) {
        merged[key].checked = false
      }
    } else {
      merged[key] = {
        name: item.ingredient.name,
        category: item.category,
        checked: item.checked,
        itemIds: [item.id],
        recipes: [{
          id: item.recipeId,
          name: item.recipeName,
          amount: item.ingredient.amount,
          unit: item.ingredient.unit
        }]
      }
    }
  })

  return Object.values(merged)
}

// Toggle all items with matching IDs (for merged view)
export function toggleMergedItems(itemIds) {
  const currentList = getShoppingList()
  // Determine new checked state (if any are unchecked, check all; otherwise uncheck all)
  const anyUnchecked = currentList.some(item => itemIds.includes(item.id) && !item.checked)

  const updated = currentList.map(item =>
    itemIds.includes(item.id) ? { ...item, checked: anyUnchecked } : item
  )
  saveShoppingList(updated)
  return updated
}

// Add a standalone item (not from a recipe) to the shopping list
export function addStandaloneItem(name, category) {
  const currentList = getShoppingList()
  const timestamp = Date.now()

  const newItem = {
    id: `standalone-${timestamp}`,
    recipeId: null,
    recipeName: 'Added manually',
    ingredient: {
      name: name,
      amount: '',
      unit: ''
    },
    category: category || categorizeIngredient(name),
    checked: false,
    addedAt: new Date().toISOString()
  }

  const updatedList = [...currentList, newItem]
  saveShoppingList(updatedList)
  return updatedList
}

// Update an item's amount and unit
export function updateItemAmount(itemId, amount, unit) {
  const currentList = getShoppingList()
  const updated = currentList.map(item =>
    item.id === itemId
      ? { ...item, ingredient: { ...item.ingredient, amount, unit } }
      : item
  )
  saveShoppingList(updated)
  return updated
}
