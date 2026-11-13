/**
 * Wraps a screen that is a design sample: it shows example figures, not the
 * company's records, because the server side has not been built. The notice
 * stays on screen so nobody acts on an example as if it were real.
 * Remove the wrapper when the screen reads real data.
 */
import { Alert, AlertTitle, Box } from '@mui/material'

export default function SampleScreen({ what, children }) {
  return (
    <Box>
      <Alert severity="warning" variant="filled" role="status" sx={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 5 }}>
        <AlertTitle sx={{ mb: 0 }}>Sample screen: these are example figures, not your records</AlertTitle>
        {what} is not connected yet. Nothing shown here comes from your suppliers, receipts or inspections, and nothing entered here is saved.
      </Alert>
      {children}
    </Box>
  )
}
