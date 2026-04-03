import { Dumbbell } from 'lucide-react'

function Header() {
  return (
    <header className="header">
      <div className="brand">
        <Dumbbell size={28} />
        <div>
          <h1>AcademiaFinder</h1>
          <p>Encontre academias com rapidez</p>
        </div>
      </div>
    </header>
  )
}

export default Header