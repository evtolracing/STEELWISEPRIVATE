import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VpnKey as VpnKeyIcon,
  FilterList as FilterListIcon,
  PersonAdd as PersonAddIcon,
  Shield as ShieldIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getUsers, getRoleEnums, deleteUser, getRoleDisplayName, getRoleCategory } from '../../api/users';
import UserFormDialog from './UserFormDialog';
import ResetPasswordDialog from './ResetPasswordDialog';

const roleColorMap = {
  System: 'error',
  Executive: 'secondary',
  Management: 'primary',
  Sales: 'success',
  Operations: 'warning',
  'Shop Floor': 'info',
  Quality: 'default',
  Support: 'default',
  IT: 'primary',
  External: 'default',
  Legacy: 'default',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roleEnums, setRoleEnums] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUser, setMenuUser] = useState(null);
  
  // Tab for category view
  const [activeTab, setActiveTab] = useState(0);
  const categories = ['All', 'System', 'Executive', 'Management', 'Sales', 'Operations', 'Shop Floor', 'Quality', 'IT', 'External'];

  useEffect(() => {
    loadRoleEnums();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage, searchTerm, roleFilter, statusFilter]);

  const loadRoleEnums = async () => {
    try {
      const enums = await getRoleEnums();
      setRoleEnums(enums);
    } catch (err) {
      console.error('Failed to load role enums:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
      };
      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== 'all') params.isActive = statusFilter === 'active';

      const result = await getUsers(params);
      setUsers(result.users || []);
      setTotalUsers(result.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleEditUser = () => {
    setSelectedUser(menuUser);
    setFormDialogOpen(true);
    handleMenuClose();
  };

  const handleResetPassword = () => {
    setSelectedUser(menuUser);
    setResetPasswordDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteUser = async () => {
    if (!menuUser) return;
    if (!window.confirm(`Are you sure you want to deactivate ${menuUser.firstName} ${menuUser.lastName}?`)) {
      handleMenuClose();
      return;
    }
    try {
      await deleteUser(menuUser.id);
      loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to deactivate user.');
    }
    handleMenuClose();
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setFormDialogOpen(true);
  };

  const handleFormDialogClose = (refresh = false) => {
    setFormDialogOpen(false);
    setSelectedUser(null);
    if (refresh) loadUsers();
  };

  const handleResetPasswordDialogClose = () => {
    setResetPasswordDialogOpen(false);
    setSelectedUser(null);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    const category = categories[newValue];
    if (category === 'All') {
      setCategoryFilter('');
      setRoleFilter('');
    } else {
      setCategoryFilter(category);
      // Filter roleEnums by category and set first matching role
      const matchingRoles = roleEnums.filter(r => r.category === category);
      if (matchingRoles.length > 0) {
        // Don't auto-select, just filter the display
      }
    }
  };

  // Filter users by category tab
  const filteredUsers = users.filter(user => {
    if (activeTab === 0) return true; // All
    const category = categories[activeTab];
    return getRoleCategory(user.role) === category;
  });

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GroupIcon fontSize="large" color="primary" />
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users, roles, and permissions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadUsers}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={handleAddUser}
          >
            Add User
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Category Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          {categories.map((cat, idx) => (
            <Tab key={cat} label={cat} />
          ))}
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={roleFilter}
              label="Role"
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <MenuItem value="">All Roles</MenuItem>
              {roleEnums.map(role => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Loading users...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      No users found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map(user => {
                  const category = getRoleCategory(user.role);
                  return (
                    <TableRow 
                      key={user.id} 
                      hover
                      sx={{ 
                        opacity: user.isActive ? 1 : 0.6,
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar 
                            src={user.avatarUrl} 
                            sx={{ 
                              width: 36, 
                              height: 36,
                              bgcolor: user.isActive ? 'primary.main' : 'grey.400'
                            }}
                          >
                            {getInitials(user.firstName, user.lastName)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.email}
                            </Typography>
                            {user.title && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {user.title}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplayName(user.role)}
                          size="small"
                          color={roleColorMap[category] || 'default'}
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          {category}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {user.homeLocation ? (
                          <Box>
                            <Typography variant="body2">{user.homeLocation.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.homeLocation.code}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        )}
                        {user.userLocations?.length > 1 && (
                          <Chip 
                            label={`+${user.userLocations.length - 1} more`} 
                            size="small" 
                            sx={{ ml: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={user.isActive ? 'success' : 'default'}
                          variant={user.isActive ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? (
                          <Typography variant="caption">
                            {new Date(user.lastLoginAt).toLocaleDateString()}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Never</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditUser}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleResetPassword}>
          <VpnKeyIcon fontSize="small" sx={{ mr: 1 }} />
          Reset Password
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteUser} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Deactivate User
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <UserFormDialog
        open={formDialogOpen}
        onClose={handleFormDialogClose}
        user={selectedUser}
        roleEnums={roleEnums}
      />

      <ResetPasswordDialog
        open={resetPasswordDialogOpen}
        onClose={handleResetPasswordDialogClose}
        user={selectedUser}
      />
    </Box>
  );
}
