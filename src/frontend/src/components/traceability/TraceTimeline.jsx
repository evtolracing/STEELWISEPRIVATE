import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab'
import { Box, Typography, Paper, Chip } from '@mui/material'
import {
  LocalShipping as ShippingIcon,
  Factory as FactoryIcon,
  Warehouse as WarehouseIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckIcon,
  Science as ScienceIcon,
  Build as BuildIcon,
  Person as PersonIcon,
} from '@mui/icons-material'

const eventTypeConfig = {
  CREATED: { icon: AssignmentIcon, color: 'primary' },
  RECEIVED: { icon: WarehouseIcon, color: 'info' },
  PROCESSED: { icon: FactoryIcon, color: 'warning' },
  TRANSFORMED: { icon: BuildIcon, color: 'secondary' },
  TESTED: { icon: ScienceIcon, color: 'info' },
  APPROVED: { icon: CheckIcon, color: 'success' },
  SHIPPED: { icon: ShippingIcon, color: 'primary' },
  DELIVERED: { icon: CheckIcon, color: 'success' },
  TRANSFERRED: { icon: PersonIcon, color: 'grey' },
}

function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function TraceTimeline({ events = [], compact = false }) {
  if (!events.length) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No trace events found</Typography>
      </Box>
    )
  }

  return (
    <Timeline position={compact ? 'right' : 'alternate'}>
      {events.map((event, index) => {
        const config = eventTypeConfig[event.type] || eventTypeConfig.CREATED
        const IconComponent = config.icon

        return (
          <TimelineItem key={event.id || index}>
            {!compact && (
              <TimelineOppositeContent color="text.secondary">
                <Typography variant="body2">
                  {formatDateTime(event.timestamp || event.createdAt)}
                </Typography>
              </TimelineOppositeContent>
            )}
            
            <TimelineSeparator>
              <TimelineDot color={config.color}>
                <IconComponent fontSize="small" />
              </TimelineDot>
              {index < events.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            
            <TimelineContent>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" component="span">
                    {event.title || event.type}
                  </Typography>
                  {event.location && (
                    <Chip label={event.location} size="small" variant="outlined" />
                  )}
                </Box>
                
                {event.description && (
                  <Typography variant="body2" color="text.secondary">
                    {event.description}
                  </Typography>
                )}
                
                {event.actor && (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                    By: {event.actor}
                  </Typography>
                )}
                
                {compact && (
                  <Typography variant="caption" color="text.disabled">
                    {formatDateTime(event.timestamp || event.createdAt)}
                  </Typography>
                )}
                
                {event.metadata && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <Chip 
                        key={key} 
                        label={`${key}: ${value}`} 
                        size="small" 
                        variant="filled"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                  </Box>
                )}
              </Paper>
            </TimelineContent>
          </TimelineItem>
        )
      })}
    </Timeline>
  )
}
