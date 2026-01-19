import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  MenuItem,
  Toolbar,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { bomApi } from '../../services/bomApi';

export default function BomRecipeListPage() {
  const navigate = useNavigate();
  
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('');
  
  useEffect(() => {
    loadRecipes();
  }, [statusFilter, commodityFilter, divisionFilter]);
  
  async function loadRecipes() {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (commodityFilter) params.commodity = commodityFilter;
      if (divisionFilter) params.division = divisionFilter;
      
      const data = await bomApi.getBomRecipes(params);
      setRecipes(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  function handleRowClick(recipeId) {
    navigate(`/bom/${recipeId}`);
  }
  
  function handleNewRecipe() {
    navigate('/bom/new');
  }
  
  function getStatusColor(status) {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'REVIEW': return 'info';
      case 'DRAFT': return 'warning';
      case 'DEPRECATED': return 'default';
      case 'ARCHIVED': return 'error';
      default: return 'default';
    }
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" component="h1">
          BOM Recipes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewRecipe}
        >
          New Recipe
        </Button>
      </Box>
      
      {/* Filters Toolbar */}
      <Paper sx={{ mb: 2, p: 2 }}>
        <Toolbar disableGutters>
          <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              size="small"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="DRAFT">Draft</MenuItem>
              <MenuItem value="REVIEW">Review</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="DEPRECATED">Deprecated</MenuItem>
              <MenuItem value="ARCHIVED">Archived</MenuItem>
            </TextField>
            
            <TextField
              select
              label="Commodity"
              value={commodityFilter}
              onChange={(e) => setCommodityFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              size="small"
            >
              <MenuItem value="">All Commodities</MenuItem>
              <MenuItem value="ALUMINUM">Aluminum</MenuItem>
              <MenuItem value="STEEL">Steel</MenuItem>
              <MenuItem value="STAINLESS">Stainless</MenuItem>
              <MenuItem value="PLASTICS">Plastics</MenuItem>
            </TextField>
            
            <TextField
              select
              label="Division"
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              size="small"
            >
              <MenuItem value="">All Divisions</MenuItem>
              <MenuItem value="METALS">Metals</MenuItem>
              <MenuItem value="PLASTICS">Plastics</MenuItem>
            </TextField>
          </Stack>
        </Toolbar>
      </Paper>
      
      {/* Results */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Commodity</TableCell>
                <TableCell>Form</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Division</TableCell>
                <TableCell>Version</TableCell>
                <TableCell align="right">Operations</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No recipes found. Click "New Recipe" to create one.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                recipes.map((recipe) => (
                  <TableRow
                    key={recipe.id}
                    hover
                    onClick={() => handleRowClick(recipe.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {recipe.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" color="text.secondary">
                        {recipe.code}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={recipe.status}
                        color={getStatusColor(recipe.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{recipe.commodity || '—'}</TableCell>
                    <TableCell>{recipe.form || '—'}</TableCell>
                    <TableCell>{recipe.grade || '—'}</TableCell>
                    <TableCell>{recipe.division || '—'}</TableCell>
                    <TableCell>v{recipe.version}</TableCell>
                    <TableCell align="right">
                      <Chip label={recipe.operationCount} size="small" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
