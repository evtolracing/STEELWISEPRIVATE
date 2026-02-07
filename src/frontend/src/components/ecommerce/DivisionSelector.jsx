/**
 * DivisionSelector — clickable division tiles for the shop landing page.
 */
import React from 'react'
import { Box, Paper, Typography, Grid, Avatar } from '@mui/material'
import {
  Straighten as MetalsIcon,
  Science as PlasticsIcon,
  Build as SuppliesIcon,
  LocalOffer as OutletIcon,
} from '@mui/icons-material'

const DIVISION_META = {
  METALS: { label: 'Metals', desc: 'Steel, stainless, aluminum, brass & copper', icon: MetalsIcon, color: '#1565c0', bg: '#e3f2fd' },
  PLASTICS: { label: 'Plastics', desc: 'HDPE, UHMW, acetal, nylon & more', icon: PlasticsIcon, color: '#2e7d32', bg: '#e8f5e9' },
  SUPPLIES: { label: 'Industrial Supplies', desc: 'Abrasives, safety, welding & tooling', icon: SuppliesIcon, color: '#e65100', bg: '#fff3e0' },
  OUTLET: { label: 'Outlet / Remnants', desc: 'Discounted drops & remnant pieces', icon: OutletIcon, color: '#c62828', bg: '#fce4ec' },
}

export default function DivisionSelector({ onSelect, selected, counts = {} }) {
  return (
    <Grid container spacing={2}>
      {Object.entries(DIVISION_META).map(([key, meta]) => {
        const Icon = meta.icon
        const isSelected = selected === key
        return (
          <Grid item xs={6} md={3} key={key}>
            <Paper
              elevation={isSelected ? 4 : 1}
              onClick={() => onSelect(key)}
              sx={{
                p: 2.5, cursor: 'pointer', borderRadius: 3, textAlign: 'center',
                border: isSelected ? `2px solid ${meta.color}` : '2px solid transparent',
                bgcolor: isSelected ? meta.bg : '#fff',
                transition: 'all 0.2s',
                '&:hover': { borderColor: meta.color, transform: 'translateY(-2px)', boxShadow: 3 },
              }}
            >
              <Avatar sx={{ bgcolor: meta.color, width: 56, height: 56, mx: 'auto', mb: 1.5 }}>
                <Icon sx={{ fontSize: 30 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight={700}>{meta.label}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{meta.desc}</Typography>
              {counts[key] != null && (
                <Typography variant="caption" color="primary" fontWeight={600}>{counts[key]} products</Typography>
              )}
            </Paper>
          </Grid>
        )
      })}
    </Grid>
  )
}
