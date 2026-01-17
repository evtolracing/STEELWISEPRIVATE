import { Box, Paper, Typography, Chip, Stack, Tooltip, LinearProgress } from '@mui/material'
import {
  LocalShipping as TruckIcon,
  Train as TrainIcon,
  DirectionsBoat as ShipIcon,
} from '@mui/icons-material'

const vehicleIcons = {
  truck: TruckIcon,
  flatbed: TruckIcon,
  train: TrainIcon,
  rail: TrainIcon,
  ship: ShipIcon,
  vessel: ShipIcon,
}

function formatWeight(weight, unit = 'lbs') {
  return `${weight?.toLocaleString() || 0} ${unit}`
}

export default function LoadDiagram({
  vehicle = {},
  units = [],
  maxCapacity,
  maxWeight,
  onUnitClick,
}) {
  const VehicleIcon = vehicleIcons[vehicle.type?.toLowerCase()] || TruckIcon
  
  const totalWeight = units.reduce((sum, u) => sum + (u.weight || 0), 0)
  const weightPercentage = maxWeight ? (totalWeight / maxWeight) * 100 : 0
  const countPercentage = maxCapacity ? (units.length / maxCapacity) * 100 : 0
  
  const isOverweight = weightPercentage > 100
  const isOverCapacity = countPercentage > 100

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      {/* Vehicle Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <VehicleIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {vehicle.name || vehicle.id || 'Vehicle'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {vehicle.licensePlate || vehicle.identifier || 'No identifier'}
          </Typography>
        </Box>
        <Chip 
          label={`${units.length} units`} 
          size="small" 
          color={isOverCapacity ? 'error' : 'default'}
        />
      </Box>

      {/* Capacity Indicators */}
      {maxWeight && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Weight Capacity
            </Typography>
            <Typography variant="caption" color={isOverweight ? 'error.main' : 'text.secondary'}>
              {formatWeight(totalWeight)} / {formatWeight(maxWeight)}
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(weightPercentage, 100)}
            color={isOverweight ? 'error' : weightPercentage > 90 ? 'warning' : 'primary'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>
      )}

      {/* Load Diagram Visualization */}
      <Box
        sx={{
          position: 'relative',
          border: '2px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1,
          minHeight: 120,
          bgcolor: 'grey.50',
        }}
      >
        {/* Grid Layout for Units */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
            gap: 1,
          }}
        >
          {units.map((unit, index) => (
            <Tooltip 
              key={unit.id || index}
              title={
                <Box>
                  <Typography variant="body2">{unit.unitNumber}</Typography>
                  <Typography variant="caption">
                    {formatWeight(unit.weight)} | {unit.grade}
                  </Typography>
                </Box>
              }
            >
              <Paper
                elevation={2}
                onClick={() => onUnitClick?.(unit)}
                sx={{
                  p: 1,
                  cursor: onUnitClick ? 'pointer' : 'default',
                  textAlign: 'center',
                  bgcolor: unit.status === 'LOADED' ? 'success.light' : 
                           unit.status === 'PENDING' ? 'warning.light' : 'background.paper',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                <Typography variant="caption" fontWeight={600} noWrap>
                  {unit.unitNumber}
                </Typography>
                <Typography variant="caption" display="block" color="text.secondary" noWrap>
                  {formatWeight(unit.weight)}
                </Typography>
              </Paper>
            </Tooltip>
          ))}

          {/* Empty slots */}
          {maxCapacity && units.length < maxCapacity && 
            Array(Math.min(maxCapacity - units.length, 8)).fill(null).map((_, i) => (
              <Box
                key={`empty-${i}`}
                sx={{
                  p: 1,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  textAlign: 'center',
                  minHeight: 50,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="caption" color="text.disabled">
                  Empty
                </Typography>
              </Box>
            ))
          }
        </Box>

        {units.length === 0 && (
          <Box sx={{ 
            position: 'absolute', 
            inset: 0, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Typography color="text.disabled">No units loaded</Typography>
          </Box>
        )}
      </Box>

      {/* Summary Footer */}
      <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary">
            {units.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Units
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color={isOverweight ? 'error.main' : 'primary'}>
            {formatWeight(totalWeight)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Weight
          </Typography>
        </Box>
      </Stack>
    </Paper>
  )
}
