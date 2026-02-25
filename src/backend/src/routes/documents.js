import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import prisma from '../lib/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists (skip on Vercel's read-only filesystem)
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const isVercel = !!process.env.VERCEL;
if (!isVercel && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = isVercel ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => {
    // Organize by entity type subdirectory
    const entityType = req.body.entityType || 'general';
    const dir = path.join(uploadsDir, entityType.toLowerCase());
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter – allow common document types
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

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

// GET /documents/:id/download - Download document file
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    const document = await prisma.document.findUnique({
      where: { id },
    });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Stream the actual file if it exists on disk
    if (document.storagePath && fs.existsSync(document.storagePath)) {
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      if (document.sizeBytes) {
        res.setHeader('Content-Length', document.sizeBytes);
      }
      const stream = fs.createReadStream(document.storagePath);
      stream.pipe(res);
    } else {
      res.status(404).json({
        error: 'File not found on disk',
        storagePath: document.storagePath,
        fileName: document.fileName,
      });
    }
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// POST /documents/upload - Upload a file and create a Document record
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { entityType, entityId, type, organizationId, uploadedById } = req.body;

    // Compute checksum
    const fileBuffer = fs.readFileSync(req.file.path);
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // Create document record
    const document = await prisma.document.create({
      data: {
        type: type || entityType || 'OTHER',
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        storagePath: req.file.path,
        checksum,
        organizationId: organizationId || undefined,
        uploadedById: uploadedById || undefined,
      },
    });

    // If entityType + entityId provided, create a DocumentLink
    if (entityType && entityId) {
      try {
        await prisma.documentLink.create({
          data: {
            documentId: document.id,
            entityType,
            entityId,
          },
        });
      } catch (linkErr) {
        console.warn('DocumentLink creation skipped (table may not exist):', linkErr.message);
      }

      // Special case: if linking MTR to a Heat, update the heat's mtrDocumentId
      if (entityType === 'HEAT' && (type === 'MTC' || type === 'MTR')) {
        try {
          await prisma.heat.update({
            where: { id: entityId },
            data: { mtrDocumentId: document.id },
          });
        } catch (heatErr) {
          console.warn('Heat mtrDocumentId update skipped:', heatErr.message);
        }
      }
    }

    res.status(201).json({
      ...document,
      downloadUrl: `/api/documents/${document.id}/download`,
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// POST /documents/upload-multiple - Upload multiple files at once
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const { entityType, entityId, type, organizationId, uploadedById } = req.body;
    const documents = [];

    for (const file of req.files) {
      const fileBuffer = fs.readFileSync(file.path);
      const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      const doc = await prisma.document.create({
        data: {
          type: type || entityType || 'OTHER',
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storagePath: file.path,
          checksum,
          organizationId: organizationId || undefined,
          uploadedById: uploadedById || undefined,
        },
      });

      if (entityType && entityId) {
        try {
          await prisma.documentLink.create({
            data: { documentId: doc.id, entityType, entityId },
          });
        } catch (_) { /* skip if table doesn't exist */ }
      }

      documents.push({ ...doc, downloadUrl: `/api/documents/${doc.id}/download` });
    }

    res.status(201).json({ data: documents, count: documents.length });
  } catch (error) {
    console.error('Error uploading multiple documents:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// GET /documents/entity/:entityType/:entityId - Get documents linked to an entity
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    // Try DocumentLink table first
    let documents = [];
    try {
      const links = await prisma.documentLink.findMany({
        where: { entityType, entityId },
        include: {
          document: {
            select: {
              id: true, type: true, fileName: true, mimeType: true,
              sizeBytes: true, createdAt: true, checksum: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      documents = links.map(l => ({
        ...l.document,
        downloadUrl: `/api/documents/${l.document.id}/download`,
        linkId: l.id,
      }));
    } catch {
      // Fallback: query documents by type matching entityType
      const fallback = await prisma.document.findMany({
        where: { type: entityType },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      documents = fallback.map(d => ({
        ...d,
        downloadUrl: `/api/documents/${d.id}/download`,
      }));
    }

    res.json({ data: documents });
  } catch (error) {
    console.error('Error fetching entity documents:', error);
    res.status(500).json({ error: 'Failed to fetch entity documents' });
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
