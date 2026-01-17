import React from 'react'
import { Chip, Tooltip } from '@mui/material'
import { JOB_STATUS_CONFIG } from '../../constants/jobStatuses'

// Reusable status chip component with consistent styling
const StatusChip = ({
  status,
  config = JOB_STATUS_CONFIG,
  size = 'small',
  showIcon = true,
  tooltip = true,
  ...props
}) => {
  const statusConfig = config[status] || {}

  const chip = (
    <Chip
      label={statusConfig.label || status}
      size={size}
      icon={showIcon && statusConfig.icon ? React.createElement(statusConfig.icon, { fontSize: 'small' }) : undefined}
      sx={{
        backgroundColor: statusConfig.bgColor || 'grey.200',
        color: statusConfig.color || 'text.primary',
        fontWeight: 500,
        borderLeft: '3px solid',
        borderColor: statusConfig.color || 'grey.400',
        '& .MuiChip-icon': {
          color: statusConfig.color || 'text.primary',
        },
        ...props.sx,
      }}
      {...props}
    />
  )

  if (tooltip && statusConfig.description) {
    return (
      <Tooltip title={statusConfig.description} arrow>
        {chip}
      </Tooltip>
    )
  }

  return chip
}

export default StatusChip
