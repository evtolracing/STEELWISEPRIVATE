import { useQuery } from '@tanstack/react-query'
import { getDashboard } from '../api'
import { Package, FileText, AlertTriangle, Truck, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard })

  if (isLoading) return <div className="text-center py-12">Loading...</div>

  const inventory = data?.inventory || {}
  const orders = data?.orders?.byStatus || {}
  const recentOrders = data?.recentOrders || []
  const qcHolds = data?.qcHolds || []

  return (
    <div>
      <h1 className="text-2xl font-bold text-steel-900 mb-6">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Inventory</p>
              <p className="text-2xl font-bold text-steel-900">
                {Number(inventory.totalOnHand || 0).toLocaleString()} lbs
              </p>
            </div>
            <Package className="text-steel-400" size={32} />
          </div>
          <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <TrendingUp size={16} /> Available: {Number(inventory.available || 0).toLocaleString()} lbs
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Allocated</p>
              <p className="text-2xl font-bold text-blue-600">
                {Number(inventory.allocated || 0).toLocaleString()} lbs
              </p>
            </div>
            <FileText className="text-blue-400" size={32} />
          </div>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">On Hold</p>
              <p className="text-2xl font-bold text-red-600">
                {Number(inventory.onHold || 0).toLocaleString()} lbs
              </p>
            </div>
            <AlertTriangle className="text-red-400" size={32} />
          </div>
          <p className="text-sm text-gray-500 mt-2">{qcHolds.length} active holds</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Orders</p>
              <p className="text-2xl font-bold text-steel-900">
                {(orders.CONFIRMED || 0) + (orders.PENDING || 0) + (orders.PARTIAL || 0)}
              </p>
            </div>
            <Truck className="text-steel-400" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-steel-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-500 py-8">No orders yet</td></tr>
                ) : (
                  recentOrders.map((order: any) => (
                    <tr key={order.id}>
                      <td className="font-medium">{order.orderNumber}</td>
                      <td>{order.buyer?.name || '-'}</td>
                      <td>
                        <span className={`status-badge status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* QC Holds */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-steel-900">Active QC Holds</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coil #</th>
                  <th>Hold Type</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {qcHolds.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-500 py-8">No active holds</td></tr>
                ) : (
                  qcHolds.map((hold: any) => (
                    <tr key={hold.id}>
                      <td className="font-medium">{hold.coil?.coilNumber}</td>
                      <td>
                        <span className="status-badge status-hold">{hold.holdType}</span>
                      </td>
                      <td className="text-sm text-gray-600">{hold.holdReason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
