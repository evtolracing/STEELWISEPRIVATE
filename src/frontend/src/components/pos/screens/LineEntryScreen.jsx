/**
 * Line Entry Screen
 * 
 * Main order line entry with product search and cart.
 * Integrates real-time pricing calculations.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
  Collapse,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  QrCodeScanner as ScanIcon,
  ContentCut as CutIcon,
  History as HistoryIcon,
  Description as QuoteIcon,
  ShoppingCart as CartIcon,
  Clear as ClearIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalOffer as DiscountIcon
} from '@mui/icons-material';
import { usePOS } from '../POSContext';
import { usePOSPricing } from '../../../hooks/usePOSPricing';

// ============================================
// PRODUCT SEARCH DIALOG
// ============================================

function ProductSearchDialog({ open, onClose, onSelect }) {
  const { searchProducts } = usePOS();
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState({ category: '', inStock: false });
  
  // Search products
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await searchProducts(query, filters);
        setResults(response.products || []);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, filters, searchProducts]);
  
  const handleSelect = (product) => {
    onSelect(product);
    setQuery('');
    setResults([]);
    onClose();
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Search Products</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Search by SKU, description, or barcode..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          sx={{ mb: 2, mt: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searching && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
        />
        
        {/* Results */}
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {results.map((product, index) => (
            <React.Fragment key={product.id}>
              {index > 0 && <Divider />}
              <ListItem disablePadding>
                <ListItemButton onClick={() => handleSelect(product)}>
                  <ListItemText
                    primary={product.description}
                    secondary={
                      <Box component="span" sx={{ display: 'flex', gap: 2 }}>
                        <span>SKU: {product.sku}</span>
                        <span>•</span>
                        <span>Stock: {product.stockQuantity} {product.uom}</span>
                        <span>•</span>
                        <strong>${product.price?.toFixed(2)}/{product.uom}</strong>
                      </Box>
                    }
                  />
                  <Chip 
                    label={product.stockQuantity > 0 ? 'In Stock' : 'Order'} 
                    size="small"
                    color={product.stockQuantity > 0 ? 'success' : 'warning'}
                  />
                </ListItemButton>
              </ListItem>
            </React.Fragment>
          ))}
          
          {query.length >= 2 && !searching && results.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No products found for "{query}"
            </Typography>
          )}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================
// QUICK ADD DIALOG WITH PRICING
// ============================================

function QuickAddDialog({ open, onClose, product, onAdd, customerId }) {
  const [quantity, setQuantity] = useState(1);
  const [uom, setUom] = useState(product?.uom || 'EA');
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [calculating, setCalculating] = useState(false);
  
  // Use pricing hook for real-time calculations
  const { calculatePrice } = usePOSPricing();
  
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setUom(product.uom || 'EA');
      setCalculatedPrice(null);
    }
  }, [product]);
  
  // Calculate price when quantity changes
  useEffect(() => {
    if (!product || !open) return;
    
    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const result = await calculatePrice({
          productId: product.id,
          quantity,
          uom,
          customerId
        });
        setCalculatedPrice(result);
      } catch (err) {
        console.error('Price calculation error:', err);
        // Fallback to simple calculation
        setCalculatedPrice({
          basePrice: product.price,
          unitPrice: product.price,
          extendedPrice: quantity * product.price,
          priceSource: 'CATALOG'
        });
      } finally {
        setCalculating(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [product, quantity, uom, customerId, open, calculatePrice]);
  
  const handleAdd = () => {
    const pricing = calculatedPrice || {
      basePrice: product.price,
      unitPrice: product.price,
      extendedPrice: quantity * product.price
    };
    
    onAdd({
      productId: product.id,
      sku: product.sku,
      description: product.description,
      quantity,
      uom,
      unitPrice: pricing.unitPrice,
      extendedPrice: pricing.extendedPrice,
      pricing: {
        basePrice: pricing.basePrice,
        priceSource: pricing.priceSource,
        millExtras: pricing.millExtras || 0,
        processingCharge: pricing.processingCharge || 0,
        certificationCharges: pricing.certificationCharges || 0,
        margin: pricing.margin
      }
    });
    onClose();
  };
  
  if (!product) return null;
  
  const unitPrice = calculatedPrice?.unitPrice ?? product.price;
  const extendedPrice = calculatedPrice?.extendedPrice ?? (quantity * product.price);
  const priceSource = calculatedPrice?.priceSource;
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add to Order</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1">{product.description}</Typography>
          <Typography variant="body2" color="text.secondary">
            SKU: {product.sku}
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="UOM"
              value={uom}
              disabled
            />
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          {calculating ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Calculating price...
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Unit Price:
                </Typography>
                <Typography variant="body2">
                  ${unitPrice?.toFixed(2)}/{uom}
                </Typography>
              </Box>
              
              {calculatedPrice?.millExtras > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Mill Extras:
                  </Typography>
                  <Typography variant="body2">
                    +${calculatedPrice.millExtras.toFixed(2)}
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">
                  Extended Price:
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  ${extendedPrice?.toFixed(2)}
                </Typography>
              </Box>
              
              {priceSource && (
                <Chip 
                  label={`Price: ${priceSource}`}
                  size="small"
                  color={priceSource === 'CONTRACT' ? 'success' : 'default'}
                  sx={{ mt: 1 }}
                />
              )}
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleAdd} 
          startIcon={<AddIcon />}
          disabled={calculating}
        >
          Add to Order
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================
// ORDER LINE ROW WITH PRICING DETAILS
// ============================================

function OrderLineRow({ line, onUpdate, onRemove, onEdit, onRecalculate, marginWarning }) {
  const [showDetails, setShowDetails] = useState(false);
  
  const handleQuantityChange = (delta) => {
    const newQty = Math.max(1, line.quantity + delta);
    onUpdate(line.id, { quantity: newQty });
    // Trigger price recalculation
    onRecalculate?.(line.id, { ...line, quantity: newQty });
  };
  
  const hasWarning = marginWarning || line.pricing?.marginWarning;
  const priceSource = line.pricing?.priceSource;
  
  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: showDetails ? 'none' : undefined } }}>
        <TableCell sx={{ width: 50 }}>
          <IconButton size="small" onClick={() => onRemove(line.id)} color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {line.sku}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {line.description}
              </Typography>
            </Box>
            {hasWarning && (
              <Tooltip title={marginWarning?.message || 'Low margin'}>
                <WarningIcon color="warning" fontSize="small" />
              </Tooltip>
            )}
            {line.processing && (
              <Chip 
                icon={<CutIcon />}
                label={`Cut: ${line.processing.cutLength}"`}
                size="small"
              />
            )}
            {priceSource && (
              <Chip 
                label={priceSource === 'CONTRACT' ? 'Contract' : priceSource === 'TIER' ? 'Tier' : 'List'}
                size="small"
                color={priceSource === 'CONTRACT' ? 'success' : 'default'}
                variant="outlined"
              />
            )}
          </Box>
        </TableCell>
        <TableCell align="right">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <IconButton size="small" onClick={() => handleQuantityChange(-1)}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Typography sx={{ mx: 1, minWidth: 40, textAlign: 'center' }}>
              {line.quantity}
            </Typography>
            <IconButton size="small" onClick={() => handleQuantityChange(1)}>
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
        <TableCell align="center">
          {line.uom}
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2">
            ${line.unitPrice?.toFixed(2)}
          </Typography>
          {line.pricing?.basePrice && line.pricing.basePrice !== line.unitPrice && (
            <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
              ${line.pricing.basePrice.toFixed(2)}
            </Typography>
          )}
        </TableCell>
        <TableCell align="right">
          <Typography sx={{ fontWeight: 500 }}>
            ${line.extendedPrice?.toFixed(2)}
          </Typography>
        </TableCell>
        <TableCell sx={{ width: 80 }}>
          <IconButton size="small" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" onClick={() => onEdit(line)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </TableCell>
      </TableRow>
      
      {/* Pricing Details Row */}
      <TableRow>
        <TableCell colSpan={7} sx={{ p: 0 }}>
          <Collapse in={showDetails}>
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">Base Price</Typography>
                  <Typography variant="body2">${(line.pricing?.basePrice || line.unitPrice)?.toFixed(2)}/{line.uom}</Typography>
                </Grid>
                {line.pricing?.millExtras > 0 && (
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Mill Extras</Typography>
                    <Typography variant="body2">+${line.pricing.millExtras.toFixed(2)}</Typography>
                  </Grid>
                )}
                {line.pricing?.processingCharge > 0 && (
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Processing</Typography>
                    <Typography variant="body2">+${line.pricing.processingCharge.toFixed(2)}</Typography>
                  </Grid>
                )}
                {line.pricing?.certificationCharges > 0 && (
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Certifications</Typography>
                    <Typography variant="body2">+${line.pricing.certificationCharges.toFixed(2)}</Typography>
                  </Grid>
                )}
                {line.pricing?.margin != null && (
                  <Grid item xs={3}>
                    <Typography variant="caption" color="text.secondary">Margin</Typography>
                    <Typography 
                      variant="body2"
                      color={hasWarning ? 'warning.main' : 'success.main'}
                    >
                      {(line.pricing.margin * 100).toFixed(1)}%
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ============================================
// LINE ENTRY SCREEN
// ============================================

export function LineEntryScreen({ screen, onNext, onBack }) {
  const {
    customer,
    lines,
    pricing,
    pricingWarnings,
    pricingSummary,
    addProduct,
    addProcessedItem,
    updateLine,
    removeLine,
    calculateLinePrice,
    recalculateTotals,
    transition,
    openModal,
    closeModal,
    modals,
    isLoading
  } = usePOS();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [error, setError] = useState(null);
  
  // Get margin warnings mapped by line ID
  const lineWarnings = useMemo(() => {
    const map = {};
    pricingWarnings?.forEach(w => {
      if (w.lineId) {
        map[w.lineId] = w;
      }
    });
    return map;
  }, [pricingWarnings]);
  
  // Handle product selection from search
  const handleProductSelected = useCallback((product) => {
    setQuickAddProduct(product);
  }, []);
  
  // Handle adding product with pricing
  const handleAddProduct = useCallback(async (productData) => {
    try {
      await addProduct(productData);
      // Recalculate totals after adding
      recalculateTotals();
    } catch (err) {
      setError(err.message);
    }
  }, [addProduct, recalculateTotals]);
  
  // Handle line update with price recalculation
  const handleUpdateLine = useCallback(async (lineId, updates) => {
    try {
      await updateLine(lineId, updates);
      recalculateTotals();
    } catch (err) {
      setError(err.message);
    }
  }, [updateLine, recalculateTotals]);
  
  // Handle price recalculation for a line
  const handleRecalculateLine = useCallback(async (lineId, lineData) => {
    try {
      await calculateLinePrice(lineId, lineData);
      recalculateTotals();
    } catch (err) {
      console.error('Price recalculation error:', err);
    }
  }, [calculateLinePrice, recalculateTotals]);
  
  // Handle line removal
  const handleRemoveLine = useCallback(async (lineId) => {
    try {
      await removeLine(lineId);
      recalculateTotals();
    } catch (err) {
      setError(err.message);
    }
  }, [removeLine, recalculateTotals]);
  
  // Quick actions
  const handleQuoteLookup = () => {
    transition('LOOKUP_QUOTE');
  };
  
  const handleReorderHistory = () => {
    transition('VIEW_REORDER');
  };
  
  const handleCutConfigurator = () => {
    transition('CONFIGURE_CUT');
  };
  
  // Continue to review
  const handleContinue = useCallback(async () => {
    if (lines.length === 0) {
      setError('Please add at least one item to continue');
      return;
    }
    
    // Check for pending approvals
    if (pricingSummary?.hasPendingApprovals) {
      setError('Please resolve pending price approvals before continuing');
      return;
    }
    
    try {
      await transition('FINISH_LINES');
      onNext?.();
    } catch (err) {
      setError(err.message);
    }
  }, [lines, pricingSummary?.hasPendingApprovals, transition, onNext]);
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {screen?.title || 'Add Items'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {screen?.description || 'Search for products or scan barcodes to add items to the order.'}
        </Typography>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {/* Search & Actions Bar */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search products or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Scan Barcode">
                      <IconButton size="small">
                        <ScanIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button 
                variant="outlined" 
                startIcon={<CutIcon />}
                onClick={handleCutConfigurator}
                size="small"
              >
                Cut to Length
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<QuoteIcon />}
                onClick={handleQuoteLookup}
                size="small"
              >
                From Quote
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<HistoryIcon />}
                onClick={handleReorderHistory}
                size="small"
              >
                Reorder
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Order Lines Table */}
      <Paper sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <TableContainer sx={{ flex: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 50 }}></TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right" sx={{ width: 140 }}>Quantity</TableCell>
                <TableCell align="center" sx={{ width: 80 }}>UOM</TableCell>
                <TableCell align="right" sx={{ width: 100 }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ width: 120 }}>Extended</TableCell>
                <TableCell sx={{ width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    <CartIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">
                      No items added yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Search for products or scan a barcode to add items
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                lines.map(line => (
                  <OrderLineRow
                    key={line.id}
                    line={line}
                    onUpdate={handleUpdateLine}
                    onRemove={handleRemoveLine}
                    onRecalculate={handleRecalculateLine}
                    onEdit={(line) => console.log('Edit line:', line)}
                    marginWarning={lineWarnings[line.id]}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Order Summary Footer */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          {/* Pricing Warnings */}
          {pricingSummary?.hasWarnings && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {pricingWarnings.length} line(s) have margin warnings. Review before proceeding.
              </Typography>
            </Alert>
          )}
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs>
              <Typography variant="body2" color="text.secondary">
                {lines.length} item{lines.length !== 1 ? 's' : ''} in order
              </Typography>
              {pricing.processingTotal > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Includes ${pricing.processingTotal.toFixed(2)} processing
                </Typography>
              )}
            </Grid>
            <Grid item>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                  Subtotal
                </Typography>
                <Typography variant="h6">
                  ${(pricing.subtotal || 0).toFixed(2)}
                </Typography>
              </Box>
            </Grid>
            {pricing.discountTotal > 0 && (
              <Grid item>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    Discounts
                  </Typography>
                  <Typography variant="h6" color="error.main">
                    -${pricing.discountTotal.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            )}
            <Grid item>
              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                disabled={lines.length === 0 || isLoading || pricingSummary?.hasPendingApprovals}
                endIcon={pricingSummary?.hasWarnings ? <Badge badgeContent="!" color="warning"><WarningIcon /></Badge> : null}
              >
                Review Order
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
      
      {/* Dialogs */}
      <ProductSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleProductSelected}
      />
      
      <QuickAddDialog
        open={!!quickAddProduct}
        onClose={() => setQuickAddProduct(null)}
        product={quickAddProduct}
        onAdd={handleAddProduct}
        customerId={customer?.id}
      />
    </Box>
  );
}

export default LineEntryScreen;
