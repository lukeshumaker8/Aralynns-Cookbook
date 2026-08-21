import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import ChatDock from './components/ChatDock'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import CookModePage from './pages/CookModePage'
import AddRecipePage from './pages/AddRecipePage'
import ShoppingListPage from './pages/ShoppingListPage'

const RECIPE_ROUTE = /^\/recipe\/([^/]+)\/?$/
const COOK_ROUTE = /^\/recipe\/[^/]+\/cook\/?$/

const COOKBOOK_SUGGESTIONS = [
  'What can I make in under 30 minutes?',
  'I have chicken and rice — any ideas?',
  'Create a recipe for chocolate chip cookies',
]

const RECIPE_SUGGESTIONS = [
  'What can I substitute if I am missing something?',
  'How do I make this ahead of time?',
  'What should I serve with this?',
]

function App() {
  const location = useLocation()

  // Cook mode takes over the whole screen and mounts its own chat dock.
  if (COOK_ROUTE.test(location.pathname)) {
    return (
      <Routes>
        <Route path="/recipe/:id/cook" element={<CookModePage />} />
      </Routes>
    )
  }

  const recipeMatch = location.pathname.match(RECIPE_ROUTE)
  const onRecipe = Boolean(recipeMatch)

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipePage />} />
          <Route path="/add" element={<AddRecipePage />} />
          <Route path="/shopping-list" element={<ShoppingListPage />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>© 2024 Aralynn's Cookbook. Made with love</p>
      </footer>

      <ChatDock
        scope={onRecipe ? 'recipe' : 'cookbook'}
        recipeId={recipeMatch?.[1]}
        placeholder={onRecipe ? 'Ask about this recipe...' : 'Ask the cookbook...'}
        suggestions={onRecipe ? RECIPE_SUGGESTIONS : COOKBOOK_SUGGESTIONS}
      />
    </div>
  )
}

export default App
