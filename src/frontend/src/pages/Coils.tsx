import { useQuery } from '@tanstack/react-query'
import { getCoils } from '../api'

export default function Coils() {
  const { data: coils, isLoading } = useQuery({ queryKey: ['coils'], queryFn: () => getCoils() })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-steel-900">Coils</h1>
        <button className="btn-primary">+ Add Coil</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4">
          <input type="text" placeholder="Search by coil #, heat #..." className="input-field flex-1" />
          <select className="input-field w-40">
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="HOLD">On Hold</option>
          </select>
          <select className="input-field w-40">
            <option value="">All Grades</option>
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
              <th>Thick x Width</th>
              <th>Net Weight</th>
              <th>Location</th>
              <th>QC Status</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
            ) : coils?.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">No coils found</td></tr>
            ) : (
              coils?.map((coil: any) => (
                <tr key={coil.id} className="cursor-pointer">
                  <td className="font-medium text-steel-900">{coil.coilNumber}</td>
                  <td>{coil.heat?.heatNumber}</td>
                  <td>{coil.grade?.code}</td>
                  <td>{coil.thicknessIn}" x {coil.widthIn}"</td>
                  <td>{Number(coil.netWeightLb).toLocaleString()} lbs</td>
                  <td>{coil.location?.code || '-'}</td>
                  <td>
                    <span className={`status-badge ${
                      coil.qcStatus === 'PASSED' ? 'status-available' :
                      coil.qcStatus === 'FAILED' ? 'status-hold' : 'status-pending'
                    }`}>{coil.qcStatus}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${coil.status.toLowerCase()}`}>{coil.status}</span>
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
