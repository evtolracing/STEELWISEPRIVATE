import client from './client'

/**
 * Upload a single file with optional entity linking
 * @param {File} file - The File object to upload
 * @param {Object} opts - Options: entityType, entityId, type, organizationId
 * @param {Function} onProgress - Progress callback (0-100)
 * @returns {Promise<Object>} The created document record
 */
export const uploadDocument = (file, opts = {}, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  if (opts.entityType) formData.append('entityType', opts.entityType)
  if (opts.entityId) formData.append('entityId', opts.entityId)
  if (opts.type) formData.append('type', opts.type)
  if (opts.organizationId) formData.append('organizationId', opts.organizationId)

  return client.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  }).then(r => r.data)
}

/**
 * Upload multiple files at once
 * @param {File[]} files
 * @param {Object} opts
 * @param {Function} onProgress
 */
export const uploadMultipleDocuments = (files, opts = {}, onProgress) => {
  const formData = new FormData()
  files.forEach(f => formData.append('files', f))
  if (opts.entityType) formData.append('entityType', opts.entityType)
  if (opts.entityId) formData.append('entityId', opts.entityId)
  if (opts.type) formData.append('type', opts.type)
  if (opts.organizationId) formData.append('organizationId', opts.organizationId)

  return client.post('/documents/upload-multiple', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  }).then(r => r.data)
}

/** Get all documents linked to an entity */
export const getEntityDocuments = (entityType, entityId) =>
  client.get(`/documents/entity/${entityType}/${entityId}`).then(r => r.data)

/** Get a document by ID */
export const getDocument = (id) =>
  client.get(`/documents/${id}`).then(r => r.data)

/** List documents with filters */
export const getDocuments = (params) =>
  client.get('/documents', { params }).then(r => r.data)

/** Delete a document */
export const deleteDocument = (id) =>
  client.delete(`/documents/${id}`).then(r => r.data)

/** Get download URL for a document */
export const getDocumentDownloadUrl = (id) => `/api/documents/${id}/download`

export default {
  uploadDocument,
  uploadMultipleDocuments,
  getEntityDocuments,
  getDocument,
  getDocuments,
  deleteDocument,
  getDocumentDownloadUrl,
}
