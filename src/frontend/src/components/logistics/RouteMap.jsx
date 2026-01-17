import { Box, Paper, Typography, Stepper, Step, StepLabel, StepContent, Chip, Stack } from '@mui/material'
import {
  LocationOn as LocationIcon,
  CheckCircle as CompletedIcon,
  RadioButtonUnchecked as PendingIcon,
  DirectionsCar as InTransitIcon,
} from '@mui/icons-material'

function formatDateTime(dateString) {
  if (!dateString) return 'TBD'
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStopStatus(stop, currentStopIndex, index) {
  if (index < currentStopIndex) return 'completed'
  if (index === currentStopIndex) return 'current'
  return 'pending'
}

function getStopIcon(status) {
  switch (status) {
    case 'completed':
      return <CompletedIcon color="success" />
    case 'current':
      return <InTransitIcon color="primary" />
    default:
      return <PendingIcon color="disabled" />
  }
}

export default function RouteMap({
  route = {},
  stops = [],
  currentStopIndex = 0,
  showEstimates = true,
  orientation = 'vertical',
}) {
  const {
    origin,
    destination,
    distance,
    estimatedDuration,
    carrier,
  } = route

  // Build full stop list from origin, waypoints, and destination
  const allStops = [
    { ...origin, type: 'origin', label: 'Origin' },
    ...stops.map(s => ({ ...s, type: 'waypoint' })),
    { ...destination, type: 'destination', label: 'Destination' },
  ].filter(Boolean)

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Route Summary Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Route Overview
          </Typography>
          {carrier && (
            <Typography variant="body2" color="text.secondary">
              Carrier: {carrier}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          {distance && (
            <Chip label={`${distance} mi`} size="small" variant="outlined" />
          )}
          {estimatedDuration && (
            <Chip label={estimatedDuration} size="small" variant="outlined" />
          )}
        </Stack>
      </Box>

      {/* Route Stepper */}
      <Stepper 
        activeStep={currentStopIndex} 
        orientation={orientation}
        sx={{ 
          ...(orientation === 'horizontal' && {
            '.MuiStepConnector-line': {
              minWidth: 50,
            },
          }),
        }}
      >
        {allStops.map((stop, index) => {
          const status = getStopStatus(stop, currentStopIndex, index)
          
          return (
            <Step key={stop.id || index} completed={status === 'completed'}>
              <StepLabel
                StepIconComponent={() => getStopIcon(status)}
                optional={
                  showEstimates && stop.eta ? (
                    <Typography variant="caption" color="text.secondary">
                      {status === 'completed' ? 'Arrived' : 'ETA'}: {formatDateTime(stop.eta || stop.arrivedAt)}
                    </Typography>
                  ) : null
                }
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationIcon 
                    fontSize="small" 
                    color={stop.type === 'origin' ? 'success' : stop.type === 'destination' ? 'error' : 'action'} 
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={status === 'current' ? 600 : 400}>
                      {stop.name || stop.address || `Stop ${index + 1}`}
                    </Typography>
                    {stop.address && stop.name && (
                      <Typography variant="caption" color="text.secondary">
                        {stop.address}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </StepLabel>
              
              {orientation === 'vertical' && stop.notes && (
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {stop.notes}
                  </Typography>
                </StepContent>
              )}
            </Step>
          )
        })}
      </Stepper>

      {/* Current Status */}
      {currentStopIndex >= 0 && currentStopIndex < allStops.length && (
        <Box 
          sx={{ 
            mt: 2, 
            p: 1.5, 
            bgcolor: 'primary.light', 
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <InTransitIcon color="primary" />
          <Typography variant="body2">
            {currentStopIndex === 0 
              ? 'Departing from origin'
              : currentStopIndex === allStops.length - 1
                ? 'Arriving at destination'
                : `In transit to ${allStops[currentStopIndex]?.name || 'next stop'}`
            }
          </Typography>
        </Box>
      )}
    </Paper>
  )
}
