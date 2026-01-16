import { useQuery } from '@tanstack/react-query'
import { getOrders } from '../api'

export default function Orders() {
  const { data: orders, isLoading } = useQuery({ queryKey: ['orders'], queryFn: () => getOrders() })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-steel-900">Orders</h1>
        <div className="flex gap-2">
          <button className="btn-secondary">+ New Quote</button>
          <button className="btn-primary">+ New Order</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <input type="text" placeholder="Search order #, customer..." className="input-field flex-1" />
          <select className="input-field w-40">
            <option value="">All Types</option>
            <option value="SO">Sales Orders</option>
            <option value="PO">Purchase Orders</option>
            <option value="QUOTE">Quotes</option>
          </select>
          <select className="input-field w-40">
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PARTIAL">Partial</option>
            <option value="COMPLETE">Complete</option>
          </select>
          <button className="btn-secondary">Search</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Type</th>
              <th>Customer/Vendor</th>
              <th>Order Date</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
            ) : orders?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No orders found</td></tr>
            ) : (
              orders?.map((order: any) => (
                <tr key={order.id} className="cursor-pointer">
                  <td className="font-medium text-steel-900">{order.orderNumber}</td>
                  <td>
                    <span className={`status-badge ${
                      order.orderType === 'SO' ? 'bg-green-100 text-green-800' :
                      order.orderType === 'PO' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>{order.orderType}</span>
                  </td>
                  <td>{order.buyer?.name || order.seller?.name || '-'}</td>
                  <td>{new Date(order.orderDate).toLocaleDateString()}</td>
                  <td>${Number(order.totalAmount || 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span>
                  </td>
                  <td>
                    <button className="text-sm text-steel-600 hover:text-steel-900">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
