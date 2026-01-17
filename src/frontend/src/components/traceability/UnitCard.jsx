import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material'
import {
  Visibility as ViewIcon,
  QrCode2 as QrCodeIcon,
  Timeline as TimelineIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material'
import StatusChip from '../common/StatusChip'

export default function UnitCard({
  unit,
  onView,
  onTrace,
  onQrCode,
  compact = false,
  selected = false,
}) {
  if (!unit) return null

  const {
    id,
    unitNumber,
    heatNumber,
    grade,
    weight,
    weightUnit = 'lbs',
    dimensions,
    status,
    location,
    certifications = [],
    qualityStatus,
  } = unit

  return (
    <Card 
      variant={selected ? 'elevation' : 'outlined'}
      sx={{ 
        borderColor: selected ? 'primary.main' : undefined,
        borderWidth: selected ? 2 : 1,
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: 2,
        },
      }}
    >
      <CardContent sx={{ pb: compact ? 1 : 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              {unitNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Heat: {heatNumber}
            </Typography>
          </Box>
          <StatusChip status={status} />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
          {grade && (
            <Chip label={grade} size="small" color="primary" variant="outlined" />
          )}
          {qualityStatus && (
            <StatusChip status={qualityStatus} size="small" />
          )}
        </Stack>

        {!compact && (
          <>
            <Divider sx={{ my: 1.5 }} />
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Typography variant="caption" color="text.disabled">
                  Weight
                </Typography>
                <Typography variant="body2">
                  {weight?.toLocaleString()} {weightUnit}
                </Typography>
              </Box>
              
              {dimensions && (
                <Box>
                  <Typography variant="caption" color="text.disabled">
                    Dimensions
                  </Typography>
                  <Typography variant="body2">
                    {dimensions.width}" × {dimensions.gauge}"
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ gridColumn: 'span 2' }}>
                <Typography variant="caption" color="text.disabled">
                  Location
                </Typography>
                <Typography variant="body2">
                  {location || 'Not assigned'}
                </Typography>
              </Box>
            </Box>

            {certifications.length > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.5 }}>
                  Certifications
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {certifications.map((cert) => (
                    <Chip 
                      key={cert} 
                      label={cert} 
                      size="small" 
                      variant="filled"
                      color="success"
                      sx={{ fontSize: '0.7rem' }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <Tooltip title="View Details">
          <IconButton size="small" onClick={() => onView?.(unit)}>
            <ViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="View Trace">
          <IconButton size="small" onClick={() => onTrace?.(unit)}>
            <TimelineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="QR Code">
          <IconButton size="small" onClick={() => onQrCode?.(unit)}>
            <QrCodeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  )
}
