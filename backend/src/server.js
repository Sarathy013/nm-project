/**
 * Medical Document Intelligence System
 * Express API Server
 *
 * A local, privacy-preserving RAG system for medical document queries
 * No cloud dependencies - all processing happens on-premise
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

import apiRoutes from './routes/api.js';
import ollamaService from './services/ollamaService.js';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 7000;

// Initialize Express app
const app = express();

// ============ Middleware ============

// CORS for frontend communication
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// JSON body parser
app.use(express.json({ limit: '10mb' }));

// URL-encoded body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============ API Routes ============

app.use('/api', apiRoutes);

// ============ Error Handling ============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);

  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds limit (10MB)'
    });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ============ Server Startup ============

async function startServer() {
  // Ensure required directories exist
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../vector_store'),
    path.join(__dirname, '../data')
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }

  // Check Ollama availability
  console.log('Checking Ollama service...');
  const ollamaHealth = await ollamaService.healthCheck();

  if (ollamaHealth.available) {
    console.log('✓ Ollama is running');
    console.log(`  Models: ${ollamaHealth.models.map(m => m.name).join(', ') || 'none detected'}`);
  } else {
    console.warn('⚠ Ollama is not running. LLM features will be unavailable.');
    console.warn('  Start Ollama with: ollama serve');
  }

  // Start server
  const server = app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║     Medical Document Intelligence System                  ║');
    console.log('║     Local LLM + RAG for Healthcare                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`API Server running on http://localhost:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log('  POST /api/query          - Query medical documents');
    console.log('  POST /api/compare        - Compare RAG vs Baseline');
    console.log('  POST /api/documents/upload - Upload document (PDF/TXT)');
    console.log('  GET  /api/documents      - List documents');
    console.log('  GET  /api/stats          - Knowledge base stats');
    console.log('  GET  /api/health         - Health check');
    console.log('');
    console.log('Privacy: All processing is local. No data leaves this system.');
    console.log('');
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Failed to start server: port ${PORT} is already in use.`);
      console.error('Please stop the process occupying that port or set PORT to a different value.');
      process.exit(1);
    }

    console.error('Server error:', err);
    process.exit(1);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
