import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'

export default function AppLayout() {
  const location = useLocation()

  return (
    <div className="min-h-svh bg-background">
      <Navbar />

      <main>
        <div className="min-h-svh px-4 pb-10 pt-20 sm:px-6 lg:px-8">
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
