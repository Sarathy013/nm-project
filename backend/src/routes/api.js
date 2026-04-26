/**
 * API Routes
 * Express router for all API endpoints
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleQuery,
  handleCompare,
  handleStats,
  handleClearKB
} from '../controllers/queryController.js';
import {
  handleUpload,
  handleListDocuments,
  handleDeleteDocument,
  handleIngestText
} from '../controllers/documentController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.txt'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and TXT files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// ============ Query Endpoints ============

/**
 * @route POST /api/query
 * @desc Process natural language query through RAG pipeline
 */
router.post('/query', handleQuery);

/**
 * @route POST /api/compare
 * @desc Compare RAG vs Baseline responses
 */
router.post('/compare', handleCompare);

/**
 * @route GET /api/stats
 * @desc Get knowledge base statistics
 */
router.get('/stats', handleStats);

/**
 * @route DELETE /api/knowledge-base
 * @desc Clear the knowledge base
 */
router.delete('/knowledge-base', handleClearKB);

// ============ Document Endpoints ============

/**
 * @route POST /api/documents/upload
 * @desc Upload and process a medical document (PDF/TXT)
 */
router.post('/documents/upload', upload.single('document'), handleUpload);

/**
 * @route GET /api/documents
 * @desc List all uploaded documents
 */
router.get('/documents', handleListDocuments);

/**
 * @route DELETE /api/documents/:id
 * @desc Delete a document
 */
router.delete('/documents/:id', handleDeleteDocument);

/**
 * @route POST /api/documents/ingest-text
 * @desc Ingest raw text content
 */
router.post('/documents/ingest-text', handleIngestText);

// ============ Health Check ============

/**
 * @route GET /api/health
 * @desc Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Medical RAG API'
  });
});

export default router;
