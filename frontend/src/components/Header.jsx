import { Link, useLocation } from 'react-router-dom'
import ShoppingListBadge from './ShoppingListBadge'

function Header() {
  const location = useLocation()

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🍳</span>
          <h1>Aralynn's Cookbook</h1>
        </Link>
        <nav className="nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            Recipes
          </Link>
          <Link
            to="/shopping-list"
            className={`nav-link nav-link-list ${location.pathname === '/shopping-list' ? 'active' : ''}`}
          >
            <span className="nav-icon">🛒</span>
            <span className="nav-text">List</span>
            <ShoppingListBadge />
          </Link>
          <Link
            to="/add"
            className={`nav-link nav-link-add ${location.pathname === '/add' ? 'active' : ''}`}
          >
            <span className="nav-icon">+</span>
            <span className="nav-text">Add Recipe</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
