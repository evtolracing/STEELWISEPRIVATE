import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import api from '../api'

export default function QualityHolds() {
  const { data: holds, isLoading } = useQuery({ 
    queryKey: ['qc-holds'], 
    queryFn: () => api.get('/coils?status=ON_HOLD').then(r => r.data) 
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-amber-500" size={28} />
          <h1 className="text-2xl font-bold text-steel-900">Quality Holds</h1>
        </div>
        <button className="btn-primary">+ Create Hold</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-700">Pending Review</p>
          <p className="text-2xl font-bold text-amber-800">{holds?.filter((h: any) => h.status === 'ON_HOLD').length || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Released Today</p>
          <p className="text-2xl font-bold text-green-800">0</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Scrapped</p>
          <p className="text-2xl font-bold text-red-800">0</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <input type="text" placeholder="Search coil #, heat #, reason..." className="input-field flex-1" />
          <select className="input-field w-40">
            <option value="">All Types</option>
            <option value="SURFACE">Surface Defect</option>
            <option value="DIMENSION">Dimension Issue</option>
            <option value="CHEMISTRY">Chemistry Issue</option>
            <option value="MECHANICAL">Mechanical Properties</option>
          </select>
          <button className="btn-secondary">Search</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Coil #</th>
              <th>Heat #</th>
              <th>Grade</th>
              <th>Hold Reason</th>
              <th>Held By</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
            ) : holds?.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">No holds found</td></tr>
            ) : (
              holds?.map((coil: any) => (
                <tr key={coil.id}>
                  <td className="font-medium text-steel-900">{coil.coilNumber}</td>
                  <td>{coil.heat?.heatNumber}</td>
                  <td>{coil.heat?.grade?.name}</td>
                  <td>{coil.holdReason || 'Quality Review'}</td>
                  <td>{coil.heldBy || '-'}</td>
                  <td>{coil.holdDate ? new Date(coil.holdDate).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className="status-badge bg-amber-100 text-amber-800">ON HOLD</span>
                  </td>
                  <td className="flex gap-2">
                    <button className="p-1 text-green-600 hover:bg-green-50 rounded" title="Release">
                      <CheckCircle size={18} />
                    </button>
                    <button className="p-1 text-red-600 hover:bg-red-50 rounded" title="Scrap">
                      <XCircle size={18} />
                    </button>
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
