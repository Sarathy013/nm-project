/**
 * Embedding Service
 * Converts text to vector embeddings using Transformers.js
 * Runs completely locally - no API calls
 */

import { pipeline } from '@xenova/transformers';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class EmbeddingService {
  constructor() {
    this.extractor = null;
    this.modelName = 'Xenova/all-MiniLM-L6-v2';
    this.initialized = false;
  }

  /**
   * Initialize the embedding model (lazy loading)
   */
  async initialize() {
    if (!this.initialized) {
      console.log('Loading embedding model...');
      this.extractor = await pipeline('feature-extraction', this.modelName, {
        quantized: true // Use quantized model for faster inference
      });
      this.initialized = true;
      console.log('Embedding model loaded successfully');
    }
  }

  /**
   * Generate embedding for a single text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - Vector embedding
   */
  async embed(text) {
    await this.initialize();

    const result = await this.extractor(text, {
      pooling: 'mean',
      normalize: true
    });

    // Convert Tensor to array
    return Array.from(result.data);
  }

  /**
   * Generate embeddings for multiple texts (batch)
   * @param {string[]} texts - Array of texts to embed
   * @returns {Promise<number[][]>} - Array of vector embeddings
   */
  async embedBatch(texts) {
    await this.initialize();

    const embeddings = [];
    for (const text of texts) {
      const embedding = await this.embed(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Get embedding dimension
   */
  getDimension() {
    return 384; // all-MiniLM-L6-v2 produces 384-dimensional vectors
  }
}

export default new EmbeddingService();
