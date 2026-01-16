import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, GitBranch, Package, Truck, FileCheck } from 'lucide-react'
import api from '../api'

export default function Traceability() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState<'heat' | 'coil'>('heat')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm) return
    setIsSearching(true)
    try {
      if (searchType === 'heat') {
        const res = await api.get(`/heats/${searchTerm}/trace`)
        setSearchResult({ type: 'heat', data: res.data })
      } else {
        const res = await api.get(`/coils/${searchTerm}`)
        setSearchResult({ type: 'coil', data: res.data })
      }
    } catch (e) {
      setSearchResult({ type: 'error', message: 'Not found' })
    }
    setIsSearching(false)
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <GitBranch className="text-steel-600" size={28} />
        <h1 className="text-2xl font-bold text-steel-900">Traceability</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Search Material Genealogy</h2>
        <div className="flex gap-4">
          <select 
            className="input-field w-32"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'heat' | 'coil')}
          >
            <option value="heat">Heat #</option>
            <option value="coil">Coil #</option>
          </select>
          <input 
            type="text" 
            placeholder={`Enter ${searchType} number...`}
            className="input-field flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary flex items-center gap-2" onClick={handleSearch} disabled={isSearching}>
            <Search size={18} />
            {isSearching ? 'Searching...' : 'Trace'}
          </button>
        </div>
      </div>

      {searchResult?.type === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {searchResult.message}
        </div>
      )}

      {searchResult?.type === 'heat' && searchResult.data && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="text-steel-600" size={20} />
              Heat Information
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Heat Number</p>
                <p className="font-medium">{searchResult.data.heatNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-medium">{searchResult.data.grade?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-medium">{searchResult.data.supplier?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pour Date</p>
                <p className="font-medium">{searchResult.data.pourDate ? new Date(searchResult.data.pourDate).toLocaleDateString() : '-'}</p>
              </div>
            </div>
            
            {searchResult.data.chemistry && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Chemistry</h4>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-sm">
                  {Object.entries(searchResult.data.chemistry as Record<string, any>).map(([key, val]) => (
                    <div key={key} className="bg-gray-50 p-2 rounded">
                      <span className="text-gray-500">{key}:</span> <span className="font-medium">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GitBranch className="text-steel-600" size={20} />
              Coil Genealogy ({searchResult.data.coils?.length || 0} coils)
            </h3>
            <div className="space-y-2">
              {searchResult.data.coils?.map((coil: any) => (
                <div key={coil.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">{coil.coilNumber}</span>
                    <span className="text-sm text-gray-500">{coil.widthIn}" x {coil.gaugeIn}"</span>
                    <span className="text-sm text-gray-500">{Number(coil.weightLb).toLocaleString()} lbs</span>
                  </div>
                  <span className={`status-badge ${
                    coil.status === 'AVAILABLE' ? 'status-complete' :
                    coil.status === 'ALLOCATED' ? 'status-allocated' :
                    coil.status === 'ON_HOLD' ? 'status-pending' : 'bg-gray-100 text-gray-700'
                  }`}>{coil.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileCheck className="text-steel-600" size={20} />
              Test Results
            </h3>
            {searchResult.data.testResults?.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Test Type</th>
                    <th>Result</th>
                    <th>Spec Min</th>
                    <th>Spec Max</th>
                    <th>Pass/Fail</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResult.data.testResults.map((test: any) => (
                    <tr key={test.id}>
                      <td>{test.testType}</td>
                      <td className="font-medium">{test.resultValue}</td>
                      <td>{test.specMin || '-'}</td>
                      <td>{test.specMax || '-'}</td>
                      <td>
                        <span className={`status-badge ${test.pass ? 'status-complete' : 'status-pending'}`}>
                          {test.pass ? 'PASS' : 'FAIL'}
                        </span>
                      </td>
                      <td>{new Date(test.testedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-500 text-center py-4">No test results found</p>
            )}
          </div>
        </div>
      )}

      {!searchResult && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <GitBranch className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Material Traceability</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Search by heat number or coil number to view complete material genealogy, 
            including chemistry, mechanical properties, processing history, and downstream allocations.
          </p>
        </div>
      )}
    </div>
  )
}
