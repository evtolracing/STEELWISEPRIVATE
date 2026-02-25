import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// GET /customers - Search customers (organizations that can be buyers)
router.get('/', async (req, res) => {
  try {
    const { search, type, limit = '50', offset = '0' } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (type) {
      where.type = type;
    }
    
    const [customers, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          phone: true,
          email: true,
          isActive: true,
          createdAt: true,
        },
      }),
      prisma.organization.count({ where }),
    ]);
    
    res.json({
      data: customers,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// =============================================
// CUSTOMER PREFERENCES
// =============================================

// GET /customers/preferences/list — all customers with preference summary
// NOTE: This MUST be before /:id routes so Express doesn't match "preferences" as an id
router.get('/preferences/list', async (req, res) => {
  try {
    const customers = await prisma.organization.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        city: true,
        state: true,
        preferences: {
          select: {
            preferredBranch: true,
            defaultPriority: true,
            rushDefault: true,
            certRequirements: true,
            tolerancePreset: true,
            specialInstructions: true,
            preferredShipMethod: true,
            pricingTier: true,
            paymentTerms: true,
            updatedAt: true,
            updatedBy: true,
          },
        },
      },
    });

    const data = customers.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      city: c.city,
      state: c.state,
      hasPreferences: !!c.preferences,
      preferredBranch: c.preferences?.preferredBranch || null,
      defaultPriority: c.preferences?.defaultPriority || null,
      rushDefault: c.preferences?.rushDefault || false,
      certCount: Array.isArray(c.preferences?.certRequirements) ? c.preferences.certRequirements.length : 0,
      preferredShipMethod: c.preferences?.preferredShipMethod || null,
      pricingTier: c.preferences?.pricingTier || null,
      lastUpdated: c.preferences?.updatedAt || null,
    }));

    res.json({ data });
  } catch (error) {
    console.error('Error listing customer preferences:', error);
    res.status(500).json({ error: 'Failed to list customer preferences' });
  }
});

// GET /customers/:id - Get customer details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await prisma.organization.findUnique({
      where: { id },
      include: {
        ordersAsBuyer: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        users: {
          where: { isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /customers - Create a new customer organization
router.post('/', async (req, res) => {
  try {
    const { code, name, type = 'OEM', ...rest } = req.body;
    
    const customer = await prisma.organization.create({
      data: {
        code,
        name,
        type,
        ...rest,
      },
    });
    
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PATCH /customers/:id - Update customer
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const customer = await prisma.organization.update({
      where: { id },
      data: updateData,
    });
    
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// GET /customers/:id/preferences — get full preferences for a customer
router.get('/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;

    const pref = await prisma.customerPreference.findUnique({
      where: { customerId: id },
    });

    if (!pref) {
      return res.json({ data: null, hasPreferences: false });
    }

    res.json({ data: pref, hasPreferences: true });
  } catch (error) {
    console.error('Error getting customer preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// PUT /customers/:id/preferences — create or update preferences
router.put('/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Verify customer exists
    const customer = await prisma.organization.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Build the data object from body, filtering known fields
    const data = {
      preferredBranch: body.preferredBranch || null,
      preferredShipMethod: body.preferredShipMethod || null,
      defaultDivision: body.defaultDivision || null,
      preferredCarrier: body.preferredCarrier || null,
      freightTerms: body.freightTerms || null,
      deliveryWindow: body.deliveryWindow || null,
      shipToAddress: body.shipToAddress || null,
      defaultPriority: body.defaultPriority || 'STANDARD',
      rushDefault: Boolean(body.rushDefault),
      defaultOwnership: body.defaultOwnership || 'HOUSE',
      requirePONumber: Boolean(body.requirePONumber),
      autoApplyContract: body.autoApplyContract !== false,
      autoApproveOrders: Boolean(body.autoApproveOrders),
      minOrderQty: body.minOrderQty ? parseFloat(body.minOrderQty) : null,
      minOrderValue: body.minOrderValue ? parseFloat(body.minOrderValue) : null,
      pricingTier: body.pricingTier || null,
      discountPct: body.discountPct ? parseFloat(body.discountPct) : null,
      fuelSurchargeExempt: Boolean(body.fuelSurchargeExempt),
      paymentTerms: body.paymentTerms || null,
      creditLimit: body.creditLimit ? parseFloat(body.creditLimit) : null,
      contractNotes: body.contractNotes || null,
      tolerancePreset: body.tolerancePreset || 'STANDARD',
      tolerancePlus: body.tolerancePlus != null ? parseFloat(body.tolerancePlus) : 0.010,
      toleranceMinus: body.toleranceMinus != null ? parseFloat(body.toleranceMinus) : 0.010,
      approvedGrades: body.approvedGrades || null,
      surfaceFinish: body.surfaceFinish || null,
      specialSpecs: body.specialSpecs || null,
      certRequirements: body.certRequirements || null,
      autoSendMTR: Boolean(body.autoSendMTR),
      autoSendInvoice: Boolean(body.autoSendInvoice),
      mtrEmail: body.mtrEmail || null,
      invoiceEmail: body.invoiceEmail || null,
      bundleMaxWeight: body.bundleMaxWeight ? parseFloat(body.bundleMaxWeight) : null,
      bundleMaxPieces: body.bundleMaxPieces ? parseInt(body.bundleMaxPieces) : null,
      packagingType: body.packagingType || null,
      labelTemplate: body.labelTemplate || null,
      packagingNotes: body.packagingNotes || null,
      specialInstructions: body.specialInstructions || null,
      internalNotes: body.internalNotes || null,
      updatedBy: body.updatedBy || null,
    };

    const pref = await prisma.customerPreference.upsert({
      where: { customerId: id },
      create: { customerId: id, ...data },
      update: data,
    });

    res.json({ data: pref, success: true });
  } catch (error) {
    console.error('Error saving customer preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// DELETE /customers/:id/preferences — reset preferences
router.delete('/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customerPreference.deleteMany({
      where: { customerId: id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting customer preferences:', error);
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

export default router;
