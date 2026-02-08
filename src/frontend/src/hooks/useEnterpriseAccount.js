/**
 * useEnterpriseAccount.js — Hook for Enterprise Customer Account state.
 *
 * Loads account profile, KPIs, manages branch filter state,
 * and exposes permission checks.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  getAccountProfile,
  getAccountKPIs,
  hasPermission,
  ACCOUNT_PERMISSIONS,
} from '../services/customerAccountApi'

export default function useEnterpriseAccount(accountId) {
  const [account, setAccount] = useState(null)
  const [kpis, setKpis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState('') // '' = all branches

  // ── Load account + KPIs ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [acctRes, kpiRes] = await Promise.all([
        getAccountProfile(accountId || 'acct-enterprise-001'),
        getAccountKPIs(accountId || 'acct-enterprise-001'),
      ])
      setAccount(acctRes.data)
      setKpis(kpiRes.data)
    } catch (e) {
      setError(e.message || 'Failed to load account')
    } finally {
      setLoading(false)
    }
  }, [accountId])

  useEffect(() => { load() }, [load])

  // ── Permission helpers ───────────────────────────────────────────────
  const role = account?.userRole || 'VIEWER'

  const can = useCallback((permission) => {
    return hasPermission(role, permission)
  }, [role])

  const canExport       = useMemo(() => can(ACCOUNT_PERMISSIONS.EXPORT_DATA), [can])
  const canViewAll      = useMemo(() => can(ACCOUNT_PERMISSIONS.VIEW_ALL_BRANCHES), [can])
  const canManageUsers  = useMemo(() => can(ACCOUNT_PERMISSIONS.MANAGE_USERS), [can])
  const canDownloadDocs = useMemo(() => can(ACCOUNT_PERMISSIONS.DOWNLOAD_DOCUMENTS), [can])

  // ── Branch helpers ───────────────────────────────────────────────────
  const branches = account?.branches || []

  const branchFilter = useMemo(() => {
    if (!selectedBranch) return {}
    return { branchId: selectedBranch }
  }, [selectedBranch])

  return {
    account,
    kpis,
    loading,
    error,
    reload: load,
    // Branch
    branches,
    selectedBranch,
    setSelectedBranch,
    branchFilter,
    // Permissions
    role,
    can,
    canExport,
    canViewAll,
    canManageUsers,
    canDownloadDocs,
  }
}
