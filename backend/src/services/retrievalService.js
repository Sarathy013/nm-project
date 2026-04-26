/**
 * Retrieval Service
 * Handles vector similarity search for RAG
 * Uses cosine similarity to find most relevant document chunks
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VECTOR_STORE_PATH = path.join(__dirname, '../../vector_store');
const INDEX_FILE = path.join(VECTOR_STORE_PATH, 'index.json');

class RetrievalService {
  constructor() {
    this.chunks = []; // Array of { id, text, metadata, embedding }
    this.initialized = false;
  }

  /**
   * Initialize vector store from disk
   */
  async initialize() {
    try {
      const data = await fs.readFile(INDEX_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.chunks = parsed.chunks || [];
      console.log(`Loaded ${this.chunks.length} document chunks from vector store`);
      this.initialized = true;
    } catch (error) {
      console.log('No existing vector store found, starting fresh');
      this.chunks = [];
      this.initialized = true;
    }
  }

  /**
   * Add document chunks to vector store
   * @param {Array} chunks - Array of { text, metadata, embedding }
   */
  async addChunks(chunks) {
    if (!this.initialized) {
      await this.initialize();
    }

    const newChunks = chunks.map((chunk, index) => ({
      id: `${Date.now()}-${index}`,
      text: chunk.text,
      metadata: chunk.metadata || {},
      embedding: chunk.embedding
    }));

    this.chunks.push(...newChunks);
    await this.persist();

    console.log(`Added ${newChunks.length} chunks, total: ${this.chunks.length}`);
    return newChunks;
  }

  /**
   * Find top-k most similar chunks to query embedding
   * @param {number[]} queryEmbedding - Query vector
   * @param {number} k - Number of results
   * @returns {Array} - Top-k chunks with similarity scores
   */
  async search(queryEmbedding, k = 5) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.chunks.length === 0) {
      return [];
    }

    // Calculate cosine similarity for all chunks
    const scored = this.chunks.map(chunk => ({
      ...chunk,
      score: this.cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort by similarity (descending)
    scored.sort((a, b) => b.score - a.score);

    // Return top-k
    return scored.slice(0, k).map(({ embedding, ...rest }) => ({
      ...rest,
      // Round score for cleaner output
      score: Math.round(rest.score * 1000) / 1000
    }));
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} a - Vector A
   * @param {number[]} b - Vector B
   * @returns {number} - Similarity score (0 to 1)
   */
  cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Persist vector store to disk
   */
  async persist() {
    await fs.mkdir(VECTOR_STORE_PATH, { recursive: true });
    await fs.writeFile(INDEX_FILE, JSON.stringify({
      chunks: this.chunks,
      updatedAt: new Date().toISOString()
    }, null, 2));
  }

  /**
   * Clear all chunks
   */
  async clear() {
    this.chunks = [];
    await this.persist();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalChunks: this.chunks.length,
      embeddingDimension: this.chunks.length > 0 ? this.chunks[0].embedding.length : 384
    };
  }
}

export default new RetrievalService();
