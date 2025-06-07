import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Account from './pages/Account'
import NotFound from './pages/NotFound'

function App() {
  return (
    
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <main className="animate-fadeIn">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/account" element={<Account />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </Router>
 
  )
}

export default App
