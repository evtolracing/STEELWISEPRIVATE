import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Package, FileText, Truck, ClipboardCheck, 
  Search, Settings, Box, Factory, AlertTriangle
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Coils', href: '/coils', icon: Box },
  { name: 'Orders', href: '/orders', icon: FileText },
  { name: 'Work Orders', href: '/work-orders', icon: Factory },
  { name: 'Shipments', href: '/shipments', icon: Truck },
  { name: 'Quality Holds', href: '/quality', icon: AlertTriangle },
  { name: 'Traceability', href: '/traceability', icon: Search },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-steel-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-industrial-orange">⬡</span>
            SteelWise
          </h1>
          <p className="text-steel-400 text-sm mt-1">ERP Platform</p>
        </div>
        
        <nav className="flex-1 px-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive 
                    ? 'bg-steel-800 text-white' 
                    : 'text-steel-300 hover:bg-steel-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-steel-800">
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 text-steel-300 hover:text-white">
            <Settings size={20} />
            Settings
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input 
                type="search" 
                placeholder="Search coils, orders, heats..." 
                className="input-field w-80"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Demo User</span>
              <div className="w-8 h-8 bg-steel-200 rounded-full flex items-center justify-center text-steel-700 font-medium">
                DU
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
