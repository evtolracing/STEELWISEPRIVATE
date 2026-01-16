import { useQuery } from '@tanstack/react-query'
import { getWorkOrders } from '../api'

export default function WorkOrders() {
  const { data: workOrders, isLoading } = useQuery({ queryKey: ['work-orders'], queryFn: () => getWorkOrders() })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-steel-900">Work Orders</h1>
        <button className="btn-primary">+ New Work Order</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <input type="text" placeholder="Search WO #, coil #..." className="input-field flex-1" />
          <select className="input-field w-40">
            <option value="">All Types</option>
            <option value="SLIT">Slitting</option>
            <option value="CTL">Cut-to-Length</option>
            <option value="BLANK">Blanking</option>
          </select>
          <select className="input-field w-40">
            <option value="">All Status</option>
            <option value="READY">Ready</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETE">Complete</option>
          </select>
          <button className="btn-secondary">Search</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>WO #</th>
              <th>Type</th>
              <th>Source Coil</th>
              <th>Grade</th>
              <th>Input Weight</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
            ) : workOrders?.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">No work orders found</td></tr>
            ) : (
              workOrders?.map((wo: any) => (
                <tr key={wo.id} className="cursor-pointer">
                  <td className="font-medium text-steel-900">{wo.woNumber}</td>
                  <td>{wo.woType}</td>
                  <td>{wo.sourceCoil?.coilNumber}</td>
                  <td>{wo.sourceCoil?.grade?.code}</td>
                  <td>{Number(wo.inputWeightLb || wo.sourceCoil?.netWeightLb || 0).toLocaleString()} lbs</td>
                  <td>
                    <span className={`inline-block w-3 h-3 rounded-full ${
                      wo.priority <= 1 ? 'bg-red-500' :
                      wo.priority <= 2 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></span>
                  </td>
                  <td>
                    <span className={`status-badge ${
                      wo.status === 'COMPLETE' ? 'status-complete' :
                      wo.status === 'IN_PROGRESS' ? 'status-allocated' :
                      wo.status === 'READY' ? 'status-available' : 'status-pending'
                    }`}>{wo.status}</span>
                  </td>
                  <td>
                    {wo.status === 'READY' && <button className="text-sm text-green-600 hover:text-green-800">Start</button>}
                    {wo.status === 'IN_PROGRESS' && <button className="text-sm text-blue-600 hover:text-blue-800">Complete</button>}
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
