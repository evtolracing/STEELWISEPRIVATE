import { useRouteError, useNavigate, isRouteErrorResponse } from 'react-router-dom'
import { Box, Typography, Button, Paper, Stack, Chip, Divider } from '@mui/material'
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  SearchOff as NotFoundIcon,
  Lock as ForbiddenIcon,
  CloudOff as ServerErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material'

const errorConfig = {
  404: {
    icon: NotFoundIcon,
    title: 'Page Not Found',
    message: "The page you're looking for doesn't exist or has been moved.",
    color: 'warning',
  },
  401: {
    icon: ForbiddenIcon,
    title: 'Unauthorized',
    message: 'You need to log in to access this page.',
    color: 'warning',
  },
  403: {
    icon: ForbiddenIcon,
    title: 'Access Denied',
    message: "You don't have permission to view this page.",
    color: 'error',
  },
  500: {
    icon: ServerErrorIcon,
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    color: 'error',
  },
  default: {
    icon: ErrorIcon,
    title: 'Oops! Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    color: 'error',
  },
}

export default function RouteErrorPage() {
  const error = useRouteError()
  const navigate = useNavigate()

  // Determine error type and config
  let status = 'default'
  let statusText = ''
  let errorMessage = ''

  if (isRouteErrorResponse(error)) {
    status = error.status
    statusText = error.statusText
    errorMessage = error.data?.message || error.data || ''
  } else if (error instanceof Error) {
    errorMessage = error.message
    // Check for common error patterns
    if (error.message.includes('Failed to fetch dynamically imported module')) {
      status = 'module'
    }
  }

  const config = errorConfig[status] || errorConfig.default
  const IconComponent = config.icon

  // Special handling for module loading errors
  const isModuleError = status === 'module' || errorMessage.includes('dynamically imported module')
  
  if (isModuleError) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          p: 3,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            borderTop: 4,
            borderColor: 'warning.main',
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'warning.lighter',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
          </Box>

          <Typography variant="h5" fontWeight={600} gutterBottom>
            Page Loading Error
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            There was a problem loading this page. This usually happens after an update.
            A quick refresh should fix it.
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
          </Stack>
        </Paper>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        p: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          borderTop: 4,
          borderColor: `${config.color}.main`,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: `${config.color}.lighter`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <IconComponent sx={{ fontSize: 40, color: `${config.color}.main` }} />
        </Box>

        {status !== 'default' && typeof status === 'number' && (
          <Chip
            label={`Error ${status}${statusText ? `: ${statusText}` : ''}`}
            color={config.color}
            size="small"
            sx={{ mb: 2 }}
          />
        )}

        <Typography variant="h5" fontWeight={600} gutterBottom>
          {config.title}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          {config.message}
        </Typography>

        {errorMessage && (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{
              mb: 3,
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              p: 1,
              bgcolor: 'grey.50',
              borderRadius: 1,
              maxHeight: 80,
              overflow: 'auto',
            }}
          >
            {errorMessage}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}
