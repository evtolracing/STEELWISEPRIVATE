import { Router } from 'express';
import prisma from '../lib/db.js';
import { ci } from '../lib/dbText.js';
import { MONEY_MANAGERS } from '../lib/roleAccess.js';
import { TIER_TO_LEVEL, levelForTier } from '../lib/priceRules.js';

// The pricing tier on this screen is the one prices are worked out from
// (CustomerPricingTier on the top-level account, see lib/customerPricing.js).
const TIER_MARGINS = { A: [15, 22], B: [18, 25], C: [22, 30], D: [28, 35] };
async function topAccountId(id) {
  let org = await prisma.organization.findUnique({ where: { id }, select: { id: true, parentId: true } });
  for (let i = 0; i < 5 && org?.parentId; i++) {
    const parent = await prisma.organization.findUnique({ where: { id: org.parentId }, select: { id: true, parentId: true } });
    if (!parent) break;
    org = parent;
  }
  return org?.id || id;
}
const tierInForce = (tier) => (tier && levelForTier(tier) !== 'RETAIL' ? tier.tierCode : tier?.isActive && tier.tierCode === 'D' ? 'D' : '');
const sameAmount = (a, b) => (a == null && b == null) || (a != null && b != null && Math.abs(Number(a) - Number(b)) < 0.005);

const router = Router();

// GET /customers - Search customers (organizations that can be buyers)
router.get('/', async (req, res) => {
  try {
    const { search, type, limit = '50', offset = '0' } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, ...ci } },
        { code: { contains: search, ...ci } },
        { phone: { contains: search, ...ci } },
        { email: { contains: search, ...ci } },
        { city: { contains: search, ...ci } },
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

// The account fields a screen may set. Anything else in the request is ignored,
// so a request cannot rewrite ids, codes or timestamps.
const TEXT_FIELDS = ['name', 'address', 'city', 'state', 'postalCode', 'country', 'phone', 'email', 'paymentTerms'];
const accountFields = (body = {}) => {
  const data = {};
  for (const f of TEXT_FIELDS) {
    if (body[f] !== undefined) data[f] = body[f] == null ? null : String(body[f]).trim();
  }
  if (data.country === null || data.country === '') delete data.country;
  if (body.taxExempt !== undefined) data.taxExempt = body.taxExempt === true || body.taxExempt === 'true';
  if (body.isActive !== undefined) data.isActive = body.isActive === true || body.isActive === 'true';
  if (body.parentId !== undefined) data.parentId = body.parentId || null;
  if (body.type !== undefined) data.type = body.type;
  return data;
};

// POST /customers - Create a new customer organization
router.post('/', async (req, res) => {
  try {
    const { code, name, type = 'OEM' } = req.body || {};
    if (!code || !String(code).trim() || !name || !String(name).trim()) {
      return res.status(400).json({ error: 'A customer needs a code and a name' });
    }
    if (await prisma.organization.findUnique({ where: { code: String(code).trim() } })) {
      return res.status(409).json({ error: `Customer code ${code} is already in use` });
    }

    const customer = await prisma.organization.create({
      data: {
        ...accountFields(req.body),
        code: String(code).trim(),
        name: String(name).trim(),
        type,
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
    const before = await prisma.organization.findUnique({ where: { id } });
    if (!before) return res.status(404).json({ error: 'Customer not found' });
    const updateData = accountFields(req.body);
    if (updateData.name !== undefined && !updateData.name) return res.status(400).json({ error: 'A customer needs a name' });
    if (updateData.parentId) {
      if (updateData.parentId === id) return res.status(400).json({ error: 'An account cannot be its own parent' });
      if (!(await prisma.organization.findUnique({ where: { id: updateData.parentId } }))) return res.status(400).json({ error: 'Parent account not found' });
    }

    const taxChanged = updateData.taxExempt !== undefined && updateData.taxExempt !== before.taxExempt;
    const customer = await prisma.$transaction(async (tx) => {
      const saved = await tx.organization.update({ where: { id }, data: updateData });
      // Tax-exempt status changes what the customer is charged, so every change is on the record.
      if (taxChanged) {
        await tx.auditLog.create({
          data: {
            category: 'FINANCIAL', eventType: 'CUSTOMER_TAX_STATUS_CHANGED', severity: 'WARNING', action: 'UPDATE', userId: req.user.id,
            resourceType: 'Organization', resourceId: id,
            details: { customer: before.name, from: before.taxExempt, to: saved.taxExempt, by: req.user.email },
          },
        });
      }
      return saved;
    });

    res.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

const STAFF_ONLY_PREFERENCES = ['internalNotes', 'contractNotes', 'updatedBy', 'pricingTier', 'priceLevel', 'discountPct', 'creditLimit', 'autoApproveOrders', 'minOrderQty', 'minOrderValue'];

// GET /customers/:id/preferences — get full preferences for a customer
router.get('/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;

    const pref = await prisma.customerPreference.findUnique({
      where: { customerId: id },
    });

    // The tier and credit limit shown are the ones in force for the account.
    const tier = await prisma.customerPricingTier.findUnique({ where: { customerId: await topAccountId(id) } });
    const live = tier ? { pricingTier: tierInForce(tier), priceLevel: levelForTier(tier), creditLimit: tier.creditLimit == null ? null : Number(tier.creditLimit) } : { pricingTier: '', priceLevel: 'RETAIL' };

    // A customer login reads its own store defaults, never the staff-only notes and terms.
    const forCustomer = req.user?.role === 'CUSTOMER' || Boolean(req.user?.customerId);
    if (!pref) {
      return res.json({ data: tier && !forCustomer ? live : null, hasPreferences: false });
    }
    Object.assign(pref, live.creditLimit === undefined ? { pricingTier: live.pricingTier } : live, { priceLevel: live.priceLevel });
    if (forCustomer) {
      for (const f of STAFF_ONLY_PREFERENCES) delete pref[f];
    }

    res.json({ data: pref, hasPreferences: true });
  } catch (error) {
    console.error('Error getting customer preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// PUT /customers/:id/preferences — create or update preferences
// A tolerance in inches: the number given when it is a real, non-negative one, else the standard value.
const tol = (value, standard) => {
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 0 ? n : standard;
};

router.put('/:id/preferences', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Verify customer exists
    const customer = await prisma.organization.findUnique({ where: { id } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Pricing tier and credit limit change what the customer pays and may owe,
    // so only a manager changes them. They are saved on the top-level account.
    const wantTier = body.pricingTier ? String(body.pricingTier).toUpperCase() : '';
    if (wantTier && !TIER_TO_LEVEL[wantTier]) return res.status(400).json({ error: 'Pricing tier must be A, B, C or D' });
    const wantLimit = body.creditLimit === '' || body.creditLimit == null ? null : Number(body.creditLimit);
    if (wantLimit !== null && !(Number.isFinite(wantLimit) && wantLimit >= 0)) return res.status(400).json({ error: 'Credit limit must be zero or more' });
    const accountId = await topAccountId(id);
    const tier = await prisma.customerPricingTier.findUnique({ where: { customerId: accountId } });
    const tierChanged = wantTier !== tierInForce(tier);
    const limitChanged = !sameAmount(wantLimit, tier?.creditLimit ?? null);
    if ((tierChanged || limitChanged) && !MONEY_MANAGERS.has(req.user?.role)) {
      return res.status(403).json({ error: 'Only a manager can change a customer\'s pricing tier or credit limit' });
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
      pricingTier: wantTier || null,
      discountPct: body.discountPct ? parseFloat(body.discountPct) : null,
      fuelSurchargeExempt: Boolean(body.fuelSurchargeExempt),
      paymentTerms: body.paymentTerms || null,
      creditLimit: wantLimit,
      contractNotes: body.contractNotes || null,
      tolerancePreset: body.tolerancePreset || 'STANDARD',
      thkTolerancePlus: tol(body.thkTolerancePlus, 0.010),
      thkToleranceMinus: tol(body.thkToleranceMinus, 0.010),
      lenTolerancePlus: tol(body.lenTolerancePlus, 0.125),
      lenToleranceMinus: tol(body.lenToleranceMinus, 0),
      widTolerancePlus: tol(body.widTolerancePlus, 0.063),
      widToleranceMinus: tol(body.widToleranceMinus, 0.031),
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
      updatedBy: req.user?.email || req.user?.id || null,
    };

    const pref = await prisma.$transaction(async (tx) => {
      if (tierChanged || limitChanged) {
        const code = wantTier || tier?.tierCode || 'D';
        const [marginFloor, marginTarget] = TIER_MARGINS[code];
        const change = {
          tierCode: code,
          isActive: Boolean(wantTier),
          creditLimit: wantLimit,
          // A newly chosen tier starts now and has no end date.
          ...(tierChanged && wantTier ? { effectiveFrom: new Date(), effectiveUntil: null, marginFloor, marginTarget } : {}),
        };
        await tx.customerPricingTier.upsert({
          where: { customerId: accountId },
          update: change,
          create: { customerId: accountId, marginFloor, marginTarget, ...change },
        });
        await tx.auditLog.create({ data: {
          category: 'FINANCIAL', eventType: 'CUSTOMER_PRICING_CHANGED', severity: 'WARNING', action: 'UPDATE', userId: req.user.id,
          resourceType: 'Organization', resourceId: accountId,
          fieldChanges: { pricingTier: { from: tierInForce(tier), to: wantTier }, creditLimit: { from: tier?.creditLimit == null ? null : Number(tier.creditLimit), to: wantLimit } },
        } });
      }
      return tx.customerPreference.upsert({
        where: { customerId: id },
        create: { customerId: id, ...data },
        update: data,
      });
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
