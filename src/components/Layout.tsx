import { Outlet } from 'react-router-dom'
import { SidebarLayoutProvider } from '../context/SidebarLayoutContext'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { SiteSidebar } from './SiteSidebar'

export function Layout() {
  return (
    <SidebarLayoutProvider>
      <div className="flex min-h-screen">
        <SiteSidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </SidebarLayoutProvider>
  )
}
