import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  TextField,
  FormControlLabel,
  Checkbox,
  Alert,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
} from '@mui/material'
import {
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UncheckedIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Security as SecurityIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  QrCode as QRIcon,
  PhotoCamera as CameraIcon,
  Print as PrintIcon,
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material'

// Mock Check-In Data (simulates a visitor going through check-in)
const mockVisitorData = {
  name: 'John Smith',
  company: 'ABC Electric',
  type: 'ELECTRICAL_CONTRACTOR',
  purpose: 'Panel maintenance - Saw Line',
  sponsor: 'Mike Johnson',
  scheduledDate: '2026-02-04',
  scheduledTime: '08:00 - 17:00',
  areas: ['Electrical Room A', 'Panel 7B'],
  requirements: {
    orientation: true,
    insurance: true,
    safetyRules: true,
    jha: true,
    permit: true,
  },
  permits: ['LOTO-26-0089'],
  ppeRequired: ['Safety Glasses', 'Steel-Toe Boots', 'High-Vis Vest', 'Arc Flash PPE (Cat 2)'],
}

const siteAlerts = [
  { type: 'warning', message: 'Hot work in Bay 3 - avoid area until 4pm' },
  { type: 'info', message: 'Fire drill scheduled for 3pm today' },
  { type: 'info', message: 'Crane lift at 2pm - Zone B restricted' },
]

export default function CheckInKiosk() {
  const [activeStep, setActiveStep] = useState(0)
  const [confirmations, setConfirmations] = useState({
    identity: false,
    ppeConfirmed: false,
    rulesAccepted: false,
    alertsAcknowledged: false,
  })
  const [checkInComplete, setCheckInComplete] = useState(false)
  const [badgeNumber, setBadgeNumber] = useState(null)

  const steps = [
    { label: 'Identification', description: 'Verify your identity' },
    { label: 'Requirements Check', description: 'Confirm all requirements met' },
    { label: 'Site Alerts', description: 'Review today\'s safety alerts' },
    { label: 'PPE Confirmation', description: 'Confirm you have required PPE' },
    { label: 'Badge Issuance', description: 'Collect your badge' },
  ]

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      setCheckInComplete(true)
      setBadgeNumber(`C-2026-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`)
    } else {
      setActiveStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prev) => prev - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
    setConfirmations({
      identity: false,
      ppeConfirmed: false,
      rulesAccepted: false,
      alertsAcknowledged: false,
    })
    setCheckInComplete(false)
    setBadgeNumber(null)
  }

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return confirmations.identity
      case 1:
        return true // All requirements already met
      case 2:
        return confirmations.alertsAcknowledged
      case 3:
        return confirmations.ppeConfirmed
      case 4:
        return true
      default:
        return false
    }
  }

  if (checkInComplete) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'success.lighter',
          p: 4,
        }}
      >
        <Paper sx={{ p: 6, textAlign: 'center', maxWidth: 600 }}>
          <Avatar sx={{ width: 80, height: 80, bgcolor: 'success.main', mx: 'auto', mb: 3 }}>
            <CheckIcon sx={{ fontSize: 48 }} />
          </Avatar>
          <Typography variant="h3" sx={{ fontWeight: 700, color: 'success.main', mb: 2 }}>
            Check-In Complete
          </Typography>
          <Typography variant="body1" sx={{ mb: 4 }}>
            Welcome, <strong>{mockVisitorData.name}</strong>!
          </Typography>

          <Paper sx={{ p: 3, bgcolor: 'grey.100', mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Badge
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontWeight: 700, fontFamily: 'monospace', color: 'primary.main' }}
            >
              {badgeNumber}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Valid until: Today 5:00 PM
            </Typography>
          </Paper>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" gutterBottom>
              Authorized Areas
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              {mockVisitorData.areas.map((area, idx) => (
                <Chip key={idx} label={area} color="primary" variant="outlined" />
              ))}
            </Box>
          </Box>

          {mockVisitorData.permits.length > 0 && (
            <Alert severity="warning" sx={{ mb: 4, textAlign: 'left' }}>
              <strong>Active Permits:</strong> {mockVisitorData.permits.join(', ')}
              <br />
              Ensure permit is activated before starting work.
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
            <strong>Sponsor:</strong> {mockVisitorData.sponsor}
            <br />
            Your badge is printing. Please collect it from the printer.
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button variant="outlined" startIcon={<PrintIcon />}>
              Reprint Badge
            </Button>
            <Button variant="contained" onClick={handleReset}>
              New Check-In
            </Button>
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 4 }}>
      <Box sx={{ maxWidth: 800, mx: 'auto', px: 2 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Contractor Check-In
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Complete all steps to receive your visitor badge
          </Typography>
        </Paper>

        {/* Progress */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label}>
                <StepLabel>
                  <Typography variant="subtitle1" sx={{ fontWeight: index === activeStep ? 700 : 400 }}>
                    {step.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ py: 2 }}>
                    {/* Step 0: Identification */}
                    {index === 0 && (
                      <Box>
                        <Card sx={{ mb: 3 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                              <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>
                                <PersonIcon fontSize="large" />
                              </Avatar>
                              <Box>
                                <Typography variant="h6">{mockVisitorData.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {mockVisitorData.company}
                                </Typography>
                                <Chip label="Electrical Contractor" color="error" size="small" sx={{ mt: 0.5 }} />
                              </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Purpose</Typography>
                                <Typography variant="body2">{mockVisitorData.purpose}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Sponsor</Typography>
                                <Typography variant="body2">{mockVisitorData.sponsor}</Typography>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={confirmations.identity}
                              onChange={(e) =>
                                setConfirmations((prev) => ({ ...prev, identity: e.target.checked }))
                              }
                            />
                          }
                          label="I confirm this is me and the information above is correct"
                        />
                      </Box>
                    )}

                    {/* Step 1: Requirements Check */}
                    {index === 1 && (
                      <Box>
                        <Alert severity="success" sx={{ mb: 2 }}>
                          All requirements have been verified and approved.
                        </Alert>
                        <List dense>
                          {Object.entries(mockVisitorData.requirements).map(([key, completed]) => (
                            <ListItem key={key}>
                              <ListItemIcon>
                                {completed ? (
                                  <CheckIcon color="success" />
                                ) : (
                                  <UncheckedIcon color="disabled" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                                secondary={completed ? 'Complete' : 'Incomplete'}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* Step 2: Site Alerts */}
                    {index === 2 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Today's Site Alerts
                        </Typography>
                        {siteAlerts.map((alert, idx) => (
                          <Alert key={idx} severity={alert.type} sx={{ mb: 1 }}>
                            {alert.message}
                          </Alert>
                        ))}
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Your Permitted Areas
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {mockVisitorData.areas.map((area, idx) => (
                              <Chip key={idx} label={area} color="primary" />
                            ))}
                          </Box>
                        </Box>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={confirmations.alertsAcknowledged}
                              onChange={(e) =>
                                setConfirmations((prev) => ({
                                  ...prev,
                                  alertsAcknowledged: e.target.checked,
                                }))
                              }
                            />
                          }
                          label="I understand and acknowledge today's site alerts"
                          sx={{ mt: 2 }}
                        />
                      </Box>
                    )}

                    {/* Step 3: PPE Confirmation */}
                    {index === 3 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Required Personal Protective Equipment
                        </Typography>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          You MUST wear the following PPE at all times in production areas.
                        </Alert>
                        <List>
                          {mockVisitorData.ppeRequired.map((ppe, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <SecurityIcon color="warning" />
                              </ListItemIcon>
                              <ListItemText primary={ppe} />
                            </ListItem>
                          ))}
                        </List>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={confirmations.ppeConfirmed}
                              onChange={(e) =>
                                setConfirmations((prev) => ({
                                  ...prev,
                                  ppeConfirmed: e.target.checked,
                                }))
                              }
                            />
                          }
                          label="I confirm I have all required PPE and will wear it at all times"
                          sx={{ mt: 2 }}
                        />
                      </Box>
                    )}

                    {/* Step 4: Badge Issuance */}
                    {index === 4 && (
                      <Box sx={{ textAlign: 'center' }}>
                        <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', mx: 'auto', mb: 2 }}>
                          <BadgeIcon sx={{ fontSize: 48 }} />
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                          Ready to Issue Badge
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Click "Complete Check-In" to print your visitor badge.
                        </Typography>
                        <Alert severity="info">
                          Your badge will be printed at the lobby printer. Please collect it before
                          proceeding to your work area.
                        </Alert>
                      </Box>
                    )}
                  </Box>

                  {/* Navigation Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    {index > 0 && (
                      <Button variant="outlined" startIcon={<BackIcon />} onClick={handleBack}>
                        Back
                      </Button>
                    )}
                    <Button
                      variant="contained"
                      endIcon={index === steps.length - 1 ? <CheckIcon /> : <NextIcon />}
                      onClick={handleNext}
                      disabled={!canProceed()}
                    >
                      {index === steps.length - 1 ? 'Complete Check-In' : 'Continue'}
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* Footer */}
        <Paper sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Need help? Contact the front desk or call ext. 100
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
