/**
 * CatalogSearchBar — main search input for the shop.
 */
import React, { useState, useCallback } from 'react'
import { Box, TextField, InputAdornment, IconButton, Paper } from '@mui/material'
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material'

export default function CatalogSearchBar({ onSearch, initialValue = '', placeholder, autoFocus = false }) {
  const [value, setValue] = useState(initialValue)

  const handleSubmit = useCallback((e) => {
    e?.preventDefault?.()
    onSearch(value.trim())
  }, [value, onSearch])

  const handleClear = () => { setValue(''); onSearch('') }

  return (
    <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ display: 'flex', alignItems: 'center', borderRadius: 3, overflow: 'hidden' }}>
      <TextField
        fullWidth variant="outlined" size="medium" autoFocus={autoFocus}
        placeholder={placeholder || 'Search by material, grade, spec, or keyword…'}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(e) }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
          endAdornment: value ? <InputAdornment position="end"><IconButton size="small" onClick={handleClear}><ClearIcon /></IconButton></InputAdornment> : null,
          sx: { '& fieldset': { border: 'none' } },
        }}
        sx={{ '& .MuiOutlinedInput-root': { py: 0.5 } }}
      />
      <IconButton type="submit" color="primary" sx={{ px: 2.5, borderRadius: 0, bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, height: '100%', minHeight: 56 }}>
        <SearchIcon />
      </IconButton>
    </Paper>
  )
}
