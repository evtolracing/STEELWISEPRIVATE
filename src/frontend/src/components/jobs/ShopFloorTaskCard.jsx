import React from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Stack,
  Divider,
  Avatar,
} from '@mui/material'
import {
  PlayArrow as StartIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Warning as IssueIcon,
  Timer as TimerIcon,
  Speed as SpeedIcon,
  Scale as WeightIcon,
  ContentCut as ProcessIcon,
  Person as OperatorIcon,
} from '@mui/icons-material'
import { JOB_STATUS_CONFIG } from '../../constants/jobStatuses'
import { PROCESSING_TYPES } from '../../constants/processingTypes'
import { PRIORITY_LEVELS_CONFIG } from '../../constants/materials'

// Large touch-friendly component for shop floor operators
const ShopFloorTaskCard = ({
  job,
  onStart,
  onPause,
  onComplete,
  onReportIssue,
  onRecordOutput,
  onClick,
  isActive = false,
}) => {
  const statusConfig = JOB_STATUS_CONFIG[job.status] || {}
  const priorityConfig = PRIORITY_LEVELS_CONFIG?.[job.priority] || {}
  const processingType = PROCESSING_TYPES[job.processingType] || job.processingType

  const isHot = job.priority === 'HOT'
  const isRunning = job.status === 'IN_PROCESS'

  const formatElapsedTime = (startTime) => {
    if (!startTime) return '00:00:00'
    const elapsed = Date.now() - new Date(startTime).getTime()
    const hours = Math.floor(elapsed / (1000 * 60 * 60))
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const getProgress = () => {
    if (!job.targetPieces || !job.completedPieces) return 0
    return Math.min((job.completedPieces / job.targetPieces) * 100, 100)
  }

  const formatWeight = (lbs) => {
    if (!lbs) return '—'
    return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        minHeight: 280,
        border: '2px solid',
        borderColor: isActive ? 'primary.main' : isHot ? 'error.main' : 'divider',
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        animation: isHot && !isRunning ? 'pulse 2s infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(211, 47, 47, 0)' },
        },
        transition: 'all 0.2s',
        '&:hover': isActive ? {} : { boxShadow: 4 },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {job.jobNumber || job.id}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {job.customerName}
            </Typography>
          </Box>
          <Stack direction="column" spacing={0.5} alignItems="flex-end">
            <Chip
              label={job.priority}
              sx={{
                backgroundColor: priorityConfig.bgColor || 'grey.100',
                color: priorityConfig.color || 'text.primary',
                fontWeight: 700,
                fontSize: '0.9rem',
                height: 32,
              }}
            />
            <Chip
              label={statusConfig.label || job.status}
              sx={{
                backgroundColor: statusConfig.bgColor || 'grey.200',
                color: statusConfig.color || 'text.primary',
                fontWeight: 600,
              }}
            />
          </Stack>
        </Box>

        {/* Processing Type */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ProcessIcon color="primary" fontSize="large" />
          <Typography variant="h6" fontWeight={600}>
            {processingType}
          </Typography>
        </Box>

        {/* Material Info */}
        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="body1" fontWeight={500}>
            {job.materialDescription || job.material}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {job.dimensions}
          </Typography>
        </Box>

        {/* Key Metrics */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'primary.50', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Target
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {job.targetPieces || '—'}
            </Typography>
            <Typography variant="caption">pieces</Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'success.50', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Complete
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              {job.completedPieces || 0}
            </Typography>
            <Typography variant="caption">pieces</Typography>
          </Box>
          <Box sx={{ flex: 1, textAlign: 'center', p: 1, bgcolor: 'grey.100', borderRadius: 2 }}>
            <WeightIcon fontSize="small" color="action" />
            <Typography variant="h6" fontWeight={600}>
              {formatWeight(job.weight)}
            </Typography>
          </Box>
        </Stack>

        {/* Progress Bar */}
        {isRunning && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" fontWeight={500}>
                Progress
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {getProgress().toFixed(0)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgress()}
              sx={{ height: 12, borderRadius: 6 }}
            />
          </Box>
        )}

        {/* Timer (when running) */}
        {isRunning && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              p: 1.5,
              bgcolor: 'info.50',
              borderRadius: 2,
              mb: 2,
            }}
          >
            <TimerIcon color="info" />
            <Typography variant="h4" fontWeight={700} fontFamily="monospace">
              {formatElapsedTime(job.startedAt)}
            </Typography>
          </Box>
        )}

        {/* Operator */}
        {job.operatorName && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.8rem' }}>
              {job.operatorName.charAt(0)}
            </Avatar>
            <Typography variant="body2">{job.operatorName}</Typography>
          </Box>
        )}
      </CardContent>

      <Divider />

      {/* Actions - Large touch targets */}
      <CardActions sx={{ p: 2, gap: 1, flexWrap: 'wrap' }}>
        {job.status === 'SCHEDULED' && onStart && (
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<StartIcon />}
            onClick={(e) => { e.stopPropagation(); onStart(job); }}
            sx={{
              flex: 1,
              minHeight: 56,
              fontSize: '1.1rem',
              fontWeight: 600,
            }}
          >
            START
          </Button>
        )}

        {isRunning && (
          <>
            {onRecordOutput && (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={(e) => { e.stopPropagation(); onRecordOutput(job); }}
                sx={{
                  flex: 1,
                  minHeight: 56,
                  fontSize: '1rem',
                  fontWeight: 600,
                }}
              >
                RECORD OUTPUT
              </Button>
            )}
            {onPause && (
              <Button
                variant="outlined"
                color="warning"
                size="large"
                startIcon={<PauseIcon />}
                onClick={(e) => { e.stopPropagation(); onPause(job); }}
                sx={{ minHeight: 56 }}
              >
                PAUSE
              </Button>
            )}
            {onComplete && (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<CompleteIcon />}
                onClick={(e) => { e.stopPropagation(); onComplete(job); }}
                sx={{ minHeight: 56 }}
              >
                COMPLETE
              </Button>
            )}
          </>
        )}

        {onReportIssue && (
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<IssueIcon />}
            onClick={(e) => { e.stopPropagation(); onReportIssue(job); }}
            sx={{ minHeight: 56 }}
          >
            ISSUE
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

export default ShopFloorTaskCard
