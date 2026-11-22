/**
 * Proof of delivery for one shipment, from what is on file: when it was delivered, who signed, the image if one
 * was stored, or the reason none was taken, with the shipment's status history.
 * (Before 2026-11-22 this screen showed a made-up delivery.)
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, Chip, CircularProgress, Divider, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import client from '../../api/client'
import { podSummary, routeLine } from './freightView'

const when = (d) => (d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'Not on file')

const Fact = ({ label, children, testid }) => (
  <Box sx={{ minWidth: 180 }}>
    <Typography variant="caption" color="text.secondary">{label}</Typography>
    <Typography variant="body1" data-testid={testid}>{children}</Typography>
  </Box>
)

export default function PODViewer() {
  const { shipmentId } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ shipment: null, loading: true, error: null })
  const [imageError, setImageError] = useState(null)

  const load = useCallback(async () => {
    setState({ shipment: null, loading: true, error: null })
    try {
      const res = await client.get(`/shipments/${shipmentId}`)
      setState({ shipment: res.data, loading: false, error: null })
    } catch (e) {
      // A failed load shows nothing and says so; no delivery is invented.
      setState({ shipment: null, loading: false, error: e.response?.status === 404 ? 'There is no shipment with this number on file.' : e.response?.data?.error || 'The shipment could not be loaded.' })
    }
  }, [shipmentId])
  useEffect(() => { load() }, [load])

  // An https image opens as it is. A stored document needs the person's sign-in, so it is fetched first.
  const openImage = async (url) => {
    setImageError(null)
    if (/^https:\/\//.test(url)) { window.open(url, '_blank', 'noopener'); return }
    try {
      const res = await client.get(url.replace(/^\/api/, ''), { responseType: 'blob' })
      window.open(URL.createObjectURL(res.data), '_blank', 'noopener')
    } catch {
      setImageError('The stored image could not be opened.')
    }
  }

  const { shipment: s, loading, error } = state
  const pod = podSummary(s)

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography component="h1" variant="h5" fontWeight={700}>Proof of delivery</Typography>
          <Typography variant="body2" color="text.secondary">What is on file for this delivery. Deliveries are recorded on the Shipping screen.</Typography>
        </Box>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/freight/tracking')}>Tracking Board</Button>
      </Stack>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress aria-label="Loading the shipment" /></Box>}
      {error && <Alert severity="error" data-testid="pod-error">{error}</Alert>}

      {s && (
        <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
              <Fact label="Shipment" testid="pod-shipment">{s.shipmentNumber}</Fact>
              <Fact label="Order">{s.order?.orderNumber || 'Not on file'}</Fact>
              <Fact label="Customer">{s.order?.buyer?.name || 'No customer on file'}</Fact>
              <Fact label="Route">{routeLine(s)}</Fact>
              <Fact label="Carrier">{s.carrierName || 'None on file'}</Fact>
            </Stack>
            <Box sx={{ mt: 2 }}><Button size="small" variant="outlined" onClick={() => navigate(`/shipping/${s.id}`)}>Open the shipment</Button></Box>
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }} data-testid="pod-proof" data-state={pod.state}>
            {pod.state === 'NOT_DELIVERED' && <Alert severity="info">This shipment has not been delivered, so there is no proof of delivery yet.</Alert>}
            {pod.state === 'MISSING' && <Alert severity="warning">Delivered {when(s.deliveredAt)} with no name, no image and no reason on file.</Alert>}
            {pod.state === 'REASON' && (
              <Stack spacing={1}>
                <Chip size="small" color="warning" label="No proof taken" sx={{ alignSelf: 'flex-start' }} />
                <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
                  <Fact label="Delivered" testid="pod-delivered">{when(s.deliveredAt)}</Fact>
                  <Fact label="Reason given" testid="pod-reason">{pod.reason}</Fact>
                </Stack>
              </Stack>
            )}
            {pod.state === 'PROOF' && (
              <Stack spacing={1}>
                <Chip size="small" color="success" label="Proof on file" sx={{ alignSelf: 'flex-start' }} />
                <Stack direction="row" spacing={4} flexWrap="wrap" useFlexGap>
                  <Fact label="Delivered" testid="pod-delivered">{when(s.deliveredAt)}</Fact>
                  <Fact label="Signed for by" testid="pod-signed-by">{pod.signedBy || 'No name on file'}</Fact>
                  <Fact label="Image">{pod.image ? <Button size="small" onClick={() => openImage(pod.image)} data-testid="pod-image">Open the image</Button> : 'No image on file'}</Fact>
                </Stack>
                {imageError && <Alert severity="error">{imageError}</Alert>}
              </Stack>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="subtitle1" fontWeight={700}>Status history</Typography>
            <Divider sx={{ my: 1 }} />
            {(s.history || []).length === 0 ? (
              <Typography variant="body2" color="text.secondary">No status change is on file.</Typography>
            ) : (
              <Table size="small" data-testid="pod-history">
                <TableHead><TableRow><TableCell>When</TableCell><TableCell>Change</TableCell><TableCell>By</TableCell><TableCell>Note</TableCell></TableRow></TableHead>
                <TableBody>
                  {s.history.map((h, i) => (
                    <TableRow key={`${h.timestamp}-${i}`} data-testid="pod-history-row">
                      <TableCell>{when(h.timestamp)}</TableCell>
                      <TableCell>{[h.from, h.to].filter(Boolean).join(' to ')}</TableCell>
                      <TableCell>{h.by || 'Not on file'}</TableCell>
                      <TableCell>{h.note || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </Stack>
      )}
    </Box>
  )
}
