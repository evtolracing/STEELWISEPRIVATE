import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Custom hook for API queries with React Query
 * Provides standardized query patterns for the application
 */
export function useApiQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes default
    retry: 1,
    ...options,
  })
}

/**
 * Custom hook for API mutations with React Query
 * Provides standardized mutation patterns with cache invalidation
 */
export function useApiMutation(mutationFn, options = {}) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables, context) => {
      // Invalidate specified query keys on success
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
        })
      }
      
      // Call custom onSuccess if provided
      options.onSuccess?.(data, variables, context)
    },
    onError: (error, variables, context) => {
      console.error('Mutation error:', error)
      options.onError?.(error, variables, context)
    },
    ...options,
  })
}

/**
 * Hook for paginated list queries
 */
export function usePaginatedQuery(queryKey, queryFn, { page = 1, limit = 20, ...options } = {}) {
  return useApiQuery(
    [...(Array.isArray(queryKey) ? queryKey : [queryKey]), { page, limit }],
    () => queryFn({ page, limit }),
    {
      keepPreviousData: true,
      ...options,
    }
  )
}

/**
 * Hook for infinite scroll queries
 */
export function useInfiniteApiQuery(queryKey, queryFn, options = {}) {
  return useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: ({ pageParam = 1 }) => queryFn({ page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    ...options,
  })
}

/**
 * Hook to prefetch data
 */
export function usePrefetch() {
  const queryClient = useQueryClient()
  
  return (queryKey, queryFn) => {
    queryClient.prefetchQuery({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
      queryFn,
      staleTime: 1000 * 60 * 5,
    })
  }
}

/**
 * Hook to invalidate queries programmatically
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient()
  
  return (queryKeys) => {
    const keys = Array.isArray(queryKeys) ? queryKeys : [queryKeys]
    keys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: Array.isArray(key) ? key : [key] })
    })
  }
}

export default useApiQuery
