/**
 * Document Controller
 * Handles document upload, parsing, and indexing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import documentService from '../services/documentService.js';
import embeddingService from '../services/embeddingService.js';
import ragService from '../services/ragService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * POST /api/documents/upload
 * Upload and process a medical document
 */
export const handleUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { originalname, path: filePath } = req.file;

    // Parse the file to extract text
    const text = await documentService.parseFile(req.file);

    if (!text || text.trim().length === 0) {
      // Clean up empty file
      await fs.unlink(filePath).catch(() => {});
      return res.status(400).json({
        success: false,
        error: 'No text could be extracted from the file'
      });
    }

    // Create metadata
    const metadata = {
      filename: originalname,
      uploadedAt: new Date().toISOString()
    };

    // Chunk the text
    const chunks = documentService.chunkText(text, metadata);

    if (chunks.length === 0) {
      await fs.unlink(filePath).catch(() => {});
      return res.status(400).json({
        success: false,
        error: 'Document could not be chunked into meaningful sections'
      });
    }

    // Generate embeddings for chunks
    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    const embeddings = await embeddingService.embedBatch(chunks.map(c => c.text));

    // Attach embeddings to chunks
    chunks.forEach((chunk, i) => {
      chunk.embedding = embeddings[i];
    });

    // Add to vector store
    await ragService.addDocuments(chunks);

    // Store document record
    const docRecord = await documentService.storeDocument(
      originalname,
      path.extname(originalname),
      chunks.length
    );

    // Clean up uploaded file
    await fs.unlink(filePath).catch(() => {});

    res.json({
      success: true,
      message: `Document processed successfully`,
      document: docRecord,
      chunksProcessed: chunks.length,
      textLength: text.length
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Clean up file on error
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/documents
 * List all uploaded documents
 */
export const handleListDocuments = async (req, res) => {
  try {
    await documentService.initialize();
    const documents = documentService.getDocuments();
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('List documents error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
export const handleDeleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    await documentService.initialize();
    await documentService.deleteDocument(id);

    res.json({
      success: true,
      message: 'Document deleted'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/documents/ingest-text
 * Ingest raw text (for API-based document addition)
 */
export const handleIngestText = async (req, res) => {
  try {
    const { text, name = 'Untitled Document' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required'
      });
    }

    const metadata = {
      filename: name,
      uploadedAt: new Date().toISOString()
    };

    // Chunk the text
    const chunks = documentService.chunkText(text, metadata);

    // Generate embeddings
    const embeddings = await embeddingService.embedBatch(chunks.map(c => c.text));

    // Attach embeddings
    chunks.forEach((chunk, i) => {
      chunk.embedding = embeddings[i];
    });

    // Add to vector store
    await ragService.addDocuments(chunks);

    // Store document record
    const docRecord = await documentService.storeDocument(name, '.txt', chunks.length);

    res.json({
      success: true,
      message: 'Text ingested successfully',
      document: docRecord,
      chunksProcessed: chunks.length
    });
  } catch (error) {
    console.error('Ingest text error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
