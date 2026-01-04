import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import RecipePage from './pages/RecipePage'

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/recipe/:id" element={<RecipePage />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>© 2024 Aralynn's Cookbook. Made with ❤️</p>
      </footer>
    </div>
  )
}

export default App
