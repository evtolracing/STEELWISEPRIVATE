import { useCallback, useEffect, useState } from 'react'
import { getProductionOverview } from '../../services/productionApi'
import { useAuth } from '../../hooks/useAuth'

/** Loads the production overview for the branch and division picked; starts at the top bar's branch. */
export function useProductionOverview() {
  const { branchId } = useAuth()
  const [filters, setFilters] = useState(() => ({ locationId: branchId || '', division: '' }))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await getProductionOverview(filters))
      setError(null)
    } catch (err) {
      // Nothing made up when the server fails: the screen says so and shows no counts.
      setData(null)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { load() }, [load])
  return { data, loading, error, filters, setFilters, reload: load }
}
