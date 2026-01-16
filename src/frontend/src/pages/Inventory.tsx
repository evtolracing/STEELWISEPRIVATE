import { useQuery } from '@tanstack/react-query'
import { getInventory, getInventorySummary } from '../api'

export default function Inventory() {
  const { data: inventory, isLoading } = useQuery({ queryKey: ['inventory'], queryFn: () => getInventory() })
  const { data: summary } = useQuery({ queryKey: ['inventory-summary'], queryFn: getInventorySummary })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-steel-900">Inventory</h1>
        <button className="btn-primary">+ Receive Material</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="text-sm text-gray-500">Total On Hand</p>
          <p className="text-xl font-bold">{Number(summary?.totalOnHand || 0).toLocaleString()} lbs</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-xl font-bold text-green-600">{Number(summary?.totalAvailable || 0).toLocaleString()} lbs</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-gray-500">Allocated</p>
          <p className="text-xl font-bold text-blue-600">{Number(summary?.totalAllocated || 0).toLocaleString()} lbs</p>
        </div>
        <div className="metric-card">
          <p className="text-sm text-gray-500">On Hold</p>
          <p className="text-xl font-bold text-red-600">{Number(summary?.totalOnHold || 0).toLocaleString()} lbs</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <input type="text" placeholder="Search coil #, heat #..." className="input-field flex-1" />
          <select className="input-field w-40">
            <option value="">All Locations</option>
          </select>
          <select className="input-field w-40">
            <option value="">All Grades</option>
          </select>
          <button className="btn-secondary">Search</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Coil #</th>
              <th>Heat #</th>
              <th>Grade</th>
              <th>Dimensions</th>
              <th>Weight</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
            ) : inventory?.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No inventory found</td></tr>
            ) : (
              inventory?.map((item: any) => (
                <tr key={item.id} className="cursor-pointer hover:bg-steel-50">
                  <td className="font-medium text-steel-900">{item.coil?.coilNumber}</td>
                  <td>{item.coil?.heat?.heatNumber}</td>
                  <td>{item.coil?.grade?.code}</td>
                  <td>{item.coil?.thicknessIn}" x {item.coil?.widthIn}"</td>
                  <td>{Number(item.qtyOnHand).toLocaleString()} lbs</td>
                  <td>{item.location?.code}</td>
                  <td>
                    <span className={`status-badge ${
                      item.qtyOnHold > 0 ? 'status-hold' :
                      item.qtyAllocated > 0 ? 'status-allocated' : 'status-available'
                    }`}>
                      {item.qtyOnHold > 0 ? 'Hold' : item.qtyAllocated > 0 ? 'Allocated' : 'Available'}
                    </span>
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
