import React, { useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Stack,
  TextField,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions as MuiDialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade,
  Zoom,
  alpha,
  Collapse,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Warning as WarningIcon,
  DragIndicator as DragIcon,
  Person as PersonIcon,
  ContentCut as ProcessIcon,
  Inventory as InventoryIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Scale as ScaleIcon,
  Straighten as DimensionsIcon,
  Description as NotesIcon,
  Assignment as JobIcon,
  AutoAwesome as AIIcon,
  TipsAndUpdates as SuggestionIcon,
  Speed as SpeedIcon,
  AccessTime as TimeIcon,
  PriorityHigh as PriorityIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Bolt as BoltIcon,
  LocalFireDepartment as FireIcon,
  ArrowUpward as UpIcon,
} from '@mui/icons-material'
import { JOB_STATUS_CONFIG } from '../../constants/jobStatuses'
import { PROCESSING_TYPES } from '../../constants/processingTypes'
import { PRIORITY_LEVELS_CONFIG } from '../../constants/materials'

// Modern gradient backgrounds based on priority
const PRIORITY_GRADIENTS = {
  HOT: 'linear-gradient(135deg, rgba(244,67,54,0.15) 0%, rgba(255,138,128,0.1) 100%)',
  URGENT: 'linear-gradient(135deg, rgba(255,152,0,0.15) 0%, rgba(255,193,7,0.1) 100%)',
  NORMAL: 'linear-gradient(135deg, rgba(33,150,243,0.08) 0%, rgba(100,181,246,0.05) 100%)',
  LOW: 'linear-gradient(135deg, rgba(158,158,158,0.08) 0%, rgba(189,189,189,0.05) 100%)',
}

const PRIORITY_ICONS = {
  HOT: FireIcon,
  URGENT: BoltIcon,
  NORMAL: null,
  LOW: null,
}

const ModernJobCard = ({
  job,
  onStart,
  onPause,
  onComplete,
  onClick,
  onUpdate,
  onAIAssist,
  draggable = true,
  compact = false,
  showActions = true,
  showAIHints = true,
}) => {
  const [editing, setEditing] = useState(false)
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)
  const [editedJob, setEditedJob] = useState({ ...job })
  const [priorityMenu, setPriorityMenu] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const statusConfig = JOB_STATUS_CONFIG[job.status] || {}
  const priorityConfig = PRIORITY_LEVELS_CONFIG?.[job.priority] || {}
  const processingType = PROCESSING_TYPES[job.processingType] || job.processingType
  const PriorityIconComponent = PRIORITY_ICONS[job.priority]

  const formatWeight = (lbs) => {
    if (!lbs) return '—'
    return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`
  }

  const formatDate = (date) => {
    if (!date) return '—'
    const d = new Date(date)
    const now = new Date()
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays <= 7) return `${diffDays}d left`
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getDueDateColor = () => {
    if (!job.dueDate) return 'text.secondary'
    const d = new Date(job.dueDate)
    const now = new Date()
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) return 'error.main'
    if (diffDays === 0) return 'warning.main'
    if (diffDays <= 2) return 'warning.dark'
    return 'text.secondary'
  }

  const getProgressValue = () => {
    if (!job.targetPieces || !job.completedPieces) return 0
    return (job.completedPieces / job.targetPieces) * 100
  }

  const isHotJob = job.priority === 'HOT'
  const isUrgent = job.priority === 'URGENT'
  const isOverdue = job.dueDate && new Date(job.dueDate) < new Date()

  // AI-generated hints based on job data
  const getAIHints = useCallback(() => {
    const hints = []
    
    if (isOverdue) {
      hints.push({ type: 'warning', text: 'Overdue - prioritize this job', icon: WarningIcon })
    }
    if (job.status === 'SCHEDULED' && isHotJob) {
      hints.push({ type: 'action', text: 'Hot job ready to start', icon: FireIcon })
    }
    if (job.status === 'IN_PROCESS' && getProgressValue() > 80) {
      hints.push({ type: 'success', text: 'Almost complete - prepare QC', icon: CompleteIcon })
    }
    if (job.weight > 30000) {
      hints.push({ type: 'info', text: 'Heavy load - verify crane capacity', icon: ScaleIcon })
    }
    
    return hints
  }, [job, isHotJob, isOverdue])

  const hints = showAIHints ? getAIHints() : []

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('jobId', job.id)
    e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1'
  }

  const handleSave = async () => {
    if (onUpdate) {
      await onUpdate(job.id, editedJob)
    }
    setEditing(false)
  }

  const handleCancel = () => {
    setEditedJob({ ...job })
    setEditing(false)
  }

  const handleAskAI = (e) => {
    e.stopPropagation()
    if (onAIAssist) {
      onAIAssist(job)
    }
  }

  return (
    <>
      <Card
        draggable={draggable && !editing}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          if (!editing && onClick) onClick(e)
        }}
        sx={{
          cursor: draggable && !editing ? 'grab' : onClick && !editing ? 'pointer' : 'default',
          background: PRIORITY_GRADIENTS[job.priority] || PRIORITY_GRADIENTS.NORMAL,
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: isHotJob 
            ? alpha('#f44336', 0.4) 
            : isUrgent 
              ? alpha('#ff9800', 0.4) 
              : alpha('#e0e0e0', 0.8),
          borderRadius: 3,
          overflow: 'visible',
          position: 'relative',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isHovered ? 'translateY(-2px)' : 'none',
          boxShadow: isHovered 
            ? `0 12px 40px ${alpha(statusConfig.color || '#1976d2', 0.2)}` 
            : '0 2px 8px rgba(0,0,0,0.08)',
          animation: isHotJob ? 'hotPulse 2s infinite' : 'none',
          '@keyframes hotPulse': {
            '0%, 100%': { 
              boxShadow: `0 0 0 0 ${alpha('#f44336', 0.4)}`,
            },
            '50%': { 
              boxShadow: `0 0 0 8px ${alpha('#f44336', 0)}`,
            },
          },
          '&:active': {
            cursor: draggable && !editing ? 'grabbing' : 'default',
            transform: 'scale(0.98)',
          },
          '&::before': isHotJob || isUrgent ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: '12px 12px 0 0',
            background: isHotJob 
              ? 'linear-gradient(90deg, #f44336, #ff5722, #f44336)'
              : 'linear-gradient(90deg, #ff9800, #ffc107, #ff9800)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite linear',
          } : {},
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '200% 0' },
            '100%': { backgroundPosition: '-200% 0' },
          },
          ...(compact && { minHeight: 80 }),
        }}
      >
        <CardContent sx={{ pb: compact ? 1 : 1.5, pt: compact ? 1.5 : 2, px: 2 }}>
          {/* Header Row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1.5 }}>
            {draggable && (
              <Fade in={isHovered}>
                <DragIcon
                  sx={{ 
                    color: 'text.disabled', 
                    cursor: 'grab', 
                    mt: 0.5,
                    transition: 'color 0.2s',
                    '&:hover': { color: 'primary.main' }
                  }}
                  fontSize="small"
                />
              </Fade>
            )}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <TextField
                  size="small"
                  value={editedJob.instructions || ''}
                  onChange={(e) => setEditedJob({ ...editedJob, instructions: e.target.value })}
                  placeholder="Job instructions"
                  fullWidth
                  multiline
                  sx={{ mb: 0.5 }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography
                      variant={compact ? 'body2' : 'subtitle1'}
                      fontWeight={700}
                      sx={{ 
                        color: 'text.primary',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {job.jobNumber || job.id}
                    </Typography>
                    {PriorityIconComponent && (
                      <PriorityIconComponent 
                        sx={{ 
                          fontSize: 16, 
                          color: isHotJob ? 'error.main' : 'warning.main',
                          animation: isHotJob ? 'bounce 0.5s infinite alternate' : 'none',
                          '@keyframes bounce': {
                            '0%': { transform: 'scale(1)' },
                            '100%': { transform: 'scale(1.2)' },
                          },
                        }} 
                      />
                    )}
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 12 }} />
                    {job.customerName || job.instructions?.split('-')[0]?.trim() || 'Customer'}
                  </Typography>
                </>
              )}
            </Box>
            
            {/* Priority & Edit */}
            <Stack direction="row" spacing={0.5} alignItems="center">
              {onUpdate && !editing && isHovered && (
                <Zoom in>
                  <IconButton
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                    sx={{ 
                      p: 0.5,
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'primary.light', color: 'white' }
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Zoom>
              )}
              <Chip
                label={editedJob.priority || job.priority}
                size="small"
                onClick={(e) => {
                  if (editing && onUpdate) {
                    e.stopPropagation()
                    setPriorityMenu(e.currentTarget)
                  }
                }}
                sx={{
                  background: priorityConfig.bgColor 
                    ? `linear-gradient(135deg, ${priorityConfig.bgColor}, ${alpha(priorityConfig.color || '#666', 0.1)})`
                    : 'grey.100',
                  color: priorityConfig.color || 'text.primary',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  height: 22,
                  border: '1px solid',
                  borderColor: alpha(priorityConfig.color || '#666', 0.3),
                  cursor: editing && onUpdate ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  '&:hover': editing ? {
                    transform: 'scale(1.05)',
                    boxShadow: 1,
                  } : {},
                }}
              />
            </Stack>
          </Box>
          
          <Menu
            anchorEl={priorityMenu}
            open={Boolean(priorityMenu)}
            onClose={() => setPriorityMenu(null)}
            TransitionComponent={Fade}
          >
            {['HOT', 'URGENT', 'NORMAL', 'LOW'].map((priority) => (
              <MenuItem
                key={priority}
                selected={editedJob.priority === priority}
                onClick={() => {
                  setEditedJob({ ...editedJob, priority })
                  setPriorityMenu(null)
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  {priority === 'HOT' && <FireIcon sx={{ color: 'error.main', fontSize: 18 }} />}
                  {priority === 'URGENT' && <BoltIcon sx={{ color: 'warning.main', fontSize: 18 }} />}
                  <span>{priority}</span>
                </Stack>
              </MenuItem>
            ))}
          </Menu>

          {/* Processing Type & Operation Badge */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mb: 1.5,
            p: 1,
            borderRadius: 2,
            bgcolor: alpha(statusConfig.color || '#1976d2', 0.08),
          }}>
            <ProcessIcon sx={{ fontSize: 18, color: statusConfig.color || 'primary.main' }} />
            <Typography variant="body2" fontWeight={600} sx={{ color: statusConfig.color || 'primary.main' }}>
              {processingType}
            </Typography>
          </Box>

          {!compact && (
            <>
              {/* Material Info - Clickable */}
              <Box 
                onClick={(e) => { e.stopPropagation(); setMaterialDialogOpen(true); }}
                sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  mb: 1.5, 
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px dashed',
                  borderColor: 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: alpha('#1976d2', 0.04),
                    borderStyle: 'solid',
                  }
                }}
              >
                <InventoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={500} noWrap>
                    {job.materialDescription || job.material || 'View Material Details'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {job.dimensions || '—'} • {formatWeight(job.weight)}
                  </Typography>
                </Box>
                <ExpandIcon sx={{ color: 'text.disabled', fontSize: 18 }} />
              </Box>

              {/* Progress Bar (if in process) */}
              {job.status === 'IN_PROCESS' && (
                <Box sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Progress
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="primary.main">
                      {job.completedPieces || 0}/{job.targetPieces || 0} pcs ({Math.round(getProgressValue())}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressValue()}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: alpha('#1976d2', 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        background: getProgressValue() > 80 
                          ? 'linear-gradient(90deg, #4caf50, #8bc34a)'
                          : 'linear-gradient(90deg, #1976d2, #42a5f5)',
                      }
                    }}
                  />
                </Box>
              )}

              {/* Due Date & Work Center */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: isOverdue ? alpha('#f44336', 0.1) : 'transparent',
                }}>
                  <TimeIcon sx={{ fontSize: 14, color: getDueDateColor() }} />
                  <Typography 
                    variant="caption" 
                    fontWeight={isOverdue ? 700 : 500}
                    sx={{ color: getDueDateColor() }}
                  >
                    {formatDate(job.dueDate)}
                  </Typography>
                </Box>
                {job.workCenterName && (
                  <Chip
                    label={job.workCenterName}
                    size="small"
                    sx={{ 
                      fontSize: '0.65rem', 
                      height: 20,
                      bgcolor: alpha('#1976d2', 0.1),
                      fontWeight: 500,
                    }}
                  />
                )}
              </Box>

              {/* AI Hints Section */}
              {hints.length > 0 && showAIHints && (
                <Collapse in={isHovered || expanded}>
                  <Box sx={{ 
                    mt: 1.5, 
                    p: 1, 
                    borderRadius: 2, 
                    bgcolor: alpha('#9c27b0', 0.05),
                    border: '1px solid',
                    borderColor: alpha('#9c27b0', 0.2),
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <AIIcon sx={{ fontSize: 14, color: 'secondary.main' }} />
                      <Typography variant="caption" fontWeight={600} color="secondary.main">
                        AI Insights
                      </Typography>
                    </Box>
                    {hints.map((hint, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <hint.icon sx={{ 
                          fontSize: 12, 
                          color: hint.type === 'warning' ? 'warning.main' 
                            : hint.type === 'success' ? 'success.main' 
                            : hint.type === 'action' ? 'error.main'
                            : 'info.main' 
                        }} />
                        <Typography variant="caption" color="text.secondary">
                          {hint.text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Collapse>
              )}

              {/* Operators */}
              {job.operators?.length > 0 && (
                <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AvatarGroup 
                    max={3} 
                    sx={{ 
                      '& .MuiAvatar-root': { 
                        width: 26, 
                        height: 26, 
                        fontSize: '0.75rem',
                        border: '2px solid white',
                        boxShadow: 1,
                      } 
                    }}
                  >
                    {job.operators.map((op, idx) => (
                      <Tooltip key={op.id || idx} title={op.name || 'Operator'}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {op.initials || op.name?.charAt(0) || 'O'}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </Box>
              )}
            </>
          )}

          {/* Status Chip - Bottom */}
          <Box sx={{ mt: compact ? 1 : 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              icon={statusConfig.icon ? <statusConfig.icon sx={{ fontSize: '14px !important' }} /> : undefined}
              label={statusConfig.label || job.status}
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${statusConfig.bgColor || '#e0e0e0'}, ${alpha(statusConfig.color || '#666', 0.1)})`,
                color: statusConfig.color || 'text.primary',
                fontWeight: 600,
                fontSize: '0.7rem',
                border: '1px solid',
                borderColor: alpha(statusConfig.color || '#666', 0.3),
              }}
            />
            
            {/* AI Assist Button */}
            {onAIAssist && isHovered && (
              <Zoom in>
                <Tooltip title="Ask AI about this job">
                  <IconButton
                    size="small"
                    onClick={handleAskAI}
                    sx={{
                      bgcolor: 'secondary.main',
                      color: 'white',
                      width: 28,
                      height: 28,
                      '&:hover': {
                        bgcolor: 'secondary.dark',
                        transform: 'scale(1.1)',
                      },
                      transition: 'all 0.2s',
                    }}
                  >
                    <AIIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Zoom>
            )}
          </Box>
        </CardContent>

        {/* Actions */}
        {showActions && !compact && (
          <CardActions sx={{ 
            pt: 0, 
            px: 2, 
            pb: 1.5, 
            justifyContent: editing ? 'space-between' : 'flex-end',
            borderTop: editing ? '1px solid' : 'none',
            borderColor: 'divider',
          }}>
            {editing ? (
              <>
                <Button
                  size="small"
                  startIcon={<CloseIcon />}
                  onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                  sx={{ color: 'text.secondary' }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={(e) => { e.stopPropagation(); handleSave(); }}
                  sx={{
                    background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                    }
                  }}
                >
                  Save
                </Button>
              </>
            ) : (
              <Fade in={isHovered}>
                <Stack direction="row" spacing={0.5}>
                  {job.status === 'SCHEDULED' && onStart && (
                    <Tooltip title="Start Job">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onStart(job); }}
                        sx={{
                          bgcolor: 'success.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': { bgcolor: 'success.dark', transform: 'scale(1.1)' },
                        }}
                      >
                        <PlayIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {job.status === 'IN_PROCESS' && onPause && (
                    <Tooltip title="Pause Job">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onPause(job); }}
                        sx={{
                          bgcolor: 'warning.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': { bgcolor: 'warning.dark', transform: 'scale(1.1)' },
                        }}
                      >
                        <PauseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {(job.status === 'IN_PROCESS' || job.status === 'WAITING_QC') && onComplete && (
                    <Tooltip title="Complete Job">
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); onComplete(job); }}
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.1)' },
                        }}
                      >
                        <CompleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Fade>
            )}
          </CardActions>
        )}
      </Card>

      {/* Job Details Dialog - Modern Style */}
      <Dialog
        open={materialDialogOpen}
        onClose={(e) => { e?.stopPropagation?.(); setMaterialDialogOpen(false); }}
        onClick={(e) => e.stopPropagation()}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(180deg, #fafafa 0%, #ffffff 100%)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: `linear-gradient(135deg, ${alpha(statusConfig.color || '#1976d2', 0.1)}, transparent)`,
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: statusConfig.color || 'primary.main' }}>
              <JobIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700}>{job.jobNumber || job.id}</Typography>
              <Typography variant="caption" color="text.secondary">
                {job.customerName || 'Customer'}
              </Typography>
            </Box>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip
              label={statusConfig.label || job.status}
              size="small"
              sx={{
                background: `linear-gradient(135deg, ${statusConfig.bgColor || '#e0e0e0'}, ${alpha(statusConfig.color || '#666', 0.1)})`,
                color: statusConfig.color || 'text.primary',
                fontWeight: 600,
              }}
            />
            <IconButton 
              onClick={(e) => { e.stopPropagation(); setMaterialDialogOpen(false); }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            {/* Operation Info */}
            <Box sx={{ 
              p: 2, 
              borderRadius: 2, 
              bgcolor: alpha(statusConfig.color || '#1976d2', 0.05),
              border: '1px solid',
              borderColor: alpha(statusConfig.color || '#1976d2', 0.2),
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: statusConfig.color || 'primary.main', width: 48, height: 48 }}>
                  <ProcessIcon />
                </Avatar>
                <Box>
                  <Typography variant="caption" color="text.secondary">Operation</Typography>
                  <Typography variant="h6" fontWeight={600}>{processingType}</Typography>
                </Box>
              </Stack>
            </Box>

            {/* Material Details */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <InventoryIcon sx={{ fontSize: 16 }} /> Material Information
              </Typography>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Description</Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {job.materialDescription || job.material || 'Not specified'}
                    </Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Dimensions</Typography>
                    <Typography variant="body2" fontWeight={600}>{job.dimensions || '—'}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Weight</Typography>
                    <Typography variant="body2" fontWeight={600}>{formatWeight(job.weight)}</Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>

            {/* Schedule Info */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ScheduleIcon sx={{ fontSize: 16 }} /> Schedule
              </Typography>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Due Date</Typography>
                    <Chip 
                      label={formatDate(job.dueDate)} 
                      size="small"
                      sx={{ 
                        bgcolor: isOverdue ? alpha('#f44336', 0.1) : alpha('#4caf50', 0.1),
                        color: isOverdue ? 'error.main' : 'success.main',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                  {job.workCenterName && (
                    <>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Work Center</Typography>
                        <Typography variant="body2" fontWeight={600}>{job.workCenterName}</Typography>
                      </Box>
                    </>
                  )}
                </Stack>
              </Box>
            </Box>

            {/* Progress */}
            {job.status === 'IN_PROCESS' && job.targetPieces > 0 && (
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: 'linear-gradient(135deg, rgba(25,118,210,0.05), rgba(66,165,245,0.05))',
                border: '1px solid',
                borderColor: alpha('#1976d2', 0.2),
              }}>
                <Typography variant="subtitle2" gutterBottom>Production Progress</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {job.completedPieces || 0} of {job.targetPieces} pieces
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="primary.main">
                    {Math.round(getProgressValue())}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgressValue()}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: alpha('#1976d2', 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                      background: 'linear-gradient(90deg, #1976d2, #42a5f5)',
                    }
                  }}
                />
              </Box>
            )}

            {/* Notes */}
            {(job.notes || job.instructions) && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <NotesIcon sx={{ fontSize: 16 }} /> Notes & Instructions
                </Typography>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha('#ff9800', 0.05), border: '1px solid', borderColor: alpha('#ff9800', 0.2) }}>
                  {job.instructions && (
                    <Typography variant="body2" sx={{ mb: job.notes ? 1 : 0 }}>{job.instructions}</Typography>
                  )}
                  {job.notes && (
                    <Typography variant="body2" color="text.secondary">{job.notes}</Typography>
                  )}
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <MuiDialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={(e) => { e.stopPropagation(); setMaterialDialogOpen(false); }}
            sx={{ color: 'text.secondary' }}
          >
            Close
          </Button>
          {onAIAssist && (
            <Button
              startIcon={<AIIcon />}
              onClick={(e) => { 
                e.stopPropagation(); 
                setMaterialDialogOpen(false); 
                onAIAssist(job);
              }}
              sx={{ 
                bgcolor: alpha('#9c27b0', 0.1),
                color: 'secondary.main',
                '&:hover': { bgcolor: alpha('#9c27b0', 0.2) }
              }}
            >
              Ask AI
            </Button>
          )}
          {onUpdate && (
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={(e) => { 
                e.stopPropagation(); 
                setMaterialDialogOpen(false); 
                setEditing(true); 
              }}
              sx={{
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                }
              }}
            >
              Edit Job
            </Button>
          )}
        </MuiDialogActions>
      </Dialog>
    </>
  )
}

export default ModernJobCard
