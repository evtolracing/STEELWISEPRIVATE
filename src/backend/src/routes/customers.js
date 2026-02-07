import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET /customers - Search customers (organizations that can be buyers)
router.get('/', async (req, res) => {
  try {
    const { search, type, limit = '50', offset = '0' } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
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

export default router;
