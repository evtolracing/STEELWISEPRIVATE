/**
 * OrderSourceChip — displays order source with colour-coded chip
 */
import React from 'react'
import { Chip } from '@mui/material'
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as RepIcon,
  Storefront as RetailIcon,
  Language as OnlineIcon,
  Description as QuoteIcon,
} from '@mui/icons-material'

const CFG = {
  PHONE:  { label: 'Phone',  color: 'primary',   icon: <PhoneIcon  sx={{ fontSize: 16 }} /> },
  EMAIL:  { label: 'Email',  color: 'info',       icon: <EmailIcon  sx={{ fontSize: 16 }} /> },
  REP:    { label: 'Sales Rep', color: 'secondary', icon: <RepIcon sx={{ fontSize: 16 }} /> },
  RETAIL: { label: 'Retail',  color: 'success',    icon: <RetailIcon sx={{ fontSize: 16 }} /> },
  ONLINE: { label: 'Online',  color: 'warning',    icon: <OnlineIcon sx={{ fontSize: 16 }} /> },
  QUOTE:  { label: 'Quote',   color: 'default',    icon: <QuoteIcon  sx={{ fontSize: 16 }} /> },
}

export default function OrderSourceChip({ source, size = 'small', ...rest }) {
  const c = CFG[source] || { label: source || '—', color: 'default', icon: null }
  return <Chip icon={c.icon} label={c.label} color={c.color} size={size} variant="outlined" {...rest} />
}
