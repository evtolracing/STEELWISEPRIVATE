/**
 * Tells a manager when history is old enough to archive. The period is five years unless the
 * company changes it. It only warns: nothing is removed. People who may not read the report
 * (the server answers 403) see nothing.
 */
import { useEffect, useState } from 'react'
import { Alert, AlertTitle } from '@mui/material'
import client from '../../api/client'

export default function RetentionNotice({ sx }) {
  const [report, setReport] = useState(null)
  useEffect(() => {
    let active = true
    client.get('/admin/retention').then((r) => { if (active) setReport(r.data) }).catch(() => {})
    return () => { active = false }
  }, [])
  if (!report || report.level === 'OK' || !report.warning) return null
  const old = (report.records || []).filter((r) => r.pastPeriod > 0 || r.withinSixMonths > 0)
  return (
    <Alert severity={report.level === 'ARCHIVE' ? 'warning' : 'info'} sx={{ mb: 2, ...sx }} role="status">
      <AlertTitle>{report.level === 'ARCHIVE' ? `History older than ${report.years} years` : `History close to ${report.years} years old`}</AlertTitle>
      {report.warning}
      {old.length > 0 && ` ${old.map((r) => `${r.record}: ${(r.pastPeriod || r.withinSixMonths).toLocaleString()}`).join('. ')}.`}
    </Alert>
  )
}
