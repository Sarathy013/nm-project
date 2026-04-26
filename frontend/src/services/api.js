/**
 * API Service
 * Frontend client for backend API communication
 */

import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Query the RAG system
 */
export const queryRAG = async (query, useRAG = true) => {
  const response = await api.post('/query', { query, useRAG, includeContext: true });
  return response.data;
};

/**
 * Compare RAG vs Baseline
 */
export const compareResponses = async (query) => {
  const response = await api.post('/compare', { query });
  return response.data;
};

/**
 * Upload a document
 */
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('document', file);

  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Ingest text content
 */
export const ingestText = async (text, name) => {
  const response = await api.post('/documents/ingest-text', { text, name });
  return response.data;
};

/**
 * Get list of documents
 */
export const getDocuments = async () => {
  const response = await api.get('/documents');
  return response.data;
};

/**
 * Delete a document
 */
export const deleteDocument = async (id) => {
  const response = await api.delete(`/documents/${id}`);
  return response.data;
};

/**
 * Get knowledge base stats
 */
export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

/**
 * Clear knowledge base
 */
export const clearKnowledgeBase = async () => {
  const response = await api.delete('/knowledge-base');
  return response.data;
};

/**
 * Health check
 */
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};
