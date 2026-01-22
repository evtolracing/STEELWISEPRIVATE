/**
 * Inventory AI Assistant Panel
 * Right-side panel for natural language inventory queries
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Psychology as AiIcon,
  Send as SendIcon,
  Lightbulb as SuggestionIcon,
  Inventory as InventoryIcon,
  LocalShipping as TransferIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon,
  QrCodeScanner as RfidIcon,
} from '@mui/icons-material';
import { askInventoryAssistant } from '../services/inventoryAiApi';

const QUICK_PROMPTS = [
  'Where is RFID-HR-001-A7F3?',
  'Find JAX-SS-2024-00056',
  'Where is SS-304 available?',
  'Recent RFID scans',
  'Show remnant inventory',
  'Inventory summary',
];

export default function InventoryAiAssistantPanel({ context = {}, onActionClick }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showData, setShowData] = useState(true);

  const handleAsk = async (questionText) => {
    const question = questionText || query;
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await askInventoryAssistant({
        query: question,
        context,
      });

      setResponse(result);
      setHistory(prev => [
        { query: question, response: result, timestamp: new Date() },
        ...prev.slice(0, 9), // Keep last 10
      ]);
      setQuery('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const handleActionClick = (action) => {
    if (onActionClick) {
      onActionClick(action);
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case 'SUGGEST_TRANSFER':
      case 'SEARCH_TRANSFERS':
        return <TransferIcon fontSize="small" />;
      case 'CREATE_REORDER':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'VIEW_REMNANTS':
        return <InventoryIcon fontSize="small" />;
      default:
        return <SuggestionIcon fontSize="small" />;
    }
  };

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.50',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <AiIcon />
        <Typography variant="h6" fontWeight={600}>
          Inventory Assistant
        </Typography>
      </Box>

      {/* Quick Prompts */}
      <Box sx={{ p: 1.5, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Quick questions:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {QUICK_PROMPTS.map((prompt) => (
            <Chip
              key={prompt}
              label={prompt}
              size="small"
              variant="outlined"
              onClick={() => handleAsk(prompt)}
              sx={{ cursor: 'pointer', fontSize: '0.7rem' }}
            />
          ))}
        </Box>
      </Box>

      {/* Response Area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {response && !loading && (
          <Stack spacing={2}>
            {/* Answer */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {response.answer}
                </Typography>
              </CardContent>
            </Card>

            {/* Actions */}
            {response.actions && response.actions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Suggested Actions
                </Typography>
                <Stack spacing={1}>
                  {response.actions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant="outlined"
                      size="small"
                      startIcon={getActionIcon(action.type)}
                      onClick={() => handleActionClick(action)}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Supporting Data */}
            {response.supportingData && (
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowData(!showData)}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Details
                  </Typography>
                  <IconButton size="small">
                    {showData ? <CollapseIcon /> : <ExpandIcon />}
                  </IconButton>
                </Box>
                <Collapse in={showData}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      mt: 1,
                      bgcolor: 'grey.100',
                      maxHeight: 300,
                      overflowY: 'auto',
                    }}
                  >
                    {/* Availability by Location */}
                    {response.supportingData.availabilityByLocation && (
                      <List dense disablePadding>
                        {response.supportingData.availabilityByLocation.map((item, idx) => (
                          <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <InventoryIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={item.location}
                              secondary={`${item.quantity.toLocaleString()} ${item.unit}${item.isRemnant ? ' (Remnant)' : ''}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {/* Pending Transfers */}
                    {response.supportingData.pendingTransfers && (
                      <List dense disablePadding>
                        {response.supportingData.pendingTransfers.map((t, idx) => (
                          <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <TransferIcon fontSize="small" color="info" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${t.from} → ${t.to}`}
                              secondary={`${t.material}: ${t.quantity.toLocaleString()} (${t.status})`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {/* Low Stock Items */}
                    {response.supportingData.lowStockItems && (
                      <List dense disablePadding>
                        {response.supportingData.lowStockItems.map((item, idx) => (
                          <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <WarningIcon fontSize="small" color="warning" />
                            </ListItemIcon>
                            <ListItemText
                              primary={item.materialCode}
                              secondary={`${item.location}: ${item.quantity.toLocaleString()}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {/* Remnants */}
                    {response.supportingData.remnants && (
                      <List dense disablePadding>
                        {response.supportingData.remnants.map((item, idx) => (
                          <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <InventoryIcon fontSize="small" color="secondary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={item.materialCode}
                              secondary={`${item.location}: ${item.quantity.toLocaleString()}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}

                    {/* Summary Stats */}
                    {response.supportingData.totalUnits !== undefined && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Total Units: {response.supportingData.totalUnits} |
                          Quantity: {response.supportingData.totalQuantity?.toLocaleString()} |
                          Materials: {response.supportingData.uniqueMaterials} |
                          Locations: {response.supportingData.uniqueLocations}
                        </Typography>
                      </Box>
                    )}

                    {/* Transfer Suggestions */}
                    {response.supportingData.transferSuggestions && (
                      <List dense disablePadding>
                        {response.supportingData.transferSuggestions.map((s, idx) => (
                          <ListItem key={idx} disablePadding sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <TransferIcon fontSize="small" color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`${s.fromLocation} → ${s.toLocation}`}
                              secondary={`${s.materialCode}: ${s.suggestedQuantity.toLocaleString()} suggested`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Paper>
                </Collapse>
              </Box>
            )}
          </Stack>
        )}

        {/* Empty State */}
        {!response && !loading && !error && (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <AiIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body2">
              Ask me about inventory availability, transfers, or stock levels
            </Typography>
          </Box>
        )}
      </Box>

      {/* History Toggle */}
      {history.length > 0 && (
        <Box sx={{ px: 2, py: 1, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            size="small"
            onClick={() => setShowHistory(!showHistory)}
            endIcon={showHistory ? <CollapseIcon /> : <ExpandIcon />}
          >
            History ({history.length})
          </Button>
          <Collapse in={showHistory}>
            <List dense sx={{ maxHeight: 150, overflowY: 'auto' }}>
              {history.map((item, idx) => (
                <ListItem
                  key={idx}
                  button
                  onClick={() => handleAsk(item.query)}
                  sx={{ py: 0.5 }}
                >
                  <ListItemText
                    primary={item.query}
                    secondary={item.timestamp.toLocaleTimeString()}
                    primaryTypographyProps={{ fontSize: '0.8rem', noWrap: true }}
                    secondaryTypographyProps={{ fontSize: '0.7rem' }}
                  />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </Box>
      )}

      {/* Input Area */}
      <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Ask about inventory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            multiline
            maxRows={3}
          />
          <Button
            variant="contained"
            onClick={() => handleAsk()}
            disabled={loading || !query.trim()}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            <SendIcon />
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
