import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Avatar,
  Collapse,
  LinearProgress,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  AutoAwesome as AiIcon,
  Email as EmailIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  ContentPaste as PasteIcon,
} from '@mui/icons-material';
import { createRfq } from '../../services/rfqApi';
import { searchContacts } from '../../services/contactApi';
import { parseEmailRfq } from '../../services/aiOrderHubApi';

const COMMODITIES = ['METALS', 'PLASTICS', 'SUPPLIES'];
const FORMS = ['PLATE', 'SHEET', 'BAR', 'TUBE', 'PIPE', 'ANGLE', 'CHANNEL', 'BEAM', 'ROD'];
const CHANNELS = ['PHONE', 'EMAIL', 'WEB', 'PORTAL'];

const emptyLine = {
  commodity: 'METALS',
  form: 'PLATE',
  grade: '',
  thickness: '',
  width: '',
  length: '',
  quantity: 1,
  notes: '',
};

export default function RfqCreatePage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Contact state
  const [contactSearch, setContactSearch] = useState('');
  const [contactResults, setContactResults] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [newContact, setNewContact] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
  });

  // RFQ header state
  const [channel, setChannel] = useState('PHONE');
  const [requestedDueDate, setRequestedDueDate] = useState('');

  // Lines state
  const [lines, setLines] = useState([{ ...emptyLine, id: 1 }]);

  // AI Panel state
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [aiParsing, setAiParsing] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // Contact search
  const handleContactSearch = async () => {
    if (!contactSearch) return;
    try {
      const results = await searchContacts({ email: contactSearch });
      setContactResults(results);
    } catch (err) {
      console.error('Contact search failed:', err);
    }
  };

  const selectContact = (contact) => {
    setSelectedContact(contact);
    setNewContact({
      companyName: contact.companyName || '',
      contactName: contact.contactName || '',
      email: contact.email || '',
      phone: contact.phone || '',
    });
    setContactResults([]);
  };

  // Line management
  const addLine = () => {
    setLines([...lines, { ...emptyLine, id: Date.now() }]);
  };

  const removeLine = (id) => {
    if (lines.length > 1) {
      setLines(lines.filter((l) => l.id !== id));
    }
  };

  const updateLine = (id, field, value) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  };

  // AI Email Parsing
  const handleAiParse = async () => {
    if (!emailContent.trim()) return;
    setAiParsing(true);
    setAiResult(null);
    setError(null);
    try {
      const result = await parseEmailRfq({
        emailSubject: '',
        emailBody: emailContent,
        attachmentsText: [],
      });
      setAiResult(result);

      // Auto-fill form with parsed data
      // New API returns data directly at top level (not nested in parsedRfq)
      const parsed = result;
      if (parsed.contact) {
        setNewContact({
          companyName: parsed.contact.companyName || newContact.companyName,
          contactName: parsed.contact.contactName || newContact.contactName,
          email: parsed.contact.email || newContact.email,
          phone: parsed.contact.phone || newContact.phone,
        });
      }
      if (parsed.channel) {
        setChannel(parsed.channel);
      }
      if (parsed.requestedDueDate) {
        setRequestedDueDate(parsed.requestedDueDate);
      }
      if (parsed.lines && parsed.lines.length > 0) {
        setLines(
          parsed.lines.map((l, idx) => ({
            id: Date.now() + idx,
            commodity: l.commodity || 'METALS',
            form: l.form || 'PLATE',
            grade: l.grade || '',
            thickness: l.thickness || '',
            width: l.width || '',
            length: l.length || '',
            quantity: l.quantity || 1,
            notes: l.notes || '',
          }))
        );
      }
    } catch (err) {
      setError('AI parsing failed: ' + err.message);
    } finally {
      setAiParsing(false);
    }
  };

  // Submit RFQ
  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        contact: selectedContact
          ? { id: selectedContact.id }
          : {
              companyName: newContact.companyName,
              contactName: newContact.contactName,
              email: newContact.email,
              phone: newContact.phone,
            },
        channel,
        requestedDueDate: requestedDueDate || null,
        lines: lines.map((l) => ({
          commodity: l.commodity,
          form: l.form,
          grade: l.grade || null,
          thickness: l.thickness ? parseFloat(l.thickness) : null,
          width: l.width ? parseFloat(l.width) : null,
          length: l.length ? parseFloat(l.length) : null,
          quantity: parseInt(l.quantity) || 1,
          notes: l.notes || null,
        })),
      };

      const created = await createRfq(payload);
      setSuccess('RFQ created successfully!');
      setTimeout(() => {
        navigate(`/orderhub/rfq/${created.id}`);
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/orderhub')}>
          <BackIcon />
        </IconButton>
        <Typography variant="h5" fontWeight={700}>
          Create New RFQ
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2}>
        {/* Main Form */}
        <Grid item xs={12} md={8}>
          {/* Contact Section */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="Contact Information"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  label="Search existing contact"
                  placeholder="Enter email..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleContactSearch()}
                  sx={{ flex: 1 }}
                />
                <Button variant="outlined" onClick={handleContactSearch}>
                  Search
                </Button>
              </Stack>

              {contactResults.length > 0 && (
                <Paper variant="outlined" sx={{ mb: 2, maxHeight: 150, overflow: 'auto' }}>
                  {contactResults.map((c) => (
                    <Box
                      key={c.id}
                      sx={{
                        p: 1,
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                      onClick={() => selectContact(c)}
                    >
                      <Typography variant="body2" fontWeight={600}>
                        {c.companyName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {c.contactName} • {c.email}
                      </Typography>
                    </Box>
                  ))}
                </Paper>
              )}

              {selectedContact && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Using existing contact: {selectedContact.companyName}
                  <Button size="small" onClick={() => setSelectedContact(null)} sx={{ ml: 2 }}>
                    Clear
                  </Button>
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Company Name"
                    value={newContact.companyName}
                    onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
                    disabled={!!selectedContact}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Contact Name"
                    value={newContact.contactName}
                    onChange={(e) => setNewContact({ ...newContact, contactName: e.target.value })}
                    disabled={!!selectedContact}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    disabled={!!selectedContact}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Phone"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    disabled={!!selectedContact}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* RFQ Header */}
          <Card sx={{ mb: 2 }}>
            <CardHeader
              title="RFQ Details"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              sx={{ pb: 0 }}
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Channel</InputLabel>
                    <Select value={channel} label="Channel" onChange={(e) => setChannel(e.target.value)}>
                      {CHANNELS.map((ch) => (
                        <MenuItem key={ch} value={ch}>
                          {ch}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Requested Due Date"
                    type="date"
                    value={requestedDueDate}
                    onChange={(e) => setRequestedDueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader
              title="Line Items"
              titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              action={
                <Button size="small" startIcon={<AddIcon />} onClick={addLine}>
                  Add Line
                </Button>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ p: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 600 }}>Commodity</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Form</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Grade</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Thick</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Width</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Length</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <Select
                            size="small"
                            value={line.commodity}
                            onChange={(e) => updateLine(line.id, 'commodity', e.target.value)}
                            sx={{ minWidth: 90 }}
                          >
                            {COMMODITIES.map((c) => (
                              <MenuItem key={c} value={c}>
                                {c}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            size="small"
                            value={line.form}
                            onChange={(e) => updateLine(line.id, 'form', e.target.value)}
                            sx={{ minWidth: 80 }}
                          >
                            {FORMS.map((f) => (
                              <MenuItem key={f} value={f}>
                                {f}
                              </MenuItem>
                            ))}
                          </Select>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={line.grade}
                            onChange={(e) => updateLine(line.id, 'grade', e.target.value)}
                            placeholder="A36, 304..."
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.thickness}
                            onChange={(e) => updateLine(line.id, 'thickness', e.target.value)}
                            placeholder="0.25"
                            sx={{ width: 70 }}
                            InputProps={{ endAdornment: <InputAdornment position="end">"</InputAdornment> }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.width}
                            onChange={(e) => updateLine(line.id, 'width', e.target.value)}
                            placeholder="48"
                            sx={{ width: 70 }}
                            InputProps={{ endAdornment: <InputAdornment position="end">"</InputAdornment> }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.length}
                            onChange={(e) => updateLine(line.id, 'length', e.target.value)}
                            placeholder="96"
                            sx={{ width: 70 }}
                            InputProps={{ endAdornment: <InputAdornment position="end">"</InputAdornment> }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={line.quantity}
                            onChange={(e) => updateLine(line.id, 'quantity', e.target.value)}
                            sx={{ width: 60 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={line.notes}
                            onChange={(e) => updateLine(line.id, 'notes', e.target.value)}
                            placeholder="Notes..."
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeLine(line.id)}
                            disabled={lines.length === 1}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Actions */}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => navigate('/orderhub')}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save RFQ'}
            </Button>
          </Box>
        </Grid>

        {/* AI Assistant Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader
              avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}><AiIcon /></Avatar>}
              title="AI Assistant"
              subheader="Parse email content to RFQ"
              action={
                <IconButton onClick={() => setAiPanelOpen(!aiPanelOpen)}>
                  {aiPanelOpen ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              }
              sx={{ cursor: 'pointer' }}
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
            />
            <Collapse in={aiPanelOpen}>
              <Divider />
              <CardContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Paste email content below and let AI extract RFQ details automatically.
                </Typography>
                <TextField
                  multiline
                  rows={8}
                  fullWidth
                  placeholder="Paste email content here...&#10;&#10;Example:&#10;Hi, I need a quote for 10 pcs of 1/4&quot; x 48&quot; x 96&quot; A36 plate.&#10;&#10;Thanks,&#10;John Smith&#10;Acme Corp&#10;john@acme.com"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  color="secondary"
                  startIcon={<AiIcon />}
                  onClick={handleAiParse}
                  disabled={aiParsing || !emailContent.trim()}
                >
                  {aiParsing ? 'Parsing...' : 'Parse with AI'}
                </Button>

                {aiParsing && <LinearProgress sx={{ mt: 2 }} />}

                {aiResult && (
                  <Box sx={{ mt: 2 }}>
                    <Alert
                      severity={aiResult.parseMeta?.confidence > 0.7 ? 'success' : 'warning'}
                      sx={{ mb: 1 }}
                    >
                      Confidence: {Math.round((aiResult.parseMeta?.confidence || 0) * 100)}%
                    </Alert>
                    {aiResult.parseMeta?.assumptions?.map((note, idx) => (
                      <Typography key={`a-${idx}`} variant="caption" display="block" color="text.secondary">
                        💡 {note}
                      </Typography>
                    ))}
                    {aiResult.parseMeta?.warnings?.map((warn, idx) => (
                      <Typography key={`w-${idx}`} variant="caption" display="block" color="warning.main">
                        ⚠️ {warn}
                      </Typography>
                    ))}
                    {aiResult.lines?.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          ✅ Extracted {aiResult.lines.length} line(s)
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Collapse>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
