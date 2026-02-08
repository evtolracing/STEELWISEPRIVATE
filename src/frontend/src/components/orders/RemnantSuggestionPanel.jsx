/**
 * RemnantSuggestionPanel.jsx — "Push remnants first" panel for CSR intake.
 *
 * Suggests matching remnants from inventory before cutting new stock.
 * Shows aging, condition, savings vs. list, and one-click line replacement.
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box, Paper, Typography, Button, Chip, Alert, CircularProgress,
  Divider, Tooltip, IconButton, Collapse,
} from '@mui/material'
import {
  Recycling        as RemnantIcon,
  TrendingDown     as SavingsIcon,
  Schedule         as ClockIcon,
  Star             as GradeIcon,
  SwapHoriz        as SwapIcon,
  ExpandMore       as ExpandIcon,
  ExpandLess       as CollapseIcon,
  Lightbulb        as SuggestIcon,
  Info             as InfoIcon,
  CheckCircle      as CheckIcon,
} from '@mui/icons-material'
import { getRemnantSuggestions, getAgingBucket, REMNANT_CONDITION } from '../../services/remnantInventoryApi'

const fmt = (n) => `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/**
 * @param {{
 *   lines: Array,             — current order lines (to detect grade/form/dims)
 *   location: string,         — current order location
 *   onSelectRemnant: (remnant, lineIndex) => void, — callback to replace line with remnant
 * }} props
 */
export default function RemnantSuggestionPanel({ lines = [], location, onSelectRemnant }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const fetchSuggestions = useCallback(async () => {
    // Only suggest for lines with grade/form info
    const eligibleLines = lines.filter(l => l.grade || l.productId)
    if (eligibleLines.length === 0) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      // Get suggestions based on first eligible line (simplification)
      const line = eligibleLines[0]
      const res = await getRemnantSuggestions({
        grade: line.grade || 'A36',
        form: line.form || 'PLATE',
        thickness: line.thickness,
        width: line.width,
        length: line.length,
        location,
      })
      setSuggestions(res.data || [])
    } catch {
      setSuggestions([])
    }
    setLoading(false)
  }, [lines, location])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  const handleSelect = (remnant, lineIdx = 0) => {
    setSelectedIds(prev => new Set([...prev, remnant.id]))
    if (onSelectRemnant) onSelectRemnant(remnant, lineIdx)
  }

  if (lines.length === 0) return null

  const totalSavings = suggestions.reduce((s, r) => s + (r.savingsVsNewCut || 0), 0)

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 2,
        border: suggestions.length > 0 ? '2px solid #2e7d32' : '1px solid',
        borderColor: suggestions.length > 0 ? '#2e7d32' : 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          bgcolor: suggestions.length > 0 ? '#e8f5e9' : 'grey.50',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <SuggestIcon sx={{ color: suggestions.length > 0 ? '#2e7d32' : 'text.secondary' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: suggestions.length > 0 ? '#1b5e20' : 'text.primary' }}>
            Remnant Suggestions
          </Typography>
          {suggestions.length > 0 && (
            <Typography variant="caption" color="success.main" fontWeight={600}>
              {suggestions.length} match{suggestions.length !== 1 ? 'es' : ''} found — save {fmt(totalSavings)}
            </Typography>
          )}
        </Box>
        {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
      </Box>

      <Collapse in={expanded}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : suggestions.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="info" variant="outlined" icon={<InfoIcon />}>
              No matching remnants available. New stock will be used.
            </Alert>
          </Box>
        ) : (
          <Box>
            {/* Top suggestion callout */}
            <Alert severity="success" icon={<RemnantIcon />} sx={{ mx: 1.5, mt: 1.5, mb: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Push remnants first! {suggestions.length} matching piece{suggestions.length !== 1 ? 's' : ''} in stock.
              </Typography>
              <Typography variant="caption">
                Using remnants reduces waste and improves inventory turns.
              </Typography>
            </Alert>

            {/* Suggestion list */}
            {suggestions.map((r, idx) => {
              const bucket = getAgingBucket(r.cutDate)
              const condDef = REMNANT_CONDITION[r.condition]
              const isSelected = selectedIds.has(r.id)

              return (
                <Box key={r.id}>
                  <Box sx={{
                    px: 1.5, py: 1.5,
                    display: 'flex', gap: 1.5, alignItems: 'flex-start',
                    bgcolor: isSelected ? '#e8f5e9' : 'transparent',
                    '&:hover': { bgcolor: isSelected ? '#e8f5e9' : '#fafafa' },
                  }}>
                    {/* Age color bar */}
                    <Box sx={{ width: 4, minHeight: 50, borderRadius: 1, bgcolor: bucket.color, flexShrink: 0 }} />

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {r.name}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5, mb: 0.5 }}>
                        <Chip
                          icon={<ClockIcon />}
                          label={`${r.ageDays}d old`}
                          size="small"
                          sx={{ bgcolor: `${bucket.color}18`, color: bucket.color, fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                        />
                        <Chip
                          label={`Grade ${r.condition}`}
                          size="small"
                          sx={{ bgcolor: `${condDef?.color || '#666'}18`, color: condDef?.color, fontWeight: 600, fontSize: '0.65rem', height: 20 }}
                        />
                        <Chip label={r.locationName} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        {r.thickness}" × {r.width}" × {r.length}" · {r.estimatedWeight} lbs · ${r.pricePerLb}/lb
                      </Typography>

                      {r.savingsVsNewCut > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <SavingsIcon fontSize="small" sx={{ color: '#2e7d32' }} />
                          <Typography variant="caption" color="success.main" fontWeight={700}>
                            Save {fmt(r.savingsVsNewCut)} vs. new cut
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Action */}
                    <Box sx={{ flexShrink: 0 }}>
                      {isSelected ? (
                        <Chip icon={<CheckIcon />} label="Added" size="small" color="success" />
                      ) : (
                        <Tooltip title="Use this remnant instead of cutting new stock">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<SwapIcon />}
                            onClick={() => handleSelect(r)}
                            sx={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                          >
                            Use This
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                  {idx < suggestions.length - 1 && <Divider />}
                </Box>
              )
            })}
          </Box>
        )}
      </Collapse>
    </Paper>
  )
}
