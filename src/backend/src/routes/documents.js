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

// With no writable disk the file is kept in the database, and the host caps a
// request at about 4.5 MB, so the limit there is 4 MB.
const MAX_BYTES = (isVercel ? 4 : 25) * 1024 * 1024;
const MAX_LABEL = `${MAX_BYTES / 1024 / 1024} MB`;
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_BYTES },
});

const router = Router();

/** Runs a multer upload and answers a refused file (wrong type, too large) with a 400. */
const accept = (uploader) => (req, res, next) => uploader(req, res, (err) => {
  if (!err) return next();
  const tooBig = err.code === 'LIMIT_FILE_SIZE';
  res.status(tooBig ? 413 : 400).json({ error: tooBig ? `That file is larger than the ${MAX_LABEL} limit` : err.message || 'That file could not be accepted' });
});

// The screens use `type`, `mimeType`, `sizeBytes` and `organizationId`; the
// table stores them as documentType, fileType, fileSizeBytes and ownerId.
const DOCUMENT_TYPES = ['MTR', 'CERT', 'BOL', 'POD', 'INVOICE', 'SPEC', 'COA', 'MSDS', 'DRAWING', 'OTHER'];
const TYPE_ALIASES = { MTC: 'MTR', CERTIFICATE: 'CERT', COC: 'CERT', SDS: 'MSDS' };
function documentTypeFor(value) {
  const key = String(value || '').toUpperCase();
  if (DOCUMENT_TYPES.includes(key)) return key;
  return TYPE_ALIASES[key] || 'OTHER';
}
function toApi(doc) {
  if (!doc) return doc;
  const { storagePath, ...rest } = doc;
  return {
    ...rest,
    type: doc.documentType,
    mimeType: doc.fileType,
    sizeBytes: doc.fileSizeBytes,
    organizationId: doc.ownerId,
    downloadUrl: `/api/documents/${doc.id}/download`,
  };
}
const NOT_LINKABLE = 'Documents cannot be attached to this kind of record until the pending database update has been applied.';
const NO_STORAGE = 'Files cannot be stored until the pending database update has been applied.';
const IN_DATABASE = 'database';
const bytesOf = (file) => file.buffer || fs.readFileSync(file.path);
const sha256 = (file) => crypto.createHash('sha256').update(bytesOf(file)).digest('hex');
const removeFile = (file) => { if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path); };

async function saveUpload(file, body) {
  const { entityType, entityId, type, organizationId } = body;
  const document = await prisma.document.create({
    data: {
      documentType: documentTypeFor(type || entityType),
      title: body.title || undefined,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSizeBytes: file.size,
      storagePath: file.path || IN_DATABASE,
      checksum: sha256(file),
      ownerId: organizationId || undefined,
      // No disk on this host: the file itself is kept in the database.
      ...(file.path ? {} : { blob: { create: { data: file.buffer } } }),
    },
  });
  if (entityType && entityId) {
    try {
      await prisma.documentLink.create({ data: { documentId: document.id, entityType, entityId } });
    } catch (error) {
      // Until the "document links any record" database update is applied, links only work for stock items.
      await prisma.document.delete({ where: { id: document.id } }).catch(() => {});
      if (error?.code === 'P2003') throw Object.assign(new Error('NOT_LINKABLE'), { notLinkable: true });
      throw error;
    }
    // A mill cert uploaded on a heat becomes that heat's cert of record.
    if (entityType === 'HEAT' && document.documentType === 'MTR') {
      await prisma.heat.updateMany({ where: { id: entityId }, data: { mtrDocumentId: document.id } });
    }
  }
  return document;
}

// GET /documents - List documents
router.get('/', async (req, res) => {
  try {
    const { type, organizationId } = req.query;
    const take = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const where = {};
    if (type) {
      if (!DOCUMENT_TYPES.includes(String(type).toUpperCase()) && !TYPE_ALIASES[String(type).toUpperCase()]) {
        return res.status(400).json({ error: `type must be one of: ${DOCUMENT_TYPES.join(', ')}` });
      }
      where.documentType = documentTypeFor(type);
    }
    if (organizationId) where.ownerId = String(organizationId);

    const [documents, total] = await Promise.all([
      prisma.document.findMany({ where, take, skip, orderBy: { createdAt: 'desc' }, include: { owner: { select: { id: true, name: true, code: true } } } }),
      prisma.document.count({ where }),
    ]);
    res.json({ data: documents.map(toApi), meta: { total, limit: take, offset: skip } });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// GET /documents/entity/:entityType/:entityId - Documents linked to a heat, stock item, order…
router.get('/entity/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const links = await prisma.documentLink.findMany({ where: { entityType, entityId }, include: { document: true }, orderBy: { createdAt: 'desc' } });
    res.json({ data: links.map((l) => ({ ...toApi(l.document), linkId: l.id })) });
  } catch (error) {
    console.error('Error fetching entity documents:', error);
    res.status(500).json({ error: 'Failed to fetch entity documents' });
  }
});

// GET /documents/:id - Get document by ID
router.get('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: req.params.id },
      include: { owner: { select: { id: true, name: true, code: true } }, links: true },
    });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    res.json(toApi(document));
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// GET /documents/:id/download - Download document file
router.get('/:id/download', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    const onDisk = document.storagePath && document.storagePath !== IN_DATABASE && fs.existsSync(document.storagePath);
    const stored = onDisk ? null : await prisma.documentBlob.findUnique({ where: { documentId: document.id } }).catch(() => null);
    if (!onDisk && !stored) {
      return res.status(404).json({ error: 'The file for this document is not available', fileName: document.fileName });
    }
    res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${String(document.fileName).replace(/["\r\n]/g, '')}"`);
    if (stored) return res.end(Buffer.from(stored.data));
    if (document.fileSizeBytes) res.setHeader('Content-Length', document.fileSizeBytes);
    fs.createReadStream(document.storagePath).pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// POST /documents/upload - Upload a file and create a Document record
router.post('/upload', accept(upload.single('file')), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    res.status(201).json(toApi(await saveUpload(req.file, req.body || {})));
  } catch (error) {
    removeFile(req.file);
    if (error?.notLinkable) return res.status(409).json({ error: NOT_LINKABLE });
    if (error?.code === 'P2021') return res.status(409).json({ error: NO_STORAGE });
    if (error?.name === 'PrismaClientValidationError') return res.status(400).json({ error: 'The upload has a field that is not valid' });
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// POST /documents/upload-multiple - Upload multiple files at once
router.post('/upload-multiple', accept(upload.array('files', 10)), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files provided' });
    const documents = [];
    for (const file of req.files) documents.push(toApi(await saveUpload(file, req.body || {})));
    res.status(201).json({ data: documents, count: documents.length });
  } catch (error) {
    for (const file of req.files || []) removeFile(file);
    if (error?.notLinkable) return res.status(409).json({ error: NOT_LINKABLE });
    if (error?.code === 'P2021') return res.status(409).json({ error: NO_STORAGE });
    console.error('Error uploading documents:', error);
    res.status(500).json({ error: 'Failed to upload documents' });
  }
});

// DELETE /documents/:id - Delete document and its file
router.delete('/:id', async (req, res) => {
  try {
    const document = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!document) return res.status(404).json({ error: 'Document not found' });
    await prisma.$transaction([
      prisma.heat.updateMany({ where: { mtrDocumentId: document.id }, data: { mtrDocumentId: null } }),
      prisma.documentLink.deleteMany({ where: { documentId: document.id } }),
      prisma.document.delete({ where: { id: document.id } }),
    ]);
    // Only remove files this module stored.
    if (document.storagePath && path.resolve(document.storagePath).startsWith(path.resolve(uploadsDir) + path.sep)) removeFile({ path: document.storagePath });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
