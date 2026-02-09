/**
 * FileUploadZone — Reusable drag-and-drop file upload component.
 *
 * Props:
 *   entityType   – e.g. 'HEAT', 'PRODUCT', 'INVENTORY', 'SCAR', 'CLAIM', etc.
 *   entityId     – ID of the entity the files are linked to
 *   docType      – optional document sub-type (e.g. 'MTC', 'CAR', 'CERT')
 *   accept       – MIME types string, e.g. 'application/pdf,image/*'
 *   multiple     – allow multiple files (default false)
 *   maxSizeMB    – max file size in MB (default 25)
 *   onUploaded   – callback(doc) after successful upload
 *   onError      – callback(err) on failure
 *   compact      – render small inline button instead of full drop-zone
 *   buttonLabel  – label override for compact mode (default "Upload File")
 *   sx           – extra styles
 */

import { useState, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Chip,
  Stack,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material'
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as DoneIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocFileIcon,
} from '@mui/icons-material'
import { uploadDocument, uploadMultipleDocuments } from '../../api/documents'

const FILE_ICONS = {
  'application/pdf': PdfIcon,
  'image/jpeg': ImageIcon,
  'image/png': ImageIcon,
  'image/gif': ImageIcon,
  'image/webp': ImageIcon,
}

function getFileIcon(mimeType) {
  const Icon = FILE_ICONS[mimeType] || DocFileIcon
  return <Icon color="action" />
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default function FileUploadZone({
  entityType,
  entityId,
  docType,
  accept,
  multiple = false,
  maxSizeMB = 25,
  onUploaded,
  onError,
  compact = false,
  buttonLabel,
  sx,
}) {
  const inputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState([])          // queued files
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState([])       // { file, doc, error }
  const [error, setError] = useState(null)

  const maxBytes = maxSizeMB * 1024 * 1024

  const validateFiles = useCallback((fileList) => {
    const valid = []
    for (const f of fileList) {
      if (f.size > maxBytes) {
        setError(`"${f.name}" exceeds ${maxSizeMB} MB limit`)
        continue
      }
      valid.push(f)
    }
    return valid
  }, [maxBytes, maxSizeMB])

  const handleFiles = useCallback((fileList) => {
    setError(null)
    const arr = Array.from(fileList)
    const valid = validateFiles(arr)
    if (!multiple) {
      setFiles(valid.slice(0, 1))
    } else {
      setFiles(prev => [...prev, ...valid])
    }
  }, [multiple, validateFiles])

  // Drag handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) {
      handleFiles(e.dataTransfer.files)
    }
  }, [handleFiles])

  const handleInputChange = (e) => {
    if (e.target.files?.length) {
      handleFiles(e.target.files)
    }
    // reset so same file can be re-selected
    e.target.value = ''
  }

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpload = async () => {
    if (files.length === 0) return
    setUploading(true)
    setProgress(0)
    setResults([])
    setError(null)

    try {
      const opts = { entityType, entityId, type: docType }

      if (files.length === 1) {
        const doc = await uploadDocument(files[0], opts, setProgress)
        setResults([{ file: files[0], doc }])
        onUploaded?.(doc)
      } else {
        const res = await uploadMultipleDocuments(files, opts, setProgress)
        const docs = res.data || []
        setResults(docs.map((doc, i) => ({ file: files[i], doc })))
        docs.forEach(doc => onUploaded?.(doc))
      }
      setFiles([])
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed'
      setError(msg)
      onError?.(msg)
    } finally {
      setUploading(false)
    }
  }

  // ─── Compact mode: simple button + hidden input ───
  if (compact) {
    const handleCompactUpload = async (e) => {
      const fileList = e.target.files
      if (!fileList?.length) return
      e.target.value = ''
      setUploading(true)
      setError(null)
      try {
        const arr = validateFiles(Array.from(fileList))
        if (arr.length === 0) return
        const opts = { entityType, entityId, type: docType }
        if (arr.length === 1) {
          const doc = await uploadDocument(arr[0], opts)
          onUploaded?.(doc)
        } else {
          const res = await uploadMultipleDocuments(arr, opts)
          ;(res.data || []).forEach(doc => onUploaded?.(doc))
        }
      } catch (err) {
        const msg = err.response?.data?.error || err.message || 'Upload failed'
        setError(msg)
        onError?.(msg)
      } finally {
        setUploading(false)
      }
    }

    return (
      <Box sx={sx}>
        <input
          ref={inputRef}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          onChange={handleCompactUpload}
        />
        <Button
          variant="outlined"
          size="small"
          startIcon={<UploadIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : (buttonLabel || 'Upload File')}
        </Button>
        {error && (
          <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>
    )
  }

  // ─── Full drop-zone mode ───
  return (
    <Box sx={sx}>
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
      />

      {/* Drop zone */}
      <Box
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          bgcolor: dragActive ? 'primary.light' : 'grey.50',
          cursor: uploading ? 'default' : 'pointer',
          transition: 'all 0.2s',
          '&:hover': uploading ? {} : { borderColor: 'primary.main', bgcolor: 'primary.light' },
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <UploadIcon sx={{ fontSize: 40, color: 'action.active', mb: 1 }} />
        <Typography variant="body1" fontWeight={500}>
          {dragActive ? 'Drop files here' : 'Drag & drop files here, or click to browse'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Max {maxSizeMB} MB per file • PDF, images, Word, Excel, CSV
        </Typography>
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Queued files */}
      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <List dense>
            {files.map((f, idx) => (
              <ListItem key={`${f.name}-${idx}`}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  {getFileIcon(f.type)}
                </ListItemIcon>
                <ListItemText
                  primary={f.name}
                  secondary={formatBytes(f.size)}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" size="small" onClick={() => removeFile(idx)} disabled={uploading}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>

          {uploading && <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, borderRadius: 1 }} />}

          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<UploadIcon />}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? `Uploading ${progress}%` : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
            </Button>
            <Button
              size="small"
              onClick={() => setFiles([])}
              disabled={uploading}
            >
              Clear
            </Button>
          </Stack>
        </Box>
      )}

      {/* Upload results */}
      {results.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {results.map((r, idx) => (
            <Chip
              key={idx}
              icon={<DoneIcon />}
              label={r.file?.name || r.doc?.fileName}
              color="success"
              variant="outlined"
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
