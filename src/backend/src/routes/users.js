import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Middleware to verify JWT and extract user
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { organization: true }
    });

    if (!user) return res.status(401).json({ error: 'User not found' });
    if (!user.isActive) return res.status(403).json({ error: 'User account is disabled' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Check if user has required role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    
    const adminRoles = ['SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER', 'OPS_MANAGER'];
    if (!roles.some(r => req.user.role === r) && !adminRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ==================== USER CRUD ====================

// GET /api/users - List all users (with filtering)
router.get('/', authenticate, async (req, res) => {
  try {
    const { 
      search, 
      role, 
      organizationId, 
      isActive,
      locationId,
      page = 1, 
      limit = 50 
    } = req.query;

    const where = {
      organizationId: req.user.organizationId, // Tenant isolation
    };

    // Search by name or email
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    
    // Filter by location
    if (locationId) {
      where.userLocations = {
        some: { locationId }
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          organization: { select: { id: true, name: true, code: true } },
          homeLocation: { select: { id: true, name: true, code: true } },
          userRoles: {
            include: {
              role: { select: { id: true, name: true, displayName: true } }
            }
          },
          userLocations: {
            include: {
              location: { select: { id: true, name: true, code: true } }
            }
          },
          userDivisions: {
            include: {
              division: { select: { id: true, name: true, code: true } }
            }
          }
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.user.count({ where })
    ]);

    // Remove password hash from response
    const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);

    res.json({
      users: sanitizedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        organizationId: req.user.organizationId
      },
      include: {
        organization: true,
        homeLocation: true,
        userRoles: {
          include: { role: true }
        },
        userLocations: {
          include: { location: true }
        },
        userDivisions: {
          include: { division: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, ...sanitizedUser } = user;
    res.json(sanitizedUser);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users - Create new user
router.post('/', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      title,
      phone,
      homeLocationId,
      locationIds = [],
      divisionIds = [],
      roleIds = []
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
        title,
        phone,
        organizationId: req.user.organizationId,
        homeLocationId,
        userLocations: locationIds.length > 0 ? {
          create: locationIds.map((locationId, idx) => ({
            locationId,
            isPrimary: idx === 0
          }))
        } : undefined,
        userDivisions: divisionIds.length > 0 ? {
          create: divisionIds.map(divisionId => ({ divisionId }))
        } : undefined,
        userRoles: roleIds.length > 0 ? {
          create: roleIds.map(roleId => ({
            roleId,
            grantedBy: req.user.id
          }))
        } : undefined
      },
      include: {
        organization: true,
        homeLocation: true,
        userLocations: { include: { location: true } },
        userDivisions: { include: { division: true } },
        userRoles: { include: { role: true } }
      }
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        tenantId: req.user.organizationId,
        category: 'DATA',
        eventType: 'CREATE',
        userId: req.user.id,
        resourceType: 'User',
        resourceId: user.id,
        action: 'user.create',
        details: { email, role, firstName, lastName }
      }
    });

    const { passwordHash: _, ...sanitizedUser } = user;
    res.status(201).json(sanitizedUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN', 'BRANCH_MANAGER'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      role,
      title,
      phone,
      homeLocationId,
      isActive,
      locationIds,
      divisionIds,
      roleIds
    } = req.body;

    // Verify user exists and belongs to same org
    const existingUser = await prisma.user.findFirst({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Build update data
    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role !== undefined) updateData.role = role;
    if (title !== undefined) updateData.title = title;
    if (phone !== undefined) updateData.phone = phone;
    if (homeLocationId !== undefined) updateData.homeLocationId = homeLocationId;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        organization: true,
        homeLocation: true,
        userLocations: { include: { location: true } },
        userDivisions: { include: { division: true } },
        userRoles: { include: { role: true } }
      }
    });

    // Update location assignments if provided
    if (locationIds !== undefined) {
      await prisma.userLocation.deleteMany({ where: { userId: id } });
      if (locationIds.length > 0) {
        await prisma.userLocation.createMany({
          data: locationIds.map((locationId, idx) => ({
            userId: id,
            locationId,
            isPrimary: idx === 0
          }))
        });
      }
    }

    // Update division assignments if provided
    if (divisionIds !== undefined) {
      await prisma.userDivision.deleteMany({ where: { userId: id } });
      if (divisionIds.length > 0) {
        await prisma.userDivision.createMany({
          data: divisionIds.map(divisionId => ({
            userId: id,
            divisionId
          }))
        });
      }
    }

    // Update role assignments if provided
    if (roleIds !== undefined) {
      await prisma.userRoleAssignment.deleteMany({ where: { userId: id } });
      if (roleIds.length > 0) {
        await prisma.userRoleAssignment.createMany({
          data: roleIds.map(roleId => ({
            userId: id,
            roleId,
            grantedBy: req.user.id
          }))
        });
      }
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        tenantId: req.user.organizationId,
        category: 'DATA',
        eventType: 'UPDATE',
        userId: req.user.id,
        resourceType: 'User',
        resourceId: id,
        action: 'user.update',
        details: updateData
      }
    });

    // Re-fetch with all relations
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        homeLocation: true,
        userLocations: { include: { location: true } },
        userDivisions: { include: { division: true } },
        userRoles: { include: { role: true } }
      }
    });

    const { passwordHash, ...sanitizedUser } = updatedUser;
    res.json(sanitizedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/users/:id - Soft delete (deactivate) user
router.delete('/:id', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify user exists and belongs to same org
    const existingUser = await prisma.user.findFirst({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent self-deletion
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Soft delete - just deactivate
    await prisma.user.update({
      where: { id },
      data: { isActive: false }
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        tenantId: req.user.organizationId,
        category: 'DATA',
        eventType: 'DELETE',
        userId: req.user.id,
        resourceType: 'User',
        resourceId: id,
        action: 'user.delete',
        details: { email: existingUser.email }
      }
    });

    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// POST /api/users/:id/reset-password - Reset user password (admin)
router.post('/:id/reset-password', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { id, organizationId: req.user.organizationId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    // Log audit event
    await prisma.auditLog.create({
      data: {
        tenantId: req.user.organizationId,
        category: 'AUTH',
        eventType: 'PASSWORD_RESET',
        userId: req.user.id,
        targetUserId: id,
        resourceType: 'User',
        resourceId: id,
        action: 'user.password_reset'
      }
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ==================== ROLES CRUD ====================

// GET /api/users/roles/list - List all roles
router.get('/roles/list', authenticate, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// GET /api/users/roles/:id - Get single role
router.get('/roles/:id', authenticate, async (req, res) => {
  try {
    const role = await prisma.role.findUnique({
      where: { id: req.params.id },
      include: {
        userRoles: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true }
            }
          }
        }
      }
    });

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// POST /api/users/roles - Create new role
router.post('/roles', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;

    if (!name || !displayName || !permissions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const role = await prisma.role.create({
      data: {
        name: name.toUpperCase().replace(/\s+/g, '_'),
        displayName,
        description,
        permissions,
        isSystem: false
      }
    });

    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// PUT /api/users/roles/:id - Update role
router.put('/roles/:id', authenticate, requireRole('SUPER_ADMIN', 'TENANT_OWNER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, permissions, isActive } = req.body;

    const existingRole = await prisma.role.findUnique({ where: { id } });
    if (!existingRole) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (existingRole.isSystem) {
      return res.status(400).json({ error: 'Cannot modify system roles' });
    }

    const role = await prisma.role.update({
      where: { id },
      data: {
        displayName,
        description,
        permissions,
        isActive
      }
    });

    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ==================== ENUMS & OPTIONS ====================

// GET /api/users/enums/roles - Get available UserRole enum values
router.get('/enums/roles', (req, res) => {
  const roles = [
    // System
    { value: 'SUPER_ADMIN', label: 'Super Admin', category: 'System' },
    { value: 'TENANT_OWNER', label: 'Tenant Owner', category: 'System' },
    
    // Executive
    { value: 'EXECUTIVE', label: 'Executive', category: 'Executive' },
    { value: 'CFO', label: 'CFO', category: 'Executive' },
    { value: 'COO', label: 'COO', category: 'Executive' },
    { value: 'CIO', label: 'CIO', category: 'Executive' },
    
    // Division/Branch
    { value: 'DIVISION_DIRECTOR', label: 'Division Director', category: 'Management' },
    { value: 'BRANCH_MANAGER', label: 'Branch Manager', category: 'Management' },
    
    // Sales
    { value: 'SALES_DIRECTOR', label: 'Sales Director', category: 'Sales' },
    { value: 'SALES_REP', label: 'Sales Representative', category: 'Sales' },
    { value: 'CSR', label: 'Customer Service Rep', category: 'Sales' },
    { value: 'ESTIMATOR', label: 'Estimator', category: 'Sales' },
    { value: 'CREDIT_MANAGER', label: 'Credit Manager', category: 'Sales' },
    
    // Operations
    { value: 'OPS_MANAGER', label: 'Operations Manager', category: 'Operations' },
    { value: 'PRODUCTION_MANAGER', label: 'Production Manager', category: 'Operations' },
    { value: 'SCHEDULER', label: 'Scheduler', category: 'Operations' },
    { value: 'INVENTORY_MANAGER', label: 'Inventory Manager', category: 'Operations' },
    { value: 'BUYER', label: 'Buyer', category: 'Operations' },
    { value: 'WORKCENTER_LEAD', label: 'Work Center Lead', category: 'Operations' },
    
    // Shop Floor
    { value: 'OPERATOR_SAW', label: 'Saw Operator', category: 'Shop Floor' },
    { value: 'OPERATOR_ROUTER', label: 'Router Operator', category: 'Shop Floor' },
    { value: 'OPERATOR_SHEAR', label: 'Shear Operator', category: 'Shop Floor' },
    { value: 'OPERATOR_PLASMA', label: 'Plasma Operator', category: 'Shop Floor' },
    { value: 'OPERATOR_GENERAL', label: 'General Operator', category: 'Shop Floor' },
    { value: 'MATERIAL_HANDLER', label: 'Material Handler', category: 'Shop Floor' },
    { value: 'RECEIVING_CLERK', label: 'Receiving Clerk', category: 'Shop Floor' },
    { value: 'SHIPPING_COORDINATOR', label: 'Shipping Coordinator', category: 'Shop Floor' },
    { value: 'PACKAGING_LEAD', label: 'Packaging Lead', category: 'Shop Floor' },
    
    // Quality
    { value: 'QC_MANAGER', label: 'QC Manager', category: 'Quality' },
    { value: 'QC_INSPECTOR', label: 'QC Inspector', category: 'Quality' },
    
    // Support
    { value: 'MAINTENANCE_MANAGER', label: 'Maintenance Manager', category: 'Support' },
    { value: 'INTEGRATION_ADMIN', label: 'Integration Admin', category: 'IT' },
    { value: 'DATA_ANALYST', label: 'Data Analyst', category: 'IT' },
    { value: 'SUPPORT_AGENT', label: 'Support Agent', category: 'Support' },
    { value: 'AUDITOR', label: 'Auditor', category: 'Support' },
    
    // External Portal
    { value: 'CUSTOMER_ADMIN', label: 'Customer Admin', category: 'External' },
    { value: 'CUSTOMER_BUYER', label: 'Customer Buyer', category: 'External' },
    { value: 'CUSTOMER_VIEWER', label: 'Customer Viewer', category: 'External' },
    { value: 'SUPPLIER_USER', label: 'Supplier User', category: 'External' },
    { value: 'CARRIER_USER', label: 'Carrier User', category: 'External' },
    
    // Legacy
    { value: 'ADMIN', label: 'Admin (Legacy)', category: 'Legacy' },
    { value: 'VIEWER', label: 'Viewer', category: 'Legacy' },
  ];

  res.json(roles);
});

// GET /api/users/locations - Get locations for assignment
router.get('/locations', authenticate, async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { 
        isActive: true,
        ownerId: req.user.organizationId
      },
      select: { id: true, code: true, name: true, type: true },
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

// GET /api/users/divisions - Get divisions for assignment
router.get('/divisions', authenticate, async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { name: 'asc' }
    });
    res.json(divisions);
  } catch (error) {
    console.error('Error fetching divisions:', error);
    res.status(500).json({ error: 'Failed to fetch divisions' });
  }
});

export default router;
