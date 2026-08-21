import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'
import CookModePage from './pages/CookModePage'
import AddRecipePage from './pages/AddRecipePage'
import ShoppingListPage from './pages/ShoppingListPage'

function App() {
  const location = useLocation()

  // Cook mode takes over the whole screen — no chrome around it.
  const isCookMode = /^\/recipe\/[^/]+\/cook\/?$/.test(location.pathname)

  if (isCookMode) {
    return (
      <Routes>
        <Route path="/recipe/:id/cook" element={<CookModePage />} />
      </Routes>
    )
  }

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
    </div>
  )
}

export default App
