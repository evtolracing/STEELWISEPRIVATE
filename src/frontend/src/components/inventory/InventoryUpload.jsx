/**
 * InventoryUpload Component
 * Reusable component for bulk inventory upload via CSV/Excel
 * Used in Receiving, Inventory Dashboard, and Unit List pages
 */

import React, { useState, useRef, useCallback } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  AlertTitle,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  alpha,
  Link,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Close as CloseIcon,
  FilePresent as FileIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Description as TemplateIcon,
  Info as InfoIcon,
} from '@mui/icons-material'

// Template definitions for different inventory types
export const INVENTORY_TEMPLATES = {
  coils: {
    name: 'Coils / Master Stock',
    description: 'For receiving coils, master stock, and bulk inventory',
    filename: 'inventory_coils_template.csv',
    headers: [
      'tag_number',
      'heat_number',
      'material_code',
      'grade',
      'thickness',
      'width',
      'weight_lbs',
      'coil_od',
      'coil_id',
      'location_code',
      'bay_position',
      'ownership',
      'customer_name',
      'po_number',
      'mill_name',
      'notes',
    ],
    required: ['tag_number', 'material_code', 'weight_lbs', 'location_code'],
    example: [
      'TAG-001',
      'HT-2024-001',
      'HR-COIL-125-48',
      'A36',
      '0.125',
      '48',
      '45000',
      '72',
      '24',
      'DET-A',
      'A-01',
      'HOUSE_OWNED',
      '',
      'PO-12345',
      'Nucor',
      'Mill cert attached',
    ],
  },
  sheets: {
    name: 'Sheets / Plates',
    description: 'For sheet, plate, and cut-to-length inventory',
    filename: 'inventory_sheets_template.csv',
    headers: [
      'tag_number',
      'heat_number',
      'material_code',
      'grade',
      'thickness',
      'width',
      'length',
      'quantity_pcs',
      'weight_lbs',
      'location_code',
      'bay_position',
      'ownership',
      'customer_name',
      'po_number',
      'notes',
    ],
    required: ['tag_number', 'material_code', 'quantity_pcs', 'location_code'],
    example: [
      'SHT-001',
      'HT-2024-002',
      'CR-SHT-16GA-48-96',
      'CQ',
      '0.060',
      '48',
      '96',
      '50',
      '2450',
      'DET-B',
      'B-12',
      'HOUSE_OWNED',
      '',
      'PO-12346',
      '',
    ],
  },
  bars: {
    name: 'Bars / Structural',
    description: 'For bars, beams, tubes, and structural shapes',
    filename: 'inventory_bars_template.csv',
    headers: [
      'tag_number',
      'heat_number',
      'material_code',
      'grade',
      'size_description',
      'length_ft',
      'quantity_pcs',
      'weight_lbs',
      'location_code',
      'bay_position',
      'bundle_number',
      'ownership',
      'customer_name',
      'po_number',
      'notes',
    ],
    required: ['tag_number', 'material_code', 'quantity_pcs', 'location_code'],
    example: [
      'BAR-001',
      'HT-2024-003',
      'RND-1018-1.5',
      '1018',
      '1.5" Round',
      '20',
      '25',
      '1875',
      'DET-C',
      'C-05',
      'BDL-001',
      'HOUSE_OWNED',
      '',
      'PO-12347',
      '',
    ],
  },
  remnants: {
    name: 'Remnants',
    description: 'For remnant and partial inventory',
    filename: 'inventory_remnants_template.csv',
    headers: [
      'tag_number',
      'parent_tag',
      'material_code',
      'grade',
      'thickness',
      'width',
      'length',
      'weight_lbs',
      'location_code',
      'bay_position',
      'condition',
      'price_override',
      'notes',
    ],
    required: ['tag_number', 'material_code', 'weight_lbs', 'location_code'],
    example: [
      'REM-001',
      'TAG-001',
      'HR-COIL-125-48',
      'A36',
      '0.125',
      '36',
      '48',
      '350',
      'DET-REM',
      'R-01',
      'GOOD',
      '0.45',
      'Clean edges',
    ],
  },
  plastics: {
    name: 'Plastics',
    description: 'For plastic sheets, rods, and tubes',
    filename: 'inventory_plastics_template.csv',
    headers: [
      'tag_number',
      'lot_number',
      'material_code',
      'material_type',
      'color',
      'thickness',
      'width',
      'length',
      'quantity_pcs',
      'weight_lbs',
      'location_code',
      'bay_position',
      'ownership',
      'customer_name',
      'notes',
    ],
    required: ['tag_number', 'material_code', 'quantity_pcs', 'location_code'],
    example: [
      'PLS-001',
      'LOT-2024-001',
      'HDPE-SHT-0.5-48-96',
      'HDPE',
      'Natural',
      '0.500',
      '48',
      '96',
      '20',
      '640',
      'DET-P',
      'P-03',
      'HOUSE_OWNED',
      '',
      '',
    ],
  },
}

// Parse CSV content
const parseCSV = (content) => {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''))
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ''
    })
    row._rowNumber = i + 1
    rows.push(row)
  }
  
  return { headers, rows }
}

// Validate row against template
const validateRow = (row, template) => {
  const errors = []
  const warnings = []
  
  // Check required fields
  template.required.forEach(field => {
    if (!row[field] || row[field].trim() === '') {
      errors.push(`Missing required field: ${field}`)
    }
  })
  
  // Validate numeric fields
  const numericFields = ['weight_lbs', 'quantity_pcs', 'thickness', 'width', 'length', 'coil_od', 'coil_id', 'length_ft', 'price_override']
  numericFields.forEach(field => {
    if (row[field] && isNaN(parseFloat(row[field]))) {
      errors.push(`Invalid number for ${field}: ${row[field]}`)
    }
  })
  
  // Validate ownership
  if (row.ownership && !['HOUSE_OWNED', 'CUSTOMER_OWNED', 'CONSIGNMENT'].includes(row.ownership.toUpperCase())) {
    warnings.push(`Unknown ownership type: ${row.ownership}`)
  }
  
  // Customer name required for customer-owned
  if (row.ownership?.toUpperCase() === 'CUSTOMER_OWNED' && !row.customer_name) {
    warnings.push('Customer name recommended for customer-owned inventory')
  }
  
  return { errors, warnings }
}

// Generate CSV template content
const generateTemplateCSV = (templateKey) => {
  const template = INVENTORY_TEMPLATES[templateKey]
  if (!template) return ''
  
  const headerLine = template.headers.join(',')
  const exampleLine = template.example.join(',')
  
  return `${headerLine}\n${exampleLine}`
}

// Download template file
const downloadTemplate = (templateKey) => {
  const template = INVENTORY_TEMPLATES[templateKey]
  if (!template) return
  
  const content = generateTemplateCSV(templateKey)
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = template.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function InventoryUpload({ 
  open, 
  onClose, 
  onUpload,
  defaultTemplate = 'coils',
  locationCode = null,
  title = 'Upload Inventory',
}) {
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate)
  const [file, setFile] = useState(null)
  const [parsedData, setParsedData] = useState(null)
  const [validationResults, setValidationResults] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  const handleFileSelect = useCallback((event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return
    
    setFile(selectedFile)
    setUploadResult(null)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target.result
      const { headers, rows } = parseCSV(content)
      
      const template = INVENTORY_TEMPLATES[selectedTemplate]
      
      // Validate each row
      const results = rows.map(row => {
        const { errors, warnings } = validateRow(row, template)
        return {
          row,
          valid: errors.length === 0,
          errors,
          warnings,
        }
      })
      
      setParsedData({ headers, rows })
      setValidationResults(results)
    }
    reader.readAsText(selectedFile)
  }, [selectedTemplate])

  const handleUpload = async () => {
    if (!validationResults) return
    
    const validRows = validationResults.filter(r => r.valid).map(r => r.row)
    if (validRows.length === 0) {
      return
    }
    
    setUploading(true)
    try {
      const result = await onUpload({
        templateType: selectedTemplate,
        items: validRows,
        locationCode,
        totalRows: parsedData.rows.length,
        validRows: validRows.length,
      })
      setUploadResult({
        success: true,
        message: `Successfully uploaded ${result.imported || validRows.length} items`,
        details: result,
      })
      setActiveTab(0) // Reset to template tab
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.message || 'Upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setParsedData(null)
    setValidationResults(null)
    setUploadResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const stats = validationResults ? {
    total: validationResults.length,
    valid: validationResults.filter(r => r.valid).length,
    errors: validationResults.filter(r => !r.valid).length,
    warnings: validationResults.filter(r => r.warnings.length > 0).length,
  } : null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <UploadIcon color="primary" />
            <Typography variant="h6">{title}</Typography>
          </Stack>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent sx={{ p: 0 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab label="1. Select Template" />
          <Tab label="2. Upload File" disabled={!selectedTemplate} />
          <Tab label="3. Review & Import" disabled={!parsedData} />
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* Tab 0: Template Selection */}
          {activeTab === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the type of inventory you want to upload, then download the template.
              </Typography>
              
              <Stack spacing={2}>
                {Object.entries(INVENTORY_TEMPLATES).map(([key, template]) => (
                  <Paper
                    key={key}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: 2,
                      borderColor: selectedTemplate === key ? 'primary.main' : 'transparent',
                      bgcolor: selectedTemplate === key ? alpha('#1976d2', 0.04) : 'background.paper',
                      '&:hover': { bgcolor: alpha('#1976d2', 0.08) },
                      transition: 'all 0.2s',
                    }}
                    onClick={() => setSelectedTemplate(key)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Chip 
                            label={`${template.headers.length} columns`} 
                            size="small" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={`${template.required.length} required`} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        </Stack>
                      </Box>
                      <Tooltip title="Download Template">
                        <IconButton
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadTemplate(key)
                          }}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
              
              <Alert severity="info" sx={{ mt: 3 }} icon={<InfoIcon />}>
                <AlertTitle>Template Tips</AlertTitle>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Required fields are marked with * in the template</li>
                  <li>Use ownership values: HOUSE_OWNED, CUSTOMER_OWNED, or CONSIGNMENT</li>
                  <li>Location codes must match existing locations in the system</li>
                  <li>Weights should be in pounds (lbs)</li>
                </ul>
              </Alert>
            </Box>
          )}
          
          {/* Tab 1: File Upload */}
          {activeTab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload your completed CSV file for <strong>{INVENTORY_TEMPLATES[selectedTemplate]?.name}</strong>
              </Typography>
              
              {!file ? (
                <Paper
                  sx={{
                    p: 6,
                    border: '2px dashed',
                    borderColor: 'divider',
                    borderRadius: 2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#1976d2', 0.02) },
                    transition: 'all 0.2s',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                  <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Drag & drop or click to upload
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Supports CSV files up to 10MB
                  </Typography>
                </Paper>
              ) : (
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <FileIcon color="primary" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {file.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(file.size / 1024).toFixed(1)} KB • {parsedData?.rows?.length || 0} rows detected
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={handleReset}
                      >
                        Remove
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setActiveTab(2)}
                        disabled={!parsedData}
                      >
                        Continue
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadTemplate(selectedTemplate)}
                >
                  Download {INVENTORY_TEMPLATES[selectedTemplate]?.name} Template
                </Button>
              </Box>
            </Box>
          )}
          
          {/* Tab 2: Review & Import */}
          {activeTab === 2 && parsedData && (
            <Box>
              {uploadResult && (
                <Alert 
                  severity={uploadResult.success ? 'success' : 'error'} 
                  sx={{ mb: 2 }}
                  action={
                    <Button color="inherit" size="small" onClick={handleReset}>
                      Upload More
                    </Button>
                  }
                >
                  {uploadResult.message}
                </Alert>
              )}
              
              {!uploadResult && (
                <>
                  {/* Validation Stats */}
                  <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                    <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                      <Typography variant="h4" fontWeight={700}>{stats?.total}</Typography>
                      <Typography variant="body2" color="text.secondary">Total Rows</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: alpha('#4caf50', 0.05) }}>
                      <Typography variant="h4" fontWeight={700} color="success.main">{stats?.valid}</Typography>
                      <Typography variant="body2" color="text.secondary">Valid</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: alpha('#f44336', 0.05) }}>
                      <Typography variant="h4" fontWeight={700} color="error.main">{stats?.errors}</Typography>
                      <Typography variant="body2" color="text.secondary">Errors</Typography>
                    </Paper>
                    <Paper sx={{ p: 2, flex: 1, textAlign: 'center', bgcolor: alpha('#ff9800', 0.05) }}>
                      <Typography variant="h4" fontWeight={700} color="warning.main">{stats?.warnings}</Typography>
                      <Typography variant="body2" color="text.secondary">Warnings</Typography>
                    </Paper>
                  </Stack>
                  
                  {stats?.errors > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {stats.errors} row(s) have errors and will be skipped. Only valid rows will be imported.
                    </Alert>
                  )}
                  
                  {/* Preview Table */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Preview (first 10 rows)</Typography>
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>Row</TableCell>
                          <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>Status</TableCell>
                          {parsedData.headers.slice(0, 6).map(header => (
                            <TableCell key={header} sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
                              {header}
                            </TableCell>
                          ))}
                          <TableCell sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>Issues</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {validationResults?.slice(0, 10).map((result, idx) => (
                          <TableRow 
                            key={idx}
                            sx={{ bgcolor: result.valid ? 'inherit' : alpha('#f44336', 0.05) }}
                          >
                            <TableCell>{result.row._rowNumber}</TableCell>
                            <TableCell>
                              {result.valid ? (
                                <SuccessIcon color="success" fontSize="small" />
                              ) : (
                                <ErrorIcon color="error" fontSize="small" />
                              )}
                            </TableCell>
                            {parsedData.headers.slice(0, 6).map(header => (
                              <TableCell key={header}>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                                  {result.row[header] || '-'}
                                </Typography>
                              </TableCell>
                            ))}
                            <TableCell>
                              {result.errors.length > 0 && (
                                <Tooltip title={result.errors.join(', ')}>
                                  <Chip 
                                    label={`${result.errors.length} error(s)`} 
                                    size="small" 
                                    color="error" 
                                    variant="outlined"
                                  />
                                </Tooltip>
                              )}
                              {result.warnings.length > 0 && (
                                <Tooltip title={result.warnings.join(', ')}>
                                  <Chip 
                                    label={`${result.warnings.length} warning(s)`} 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined"
                                    sx={{ ml: result.errors.length > 0 ? 0.5 : 0 }}
                                  />
                                </Tooltip>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {validationResults?.length > 10 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                      Showing 10 of {validationResults.length} rows
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>
      
      <Divider />
      
      <DialogActions sx={{ p: 2 }}>
        {activeTab > 0 && !uploadResult && (
          <Button onClick={() => setActiveTab(activeTab - 1)}>
            Back
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        {activeTab === 0 && (
          <Button
            variant="contained"
            onClick={() => setActiveTab(1)}
            disabled={!selectedTemplate}
          >
            Continue
          </Button>
        )}
        {activeTab === 2 && !uploadResult && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading || stats?.valid === 0}
            startIcon={uploading ? <RefreshIcon className="spin" /> : <UploadIcon />}
          >
            {uploading ? 'Importing...' : `Import ${stats?.valid} Items`}
          </Button>
        )}
        {uploadResult?.success && (
          <Button variant="contained" onClick={handleClose}>
            Done
          </Button>
        )}
      </DialogActions>
      
      {uploading && <LinearProgress sx={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />}
    </Dialog>
  )
}

// Template download button component for use elsewhere
export function DownloadTemplateButton({ templateKey = 'coils', variant = 'outlined', size = 'medium' }) {
  const template = INVENTORY_TEMPLATES[templateKey]
  if (!template) return null
  
  return (
    <Button
      variant={variant}
      size={size}
      startIcon={<DownloadIcon />}
      onClick={() => downloadTemplate(templateKey)}
    >
      Download {template.name} Template
    </Button>
  )
}

// Quick access to all templates
export function TemplateDownloadList() {
  return (
    <Stack spacing={1}>
      {Object.entries(INVENTORY_TEMPLATES).map(([key, template]) => (
        <Button
          key={key}
          variant="text"
          size="small"
          startIcon={<TemplateIcon />}
          onClick={() => downloadTemplate(key)}
          sx={{ justifyContent: 'flex-start' }}
        >
          {template.name} Template
        </Button>
      ))}
    </Stack>
  )
}
