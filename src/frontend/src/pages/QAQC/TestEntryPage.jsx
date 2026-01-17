import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  TextField,
  MenuItem,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
} from '@mui/material'
import {
  Save as SaveIcon,
  CheckCircle as PassIcon,
  Cancel as FailIcon,
} from '@mui/icons-material'

export default function TestEntryPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    unit: null,
    testType: '',
    result: '',
    notes: '',
    // Test-specific values
    yieldStrength: '',
    tensileStrength: '',
    elongation: '',
    hardness: '',
  })

  // Mock data
  const mockUnits = [
    { id: 1, unitNumber: 'U-2024-0010', heatNumber: 'HT-2024-005', grade: 'A36' },
    { id: 2, unitNumber: 'U-2024-0011', heatNumber: 'HT-2024-005', grade: 'A36' },
    { id: 3, unitNumber: 'U-2024-0012', heatNumber: 'HT-2024-006', grade: 'A572-50' },
  ]

  const testTypes = [
    { value: 'TENSILE', label: 'Tensile Test' },
    { value: 'HARDNESS', label: 'Hardness Test' },
    { value: 'CHEMISTRY', label: 'Chemistry Analysis' },
    { value: 'DIMENSIONAL', label: 'Dimensional Inspection' },
    { value: 'VISUAL', label: 'Visual Inspection' },
  ]

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = () => {
    console.log('Submitting test results:', formData)
    // TODO: Submit to API
    navigate('/qaqc')
  }

  const renderTestFields = () => {
    switch (formData.testType) {
      case 'TENSILE':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Yield Strength (psi)"
                type="number"
                fullWidth
                value={formData.yieldStrength}
                onChange={(e) => handleChange('yieldStrength', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Tensile Strength (psi)"
                type="number"
                fullWidth
                value={formData.tensileStrength}
                onChange={(e) => handleChange('tensileStrength', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Elongation (%)"
                type="number"
                fullWidth
                value={formData.elongation}
                onChange={(e) => handleChange('elongation', e.target.value)}
              />
            </Grid>
          </Grid>
        )
      case 'HARDNESS':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Hardness Value"
                type="number"
                fullWidth
                value={formData.hardness}
                onChange={(e) => handleChange('hardness', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Scale"
                select
                fullWidth
                defaultValue="HRB"
              >
                <MenuItem value="HRB">Rockwell B (HRB)</MenuItem>
                <MenuItem value="HRC">Rockwell C (HRC)</MenuItem>
                <MenuItem value="BHN">Brinell (BHN)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        )
      case 'DIMENSIONAL':
        return (
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField label="Width (in)" type="number" fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Gauge (in)" type="number" fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="OD (in)" type="number" fullWidth />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="ID (in)" type="number" fullWidth />
            </Grid>
          </Grid>
        )
      default:
        return null
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600}>
            Test Entry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Record quality control test results
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => navigate('/qaqc')}>
            Cancel
          </Button>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSubmit}>
            Save Results
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {/* Unit Selection */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Select Unit</Typography>
            <Autocomplete
              options={mockUnits}
              getOptionLabel={(option) => `${option.unitNumber} - ${option.grade}`}
              value={formData.unit}
              onChange={(e, newValue) => handleChange('unit', newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Unit Number" placeholder="Search by unit number..." />
              )}
              renderOption={(props, option) => (
                <li {...props}>
                  <Box>
                    <Typography variant="body1">{option.unitNumber}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Heat: {option.heatNumber} | Grade: {option.grade}
                    </Typography>
                  </Box>
                </li>
              )}
            />
          </Paper>

          {/* Test Type & Values */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Test Details</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Test Type"
                  select
                  fullWidth
                  value={formData.testType}
                  onChange={(e) => handleChange('testType', e.target.value)}
                >
                  {testTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Test Date"
                  type="datetime-local"
                  fullWidth
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            {formData.testType && (
              <Box sx={{ mt: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle2" gutterBottom>Test Values</Typography>
                {renderTestFields()}
              </Box>
            )}
          </Paper>

          {/* Result & Notes */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Result</Typography>
            
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Test Result</FormLabel>
              <RadioGroup
                row
                value={formData.result}
                onChange={(e) => handleChange('result', e.target.value)}
              >
                <FormControlLabel 
                  value="PASS" 
                  control={<Radio color="success" />} 
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PassIcon color="success" />
                      <span>Pass</span>
                    </Stack>
                  }
                />
                <FormControlLabel 
                  value="FAIL" 
                  control={<Radio color="error" />} 
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <FailIcon color="error" />
                      <span>Fail</span>
                    </Stack>
                  }
                />
              </RadioGroup>
            </FormControl>

            <TextField
              label="Notes / Observations"
              multiline
              rows={4}
              fullWidth
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Enter any additional notes or observations..."
            />
          </Paper>
        </Grid>

        {/* Sidebar - Unit Info */}
        <Grid item xs={12} md={4}>
          {formData.unit && (
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" gutterBottom>Unit Information</Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Unit Number</Typography>
                  <Typography variant="body1" fontWeight={600}>{formData.unit.unitNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Heat Number</Typography>
                  <Typography variant="body1">{formData.unit.heatNumber}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Grade</Typography>
                  <Typography variant="body1">{formData.unit.grade}</Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">Specification Requirements</Typography>
                  <Typography variant="body2">
                    {formData.unit.grade === 'A36' && 'Min YS: 36,000 psi | Min TS: 58,000 psi'}
                    {formData.unit.grade === 'A572-50' && 'Min YS: 50,000 psi | Min TS: 65,000 psi'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
