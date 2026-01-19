import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Divider,
  Stack,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Collapse,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SearchIcon from '@mui/icons-material/Search';
import { bomApi } from '../../services/bomApi';

export default function BomRecipeEditorPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(recipeId);
  
  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [commodity, setCommodity] = useState('');
  const [form, setForm] = useState('');
  const [grade, setGrade] = useState('');
  const [thicknessMin, setThicknessMin] = useState('');
  const [thicknessMax, setThicknessMax] = useState('');
  const [division, setDivision] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [version, setVersion] = useState(1);
  const [operations, setOperations] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [aiExpanded, setAiExpanded] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Match tester state
  const [matchTesterExpanded, setMatchTesterExpanded] = useState(false);
  const [matchCriteria, setMatchCriteria] = useState({
    materialCode: '',
    commodity: '',
    form: '',
    grade: '',
    thickness: '',
    division: '',
  });
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  
  // Computed
  const isEditable = ['DRAFT', 'REVIEW'].includes(status);
  const canTransitionToReview = status === 'DRAFT';
  const canTransitionToActive = status === 'REVIEW';
  const canTransitionToDeprecated = status === 'ACTIVE';
  const canTransitionToArchived = ['DRAFT', 'REVIEW', 'DEPRECATED'].includes(status);
  const canTransitionToDraft = status === 'REVIEW';
  
  useEffect(() => {
    if (isEditMode) {
      loadRecipe();
    }
  }, [recipeId]);
  
  async function loadRecipe() {
    try {
      setLoading(true);
      const recipe = await bomApi.getBomRecipeById(recipeId);
      
      setName(recipe.name);
      setCode(recipe.code);
      setMaterialCode(recipe.materialCode || '');
      setCommodity(recipe.commodity || '');
      setForm(recipe.form || '');
      setGrade(recipe.grade || '');
      setThicknessMin(recipe.thicknessMin !== null ? recipe.thicknessMin : '');
      setThicknessMax(recipe.thicknessMax !== null ? recipe.thicknessMax : '');
      setDivision(recipe.division || '');
      setStatus(recipe.status);
      setVersion(recipe.version);
      setOperations(recipe.operations || []);
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleSave() {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const payload = {
        name,
        code,
        materialCode: materialCode || null,
        commodity: commodity || null,
        form: form || null,
        grade: grade || null,
        thicknessMin: thicknessMin !== '' ? parseFloat(thicknessMin) : null,
        thicknessMax: thicknessMax !== '' ? parseFloat(thicknessMax) : null,
        division: division || null,
        operations,
      };
      
      let result;
      if (isEditMode) {
        result = await bomApi.updateBomRecipe(recipeId, payload);
        setSuccess('Recipe updated successfully');
      } else {
        result = await bomApi.createBomRecipe(payload);
        setSuccess('Recipe created successfully');
        // Navigate to edit mode for newly created recipe
        navigate(`/bom/${result.id}`, { replace: true });
      }
      
      // Reload data
      if (isEditMode) {
        loadRecipe();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleActivate() {
    try {
      setLoading(true);
      await bomApi.transitionBomRecipe(recipeId, 'ACTIVE');
      setSuccess('Recipe activated successfully');
      loadRecipe();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleTransition(targetStatus) {
    try {
      setLoading(true);
      await bomApi.transitionBomRecipe(recipeId, targetStatus);
      setSuccess(`Recipe transitioned to ${targetStatus} successfully`);
      loadRecipe();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleClone() {
    try {
      setLoading(true);
      const cloned = await bomApi.cloneBomRecipe(recipeId);
      setSuccess(`Recipe cloned as version ${cloned.version}`);
      navigate(`/bom/${cloned.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  
  async function handleTestMatch() {
    try {
      setMatchLoading(true);
      setMatchResult(null);
      const result = await bomApi.matchBomRecipe({
        materialCode: matchCriteria.materialCode || undefined,
        commodity: matchCriteria.commodity || undefined,
        form: matchCriteria.form || undefined,
        grade: matchCriteria.grade || undefined,
        thickness: matchCriteria.thickness ? parseFloat(matchCriteria.thickness) : undefined,
        division: matchCriteria.division || undefined,
      });
      setMatchResult(result);
    } catch (err) {
      setMatchResult({ error: err.message });
    } finally {
      setMatchLoading(false);
    }
  }
  
  async function handleAiSuggest() {
    try {
      setAiLoading(true);
      const result = await bomApi.suggestBomFromDescription({
        description: aiDescription,
        commodity: commodity || undefined,
        form: form || undefined,
        materialCode: materialCode || undefined,
      });
      
      // Use suggested name if current name is empty
      if (!name && result.suggestedName) {
        setName(result.suggestedName);
      }
      
      // Replace operations with suggestions
      setOperations(result.suggestedOperations);
      setSuccess(`AI suggested ${result.suggestedOperations.length} operations`);
      setAiExpanded(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }
  
  function handleAddOperation() {
    if (!isEditable) {
      setError('Cannot add operations when recipe is not in DRAFT or REVIEW status');
      return;
    }
    const newOp = {
      id: `OP-NEW-${Date.now()}`,
      sequence: operations.length + 1,
      name: '',
      workCenterType: '',
      estimatedMachineMinutes: 0,
      estimatedLaborMinutes: 0,
      setupMinutes: 0,
      parameters: [],
    };
    setOperations([...operations, newOp]);
  }
  
  function handleDeleteOperation(index) {
    if (!isEditable) {
      setError('Cannot delete operations when recipe is not in DRAFT or REVIEW status');
      return;
    }
    const updated = operations.filter((_, i) => i !== index);
    // Re-sequence
    updated.forEach((op, idx) => {
      op.sequence = idx + 1;
    });
    setOperations(updated);
  }
  
  function handleUpdateOperation(index, field, value) {
    if (!isEditable) {
      setError('Cannot update operations when recipe is not in DRAFT or REVIEW status');
      return;
    }
    const updated = [...operations];
    updated[index] = { ...updated[index], [field]: value };
    setOperations(updated);
  }
  
  function handleAddParameter(opIndex) {
    if (!isEditable) {
      setError('Cannot add parameters when recipe is not in DRAFT or REVIEW status');
      return;
    }
    const updated = [...operations];
    updated[opIndex].parameters.push({ key: '', label: '', value: '' });
    setOperations(updated);
  }
  
  function handleUpdateParameter(opIndex, paramIndex, field, value) {
    const updated = [...operations];
    updated[opIndex].parameters[paramIndex] = {
      ...updated[opIndex].parameters[paramIndex],
      [field]: value,
    };
    setOperations(updated);
  }
  
  function handleDeleteParameter(opIndex, paramIndex) {
    const updated = [...operations];
    updated[opIndex].parameters.splice(paramIndex, 1);
    setOperations(updated);
  }
  
  if (loading && isEditMode && !name) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate('/bom')}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" component="h1">
            {isEditMode ? 'Edit Recipe' : 'New Recipe'}
          </Typography>
          {isEditMode && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip 
                label={status} 
                color={
                  status === 'ACTIVE' ? 'success' :
                  status === 'REVIEW' ? 'info' :
                  status === 'DRAFT' ? 'warning' :
                  status === 'DEPRECATED' ? 'default' :
                  'error'
                }
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                Version {version} • {code}
              </Typography>
            </Stack>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          {canTransitionToDraft && (
            <Button
              variant="outlined"
              onClick={() => handleTransition('DRAFT')}
              disabled={loading}
              size="small"
            >
              Back to Draft
            </Button>
          )}
          {canTransitionToReview && (
            <Button
              variant="outlined"
              color="info"
              onClick={() => handleTransition('REVIEW')}
              disabled={loading}
              size="small"
            >
              Submit for Review
            </Button>
          )}
          {canTransitionToActive && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => handleTransition('ACTIVE')}
              disabled={loading}
            >
              Activate
            </Button>
          )}
          {canTransitionToDeprecated && (
            <Button
              variant="outlined"
              color="warning"
              onClick={() => handleTransition('DEPRECATED')}
              disabled={loading}
              size="small"
            >
              Deprecate
            </Button>
          )}
          {canTransitionToArchived && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleTransition('ARCHIVED')}
              disabled={loading}
              size="small"
            >
              Archive
            </Button>
          )}
          {isEditMode && (
            <Button
              variant="outlined"
              startIcon={<ContentCopyIcon />}
              onClick={handleClone}
              disabled={loading}
            >
              Clone as New Version
            </Button>
          )}
          {isEditable && (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              Save
            </Button>
          )}
        </Stack>
      </Box>
      
      {/* Alerts */}
      {!isEditable && isEditMode && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This recipe is in {status} status and cannot be edited. Clone it to create a new editable version.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Left Column: Recipe Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recipe Details
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Recipe Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={!isEditable}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Recipe Code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  disabled={!isEditable}
                  helperText="Unique identifier (e.g., REC-AL6061-PLATE-STD)"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Material Code"
                  value={materialCode}
                  onChange={(e) => setMaterialCode(e.target.value)}
                  disabled={!isEditable}
                  helperText="Optional: Link to specific catalog item"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Commodity"
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  disabled={!isEditable}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="ALUMINUM">Aluminum</MenuItem>
                  <MenuItem value="STEEL">Steel</MenuItem>
                  <MenuItem value="STAINLESS">Stainless</MenuItem>
                  <MenuItem value="PLASTICS">Plastics</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Form"
                  value={form}
                  onChange={(e) => setForm(e.target.value)}
                  disabled={!isEditable}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="PLATE">Plate</MenuItem>
                  <MenuItem value="SHEET">Sheet</MenuItem>
                  <MenuItem value="BAR">Bar</MenuItem>
                  <MenuItem value="TUBE">Tube</MenuItem>
                  <MenuItem value="PIPE">Pipe</MenuItem>
                  <MenuItem value="ANGLE">Angle</MenuItem>
                  <MenuItem value="CHANNEL">Channel</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  disabled={!isEditable}
                  helperText="e.g., 6061-T6, A36, 304"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Thickness Min"
                  value={thicknessMin}
                  onChange={(e) => setThicknessMin(e.target.value)}
                  disabled={!isEditable}
                  inputProps={{ step: 0.001, min: 0 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Thickness Max"
                  value={thicknessMax}
                  onChange={(e) => setThicknessMax(e.target.value)}
                  disabled={!isEditable}
                  inputProps={{ step: 0.001, min: 0 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Division"
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  disabled={!isEditable}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="METALS">Metals</MenuItem>
                  <MenuItem value="PLASTICS">Plastics</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Operations Section */}
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Operations ({operations.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddOperation}
                disabled={!isEditable}
              >
                Add Operation
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {operations.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No operations defined. Add operations to build the recipe.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={2}>
                {operations.map((op, opIndex) => (
                  <Card key={op.id} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
                        <Chip label={`Step ${op.sequence}`} color="primary" size="small" />
                        <TextField
                          label="Operation Name"
                          value={op.name}
                          onChange={(e) => handleUpdateOperation(opIndex, 'name', e.target.value)}
                          sx={{ flex: 1 }}
                          size="small"
                          placeholder="SAW CUT, DEBURR, PACK, etc."
                        />
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleDeleteOperation(opIndex)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            select
                            fullWidth
                            label="Work Center Type"
                            value={op.workCenterType}
                            onChange={(e) => handleUpdateOperation(opIndex, 'workCenterType', e.target.value)}
                            size="small"
                          >
                            <MenuItem value="SAW">Saw</MenuItem>
                            <MenuItem value="SHEAR">Shear</MenuItem>
                            <MenuItem value="ROUTER">Router</MenuItem>
                            <MenuItem value="WATERJET">Waterjet</MenuItem>
                            <MenuItem value="LASER">Laser</MenuItem>
                            <MenuItem value="FINISHING">Finishing</MenuItem>
                            <MenuItem value="PACKOUT">Pack Out</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Setup Minutes"
                            value={op.setupMinutes}
                            onChange={(e) => handleUpdateOperation(opIndex, 'setupMinutes', parseFloat(e.target.value) || 0)}
                            size="small"
                            inputProps={{ step: 1, min: 0 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Machine Minutes"
                            value={op.estimatedMachineMinutes}
                            onChange={(e) => handleUpdateOperation(opIndex, 'estimatedMachineMinutes', parseFloat(e.target.value) || 0)}
                            size="small"
                            inputProps={{ step: 1, min: 0 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Labor Minutes"
                            value={op.estimatedLaborMinutes}
                            onChange={(e) => handleUpdateOperation(opIndex, 'estimatedLaborMinutes', parseFloat(e.target.value) || 0)}
                            size="small"
                            inputProps={{ step: 1, min: 0 }}
                          />
                        </Grid>
                      </Grid>
                      
                      {/* Parameters */}
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" fontWeight={500}>
                            Parameters
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => handleAddParameter(opIndex)}
                          >
                            Add
                          </Button>
                        </Box>
                        
                        {op.parameters.length === 0 ? (
                          <Typography variant="caption" color="text.secondary">
                            No parameters
                          </Typography>
                        ) : (
                          <Stack spacing={1}>
                            {op.parameters.map((param, paramIndex) => (
                              <Box key={paramIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <TextField
                                  size="small"
                                  placeholder="Key"
                                  value={param.key}
                                  onChange={(e) => handleUpdateParameter(opIndex, paramIndex, 'key', e.target.value)}
                                  sx={{ flex: 1 }}
                                />
                                <TextField
                                  size="small"
                                  placeholder="Label"
                                  value={param.label}
                                  onChange={(e) => handleUpdateParameter(opIndex, paramIndex, 'label', e.target.value)}
                                  sx={{ flex: 1 }}
                                />
                                <TextField
                                  size="small"
                                  placeholder="Value"
                                  value={param.value}
                                  onChange={(e) => handleUpdateParameter(opIndex, paramIndex, 'value', e.target.value)}
                                  sx={{ flex: 1 }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteParameter(opIndex, paramIndex)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
        
        {/* Right Column: AI Assistant */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, position: 'sticky', top: 16 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setAiExpanded(!aiExpanded)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SmartToyIcon color="primary" />
                <Typography variant="h6">AI Assistant</Typography>
              </Box>
              <IconButton size="small">
                {aiExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={aiExpanded}>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Describe the processing steps needed, and AI will suggest operations.
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Process Description"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                placeholder="e.g., Cut aluminum plate to size, deburr edges, apply protective film, and pack for shipping"
                sx={{ mb: 2 }}
              />
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<SmartToyIcon />}
                onClick={handleAiSuggest}
                disabled={!aiDescription.trim() || aiLoading}
              >
                {aiLoading ? 'Generating...' : 'Suggest Recipe'}
              </Button>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  AI will analyze your description and suggest:
                </Typography>
                <ul style={{ margin: '8px 0', paddingLeft: 20, fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)' }}>
                  <li>Operation names</li>
                  <li>Work center types</li>
                  <li>Time estimates</li>
                  <li>Process parameters</li>
                </ul>
              </Box>
            </Collapse>
          </Paper>
          
          {/* Match Tester */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => setMatchTesterExpanded(!matchTesterExpanded)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon color="primary" />
                <Typography variant="h6">Match Tester</Typography>
              </Box>
              <IconButton size="small">
                {matchTesterExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            
            <Collapse in={matchTesterExpanded}>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Test recipe matching logic with material criteria
              </Typography>
              
              <Stack spacing={2}>
                <TextField
                  size="small"
                  label="Material Code"
                  value={matchCriteria.materialCode}
                  onChange={(e) => setMatchCriteria({ ...matchCriteria, materialCode: e.target.value })}
                />
                <TextField
                  size="small"
                  select
                  label="Commodity"
                  value={matchCriteria.commodity}
                  onChange={(e) => setMatchCriteria({ ...matchCriteria, commodity: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="ALUMINUM">Aluminum</MenuItem>
                  <MenuItem value="STEEL">Steel</MenuItem>
                  <MenuItem value="STAINLESS">Stainless</MenuItem>
                  <MenuItem value="PLASTICS">Plastics</MenuItem>
                </TextField>
                <TextField
                  size="small"
                  select
                  label="Form"
                  value={matchCriteria.form}
                  onChange={(e) => setMatchCriteria({ ...matchCriteria, form: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="PLATE">Plate</MenuItem>
                  <MenuItem value="SHEET">Sheet</MenuItem>
                  <MenuItem value="BAR">Bar</MenuItem>
                </TextField>
                <TextField
                  size="small"
                  label="Grade"
                  value={matchCriteria.grade}
                  onChange={(e) => setMatchCriteria({ ...matchCriteria, grade: e.target.value })}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Thickness"
                  value={matchCriteria.thickness}
                  onChange={(e) => setMatchCriteria({ ...matchCriteria, thickness: e.target.value })}
                  inputProps={{ step: 0.001, min: 0 }}
                />
                <TextField
                  size="small"
                  select
                  label="Division"
                  value={matchCriteria.division}
                  onChange={(e) => setMatchCriteria({ ...matchCriteria, division: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="METALS">Metals</MenuItem>
                  <MenuItem value="PLASTICS">Plastics</MenuItem>
                </TextField>
                
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleTestMatch}
                  disabled={matchLoading}
                >
                  {matchLoading ? 'Testing...' : 'Test Match'}
                </Button>
                
                {matchResult && (
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    {matchResult.error ? (
                      <Alert severity="error">{matchResult.error}</Alert>
                    ) : (
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="success.main">
                          ✓ Match Found
                        </Typography>
                        <Typography variant="body2">
                          <strong>Name:</strong> {matchResult.match?.name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Code:</strong> {matchResult.match?.code}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Version:</strong> {matchResult.match?.version}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Score:</strong> {matchResult.score}
                        </Typography>
                      </Stack>
                    )}
                  </Paper>
                )}
              </Stack>
            </Collapse>
          </Paper>
          
          {/* Summary */}
          {isEditMode && (
            <Paper sx={{ p: 2, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={1}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Operations
                  </Typography>
                  <Typography variant="body1">
                    {operations.length}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estimated Total Time
                  </Typography>
                  <Typography variant="body1">
                    {operations.reduce((sum, op) => sum + op.setupMinutes + op.estimatedMachineMinutes + op.estimatedLaborMinutes, 0)} minutes
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Chip label={status} color={status === 'ACTIVE' ? 'success' : 'warning'} size="small" />
                </Box>
              </Stack>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
