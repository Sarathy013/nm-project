/**
 * Query Controller
 * Handles incoming query requests
 */

import ragService from '../services/ragService.js';

/**
 * POST /api/query
 * Process a natural language query through RAG pipeline
 */
export const handleQuery = async (req, res) => {
  try {
    const { query, useRAG = true, includeContext = true } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required and must be a non-empty string'
      });
    }

    const result = await ragService.query(query, { useRAG, includeContext });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/compare
 * Compare RAG vs Baseline for a query
 */
export const handleCompare = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    const result = await ragService.compare(query);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/stats
 * Get knowledge base statistics
 */
export const handleStats = async (req, res) => {
  try {
    await ragService.initialize();
    const stats = ragService.getStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * DELETE /api/knowledge-base
 * Clear the knowledge base
 */
export const handleClearKB = async (req, res) => {
  try {
    const result = await ragService.clearKnowledgeBase();
    res.json(result);
  } catch (error) {
    console.error('Clear KB error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
