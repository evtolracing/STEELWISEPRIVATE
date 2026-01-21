import React, { useState } from 'react'
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
  DialogActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
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
} from '@mui/icons-material'
import { JOB_STATUS_CONFIG } from '../../constants/jobStatuses'
import { PROCESSING_TYPES } from '../../constants/processingTypes'
import { PRIORITY_LEVELS_CONFIG } from '../../constants/materials'

const JobCard = ({
  job,
  onStart,
  onPause,
  onComplete,
  onClick,
  onUpdate,
  draggable = true,
  compact = false,
  showActions = true,
}) => {
  const [editing, setEditing] = useState(false)
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false)
  const [editedJob, setEditedJob] = useState({ ...job })
  const [priorityMenu, setPriorityMenu] = useState(null)
  const statusConfig = JOB_STATUS_CONFIG[job.status] || {}
  const priorityConfig = PRIORITY_LEVELS_CONFIG?.[job.priority] || {}
  const processingType = PROCESSING_TYPES[job.processingType] || job.processingType

  const formatWeight = (lbs) => {
    if (!lbs) return '—'
    return lbs >= 1000 ? `${(lbs / 1000).toFixed(1)}k lbs` : `${lbs} lbs`
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const getProgressValue = () => {
    if (!job.targetPieces || !job.completedPieces) return 0
    return (job.completedPieces / job.targetPieces) * 100
  }

  const isHotJob = job.priority === 'HOT'
  const isUrgent = job.priority === 'URGENT'

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('jobId', job.id)
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

  return (
    <Card
      draggable={draggable && !editing}
      onDragStart={handleDragStart}
      onClick={(e) => {
        if (!editing && onClick) onClick(e)
      }}
      sx={{
        cursor: draggable && !editing ? 'grab' : onClick && !editing ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: isHotJob ? 'error.main' : isUrgent ? 'warning.main' : 'divider',
        borderLeft: '4px solid',
        borderLeftColor: statusConfig.color || 'primary.main',
        transition: 'all 0.2s ease',
        animation: isHotJob ? 'pulse 2s infinite' : 'none',
        '@keyframes pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(211, 47, 47, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(211, 47, 47, 0)' },
        },
        '&:hover': {
          borderColor: statusConfig.color || 'primary.main',
          boxShadow: 2,
        },
        '&:active': {
          cursor: draggable && !editing ? 'grabbing' : 'default',
        },
        ...(compact && { minHeight: 80 }),
      }}
    >
      <CardContent sx={{ pb: compact ? 1 : 2, pt: compact ? 1.5 : 2 }}>
        {/* Header Row */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
          {draggable && (
            <DragIcon
              sx={{ color: 'text.disabled', cursor: 'grab', mt: 0.5 }}
              fontSize="small"
            />
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
                <Typography
                  variant={compact ? 'body2' : 'subtitle1'}
                  fontWeight={600}
                  noWrap
                  sx={{ color: 'text.primary' }}
                >
                  {job.jobNumber || job.id}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {job.customerName || job.instructions || 'Customer'}
                </Typography>
              </>
            )}
          </Box>
          {onUpdate && !editing && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              sx={{ p: 0.5 }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
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
              backgroundColor: priorityConfig.bgColor || 'grey.100',
              color: priorityConfig.color || 'text.primary',
              fontWeight: 600,
              fontSize: '0.65rem',
              height: 20,
              cursor: editing && onUpdate ? 'pointer' : 'default',
            }}
          />
        </Box>
        <Menu
          anchorEl={priorityMenu}
          open={Boolean(priorityMenu)}
          onClose={() => setPriorityMenu(null)}
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
              {priority}
            </MenuItem>
          ))}
        </Menu>

        {/* Processing Type & Material */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <ProcessIcon fontSize="small" color="action" />
          <Typography variant="body2" fontWeight={500}>
            {processingType}
          </Typography>
        </Stack>

        {!compact && (
          <>
            {/* Material Info */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<InventoryIcon />}
                label={job.materialDescription || job.material || job.instructions?.split('-')[1]?.trim() || 'View Details'}
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation()
                  setMaterialDialogOpen(true)
                }}
                sx={{ 
                  maxWidth: '100%', 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    borderColor: 'primary.main',
                  }
                }}
              />
            </Box>

            {/* Dimensions / Weight */}
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              {job.dimensions || '—'} | {formatWeight(job.weight)}
            </Typography>

            {/* Progress Bar (if in process) */}
            {job.status === 'IN_PROCESS' && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {job.completedPieces || 0}/{job.targetPieces || 0} pcs
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getProgressValue()}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            )}

            {/* Work Center & Schedule */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                <ScheduleIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                {formatDate(job.dueDate)}
              </Typography>
              {job.workCenterName && (
                <Chip
                  label={job.workCenterName}
                  size="small"
                  sx={{ fontSize: '0.65rem', height: 18 }}
                />
              )}
            </Box>

            {/* Assigned Operators */}
            {job.operators?.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                  {job.operators.map((op, idx) => (
                    <Avatar key={op.id || op.name || `op-${idx}`} sx={{ bgcolor: 'primary.main' }}>
                      {op.initials || op.name?.charAt(0) || 'O'}
                    </Avatar>
                  ))}
                </AvatarGroup>
              </Box>
            )}
          </>
        )}

        {/* Status Chip */}
        <Box sx={{ mt: compact ? 1 : 1.5 }}>
          <Chip
            label={statusConfig.label || job.status}
            size="small"
            sx={{
              backgroundColor: statusConfig.bgColor || 'grey.200',
              color: statusConfig.color || 'text.primary',
              fontWeight: 500,
              fontSize: '0.7rem',
            }}
          />
        </Box>
      </CardContent>

      {/* Actions */}
      {showActions && !compact && (
        <CardActions sx={{ pt: 0, px: 2, pb: 1.5, justifyContent: editing ? 'space-between' : 'flex-end' }}>
          {editing ? (
            <>
              <Button
                size="small"
                startIcon={<CloseIcon />}
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              >
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              {job.status === 'SCHEDULED' && onStart && (
                <Tooltip title="Start Job">
                  <IconButton
                    size="small"
                    color="success"
                    onClick={(e) => { e.stopPropagation(); onStart(job); }}
                  >
                    <PlayIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {job.status === 'IN_PROCESS' && onPause && (
                <Tooltip title="Pause Job">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={(e) => { e.stopPropagation(); onPause(job); }}
                  >
                    <PauseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {(job.status === 'IN_PROCESS' || job.status === 'WAITING_QC') && onComplete && (
                <Tooltip title="Complete Job">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={(e) => { e.stopPropagation(); onComplete(job); }}
                  >
                    <CompleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </>
          )}
        </CardActions>
      )}

      {/* Job Details Dialog */}
      <Dialog
        open={materialDialogOpen}
        onClose={(e) => { e.stopPropagation(); setMaterialDialogOpen(false); }}
        onClick={(e) => e.stopPropagation()}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <JobIcon color="primary" />
            <Typography variant="h6">{job.jobNumber || job.id}</Typography>
          </Box>
          <Chip
            label={statusConfig.label || job.status}
            size="small"
            sx={{
              backgroundColor: statusConfig.bgColor || 'grey.200',
              color: statusConfig.color || 'text.primary',
              fontWeight: 600,
            }}
          />
        </DialogTitle>
        <DialogContent dividers>
          <List dense>
            <ListItem>
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText 
                primary="Customer" 
                secondary={job.customerName || job.instructions?.split('-')[0]?.trim() || 'Not specified'} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><ProcessIcon /></ListItemIcon>
              <ListItemText 
                primary="Operation Type" 
                secondary={processingType || 'Not specified'} 
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemIcon><InventoryIcon /></ListItemIcon>
              <ListItemText 
                primary="Material" 
                secondary={job.materialDescription || job.material || job.instructions?.split('-')[1]?.trim() || 'Not specified'} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><DimensionsIcon /></ListItemIcon>
              <ListItemText 
                primary="Dimensions" 
                secondary={job.dimensions || 'Not specified'} 
              />
            </ListItem>
            <ListItem>
              <ListItemIcon><ScaleIcon /></ListItemIcon>
              <ListItemText 
                primary="Weight" 
                secondary={formatWeight(job.weight)} 
              />
            </ListItem>
            <Divider component="li" />
            <ListItem>
              <ListItemIcon><ScheduleIcon /></ListItemIcon>
              <ListItemText 
                primary="Due Date" 
                secondary={formatDate(job.dueDate) || 'Not set'} 
              />
            </ListItem>
            {job.workCenterName && (
              <ListItem>
                <ListItemIcon><ProcessIcon /></ListItemIcon>
                <ListItemText 
                  primary="Work Center" 
                  secondary={job.workCenterName} 
                />
              </ListItem>
            )}
            {job.notes && (
              <>
                <Divider component="li" />
                <ListItem>
                  <ListItemIcon><NotesIcon /></ListItemIcon>
                  <ListItemText 
                    primary="Notes" 
                    secondary={job.notes} 
                  />
                </ListItem>
              </>
            )}
            {job.instructions && (
              <ListItem>
                <ListItemIcon><NotesIcon /></ListItemIcon>
                <ListItemText 
                  primary="Instructions" 
                  secondary={job.instructions} 
                />
              </ListItem>
            )}
          </List>
          
          {/* Progress section for in-process jobs */}
          {job.status === 'IN_PROCESS' && job.targetPieces > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>Progress</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {job.completedPieces || 0} of {job.targetPieces} pieces completed
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {Math.round(getProgressValue())}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={getProgressValue()}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={(e) => { e.stopPropagation(); setMaterialDialogOpen(false); }}>
            Close
          </Button>
          {onUpdate && (
            <Button 
              variant="contained" 
              onClick={(e) => { 
                e.stopPropagation(); 
                setMaterialDialogOpen(false); 
                setEditing(true); 
              }}
            >
              Edit Job
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default JobCard
