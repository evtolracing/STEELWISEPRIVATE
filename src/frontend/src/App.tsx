import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Orders from './pages/Orders'
import Coils from './pages/Coils'
import WorkOrders from './pages/WorkOrders'
import Shipments from './pages/Shipments'
import QualityHolds from './pages/QualityHolds'
import Traceability from './pages/Traceability'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="coils" element={<Coils />} />
          <Route path="orders" element={<Orders />} />
          <Route path="work-orders" element={<WorkOrders />} />
          <Route path="shipments" element={<Shipments />} />
          <Route path="quality" element={<QualityHolds />} />
          <Route path="traceability" element={<Traceability />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
