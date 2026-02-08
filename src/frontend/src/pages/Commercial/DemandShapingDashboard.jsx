/**
 * DemandShapingDashboard — Analytics for demand shaping program.
 *
 * Route: /commercial/demand-shaping
 *
 * Shows suggestion acceptance rates, savings generated,
 * peak-reduction metrics, and breakdown by suggestion type.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Typography, Paper, Grid, Card, CardContent, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, LinearProgress, Stack, Divider, Tooltip,
} from '@mui/material'
import {
  TrendingDown, CalendarMonth, LocationOn, Savings, NightsStay, Merge,
  Lightbulb, CheckCircle, Cancel, AttachMoney, ShowChart,
} from '@mui/icons-material'

import {
  getDemandShapingAnalytics,
  SUGGESTION_TYPE,
  SUGGESTION_LABELS,
  formatSavings,
  suggestionColor,
} from '../../services/demandShapingApi'

// ─── TYPE ICONS ──────────────────────────────────────────────────────────────

const TYPE_ICONS = {
  [SUGGESTION_TYPE.ALT_DATE]:    <CalendarMonth fontSize="small" />,
  [SUGGESTION_TYPE.ALT_BRANCH]:  <LocationOn fontSize="small" />,
  [SUGGESTION_TYPE.NON_RUSH]:    <Savings fontSize="small" />,
  [SUGGESTION_TYPE.CONSOLIDATE]: <Merge fontSize="small" />,
  [SUGGESTION_TYPE.OFF_PEAK]:    <NightsStay fontSize="small" />,
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function DemandShapingDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getDemandShapingAnalytics({ period: 'LAST_30' })
      setAnalytics(data)
    } catch (err) {
      console.error('Failed to load demand shaping analytics', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading && !analytics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={56} />
      </Box>
    )
  }

  if (!analytics) return null

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
            <TrendingDown />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Demand Shaping Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Reduce peaks without saying "no" — last 30 days
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* ─── KPI CARDS ──────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: 4, borderColor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Lightbulb color="primary" fontSize="small" />
                <Typography variant="caption" fontWeight={600} color="text.secondary">Suggestions Shown</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>{analytics.totalSuggestions}</Typography>
              <Typography variant="caption" color="text.secondary">across all order channels</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: 4, borderColor: 'success.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle color="success" fontSize="small" />
                <Typography variant="caption" fontWeight={600} color="text.secondary">Accepted</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>{analytics.accepted}</Typography>
              <Chip size="small" label={`${analytics.acceptancePct}% acceptance`} color="success" sx={{ mt: 0.5, fontWeight: 600, height: 22 }} />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: 4, borderColor: 'warning.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AttachMoney color="warning" fontSize="small" />
                <Typography variant="caption" fontWeight={600} color="text.secondary">Savings Generated</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>{formatSavings(analytics.totalSavingsAccepted)}</Typography>
              <Typography variant="caption" color="text.secondary">
                of {formatSavings(analytics.totalSavingsOffered)} offered
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderTop: 4, borderColor: 'info.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ShowChart color="info" fontSize="small" />
                <Typography variant="caption" fontWeight={600} color="text.secondary">Peak Reduction</Typography>
              </Box>
              <Typography variant="h4" fontWeight={700}>{analytics.peakReductionPct}%</Typography>
              <Typography variant="caption" color="text.secondary">peak load shifted to off-peak</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ─── BY TYPE BREAKDOWN ──────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          Performance by Suggestion Type
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Shown</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Accepted</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Rate</TableCell>
                <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Acceptance</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Savings</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {analytics.byType.map(row => (
                <TableRow key={row.type} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 28, height: 28,
                          bgcolor: `${suggestionColor(row.type)}.light`,
                          color: `${suggestionColor(row.type)}.dark`,
                        }}
                      >
                        {TYPE_ICONS[row.type]}
                      </Avatar>
                      <Typography variant="body2" fontWeight={500}>
                        {SUGGESTION_LABELS[row.type]}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{row.shown}</TableCell>
                  <TableCell align="center">{row.accepted}</TableCell>
                  <TableCell align="center">
                    <Chip
                      size="small"
                      label={`${row.pct}%`}
                      color={row.pct >= 35 ? 'success' : row.pct >= 20 ? 'warning' : 'default'}
                      sx={{ fontWeight: 600, height: 22 }}
                    />
                  </TableCell>
                  <TableCell>
                    <LinearProgress
                      variant="determinate"
                      value={row.pct}
                      sx={{
                        height: 10, borderRadius: 5,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 5,
                          bgcolor: row.pct >= 35 ? 'success.main' : row.pct >= 20 ? 'warning.main' : 'grey.400',
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatSavings(row.savings)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* ─── WEEKLY TREND ───────────────────────────────────────── */}
      {analytics.weeklyTrend && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Weekly Trend
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Week</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Shown</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Accepted</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Rate</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Acceptance</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Savings</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.weeklyTrend.map(row => {
                  const rate = row.shown > 0 ? Math.round(row.accepted / row.shown * 100) : 0
                  return (
                    <TableRow key={row.week} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{row.week}</TableCell>
                      <TableCell align="center">{row.shown}</TableCell>
                      <TableCell align="center">{row.accepted}</TableCell>
                      <TableCell align="center">{rate}%</TableCell>
                      <TableCell>
                        <LinearProgress
                          variant="determinate"
                          value={rate}
                          sx={{
                            height: 8, borderRadius: 4,
                            bgcolor: 'grey.200',
                            '& .MuiLinearProgress-bar': { borderRadius: 4, bgcolor: 'success.main' },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {formatSavings(row.savings)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* ─── FOOTER ─────────────────────────────────────────────── */}
      <Box sx={{ textAlign: 'center', pt: 2, pb: 4 }}>
        <Typography variant="caption" color="text.secondary">
          Demand Shaping Dashboard • Using mock data • {new Date().toLocaleTimeString()}
        </Typography>
      </Box>
    </Box>
  )
}
