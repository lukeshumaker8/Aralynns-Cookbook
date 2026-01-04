import { Link, useLocation } from 'react-router-dom'

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
