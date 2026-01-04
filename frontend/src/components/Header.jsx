import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <span className="logo-icon">🍳</span>
          <h1>Aralynn's Cookbook</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Recipes</Link>
        </nav>
      </div>
    </header>
  )
}

export default Header
