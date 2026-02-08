import { Router } from 'express';
import prisma from '../lib/db.js';

const router = Router();

// GET /documents - List documents with optional filters
router.get('/', async (req, res) => {
  try {
    const { type, organizationId, limit = '50', offset = '0' } = req.query;
    
    const where = {};
    
    if (type) {
      where.type = type;
    }
    
    if (organizationId) {
      where.organizationId = organizationId;
    }
    
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          createdAt: true,
          organization: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.document.count({ where }),
    ]);
    
    res.json({
      data: documents,
      meta: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /documents/:id - Get document details and download URL
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        uploadedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      ...document,
      downloadUrl: `/api/documents/${id}/download`,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// GET /documents/:id/download - Download document (placeholder)
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      message: 'Document download endpoint - implement file streaming in production',
      storagePath: document.storagePath,
      fileName: document.fileName,
      mimeType: document.mimeType,
    });
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// POST /documents - Upload a new document (metadata only - file upload handled separately)
router.post('/', async (req, res) => {
  try {
    const { type, fileName, mimeType, sizeBytes, storagePath, organizationId, uploadedById } = req.body;
    
    const document = await prisma.document.create({
      data: {
        type,
        fileName,
        mimeType,
        sizeBytes: sizeBytes ? parseInt(sizeBytes) : null,
        storagePath,
        organizationId,
        uploadedById,
      },
    });
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// DELETE /documents/:id - Delete document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.document.delete({
      where: { id },
    });
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
