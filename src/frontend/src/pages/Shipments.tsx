import { useQuery } from '@tanstack/react-query'
import { getShipments } from '../api'

export default function Shipments() {
  const { data: shipments, isLoading } = useQuery({ queryKey: ['shipments'], queryFn: () => getShipments() })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-steel-900">Shipments</h1>
        <button className="btn-primary">+ New Shipment</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <input type="text" placeholder="Search shipment #, order #..." className="input-field flex-1" />
          <select className="input-field w-40">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="LOADING">Loading</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
          </select>
          <button className="btn-secondary">Search</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Shipment #</th>
              <th>Order #</th>
              <th>Customer</th>
              <th>Carrier</th>
              <th>Weight</th>
              <th>Ship Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
            ) : shipments?.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">No shipments found</td></tr>
            ) : (
              shipments?.map((ship: any) => (
                <tr key={ship.id} className="cursor-pointer">
                  <td className="font-medium text-steel-900">{ship.shipmentNumber}</td>
                  <td>{ship.order?.orderNumber}</td>
                  <td>{ship.order?.buyer?.name || '-'}</td>
                  <td>{ship.carrierName || '-'}</td>
                  <td>{Number(ship.totalWeightLb || 0).toLocaleString()} lbs</td>
                  <td>{ship.shippedAt ? new Date(ship.shippedAt).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`status-badge ${
                      ship.status === 'DELIVERED' ? 'status-complete' :
                      ship.status === 'IN_TRANSIT' ? 'status-allocated' :
                      ship.status === 'LOADING' ? 'status-pending' : 'bg-gray-100 text-gray-700'
                    }`}>{ship.status}</span>
                  </td>
                  <td>
                    {ship.status === 'PENDING' && <button className="text-sm text-blue-600">Dispatch</button>}
                    {ship.status === 'IN_TRANSIT' && <button className="text-sm text-green-600">Confirm Delivery</button>}
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
