import { Box, Typography, Button } from '@mui/material'
import { 
  Inbox as InboxIcon, 
  Search as SearchIcon,
  Add as AddIcon,
} from '@mui/icons-material'

const iconMap = {
  empty: InboxIcon,
  search: SearchIcon,
  add: AddIcon,
}

export default function EmptyState({
  icon = 'empty',
  title = 'No data found',
  description = 'There are no items to display.',
  actionLabel,
  onAction,
  children,
}) {
  const IconComponent = iconMap[icon] || iconMap.empty

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
        textAlign: 'center',
      }}
    >
      <IconComponent 
        sx={{ 
          fontSize: 64, 
          color: 'text.disabled',
          mb: 2,
        }} 
      />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ mb: 3, maxWidth: 400 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
      {children}
    </Box>
  )
}
