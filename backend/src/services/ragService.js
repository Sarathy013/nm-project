/**
 * RAG Service
 * Orchestrates the Retrieval-Augmented Generation pipeline
 * Combines retrieval service + LLM for grounded responses
 */

import embeddingService from './embeddingService.js';
import retrievalService from './retrievalService.js';
import ollamaService from './ollamaService.js';

// Clinical system prompt - CRITICAL for reducing hallucinations
const SYSTEM_PROMPT = `You are a clinical medical document assistant. Your role is to help healthcare professionals find information from medical documents.

RULES (STRICT COMPLIANCE REQUIRED):
1. Use ONLY the provided context from medical documents
2. Do NOT generate information, facts, or recommendations outside the provided context
3. If the context does not contain sufficient information to answer, respond with: "Insufficient data in the provided documents to answer this query."
4. Do NOT make assumptions or inferences beyond what is explicitly stated
5. Be precise, concise, and clinically accurate
6. If context mentions contraindications, warnings, or critical information, highlight them

OUTPUT FORMAT:
- Condition/Topic: [Identify the medical condition or topic]
- Explanation: [Summary based ONLY on context]
- Key Points: [Bullet points of relevant information from context]
- Source Context: [Indicate which document sections informed the response]

SAFETY:
- Never provide definitive medical advice
- Always ground responses in the provided document context
- Flag any uncertainty or limitations in the available information`;

class RAGService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize all services
   */
  async initialize() {
    if (this.initialized) return;

    console.log('Initializing RAG services...');
    await embeddingService.initialize();
    await retrievalService.initialize();
    this.initialized = true;
    console.log('RAG services initialized');
  }

  /**
   * Process a query through the full RAG pipeline
   * @param {string} query - User's natural language query
   * @param {object} options - Pipeline options
   * @returns {Promise<object>} - RAG response
   */
  async query(query, options = {}) {
    await this.initialize();

    const {
      k = parseInt(process.env.MAX_CONTEXT_CHUNKS) || 5,
      useRAG = true,
      includeContext = true
    } = options;

    const startTime = Date.now();
    const result = {
      query,
      timestamp: new Date().toISOString(),
      model: ollamaService.getModel()
    };

    if (useRAG) {
      // RAG Pipeline
      console.log(`Processing RAG query: "${query.substring(0, 50)}..."`);

      // Step 1: Embed query
      const queryEmbedding = await embeddingService.embed(query);

      // Step 2: Retrieve relevant chunks
      const retrievedChunks = await retrievalService.search(queryEmbedding, k);
      result.retrievedCount = retrievedChunks.length;

      if (retrievedChunks.length === 0) {
        result.answer = "No relevant medical documents found in the knowledge base. Please upload relevant medical documents first.";
        result.retrievedContext = [];
        result.warning = 'Empty knowledge base';
      } else {
        // Step 3: Build context from retrieved chunks
        const context = this.buildContext(retrievedChunks);

        // Step 4: Generate response with LLM
        const llmResponse = await ollamaService.generateWithRAG(
          SYSTEM_PROMPT,
          query,
          context
        );

        result.answer = llmResponse.success
          ? llmResponse.response
          : `Error generating response: ${llmResponse.error}`;

        result.success = llmResponse.success;

        if (includeContext) {
          result.retrievedContext = retrievedChunks.map(chunk => ({
            text: chunk.text,
            metadata: chunk.metadata,
            relevanceScore: chunk.score
          }));
        }
      }
    } else {
      // Baseline (no retrieval)
      console.log(`Processing baseline query: "${query.substring(0, 50)}..."`);

      const llmResponse = await ollamaService.generateBaseline(query);
      result.answer = llmResponse.success
        ? llmResponse.response
        : `Error generating response: ${llmResponse.error}`;
      result.success = llmResponse.success;
      result.retrievedContext = [];
      result.retrievedCount = 0;
    }

    result.processingTimeMs = Date.now() - startTime;

    return result;
  }

  /**
   * Build context string from retrieved chunks
   */
  buildContext(chunks) {
    return chunks.map((chunk, index) => {
      const source = chunk.metadata?.heading
        ? `[Section ${index + 1}: ${chunk.metadata.heading}]`
        : `[Section ${index + 1}]`;
      return `${source}\n${chunk.text}`;
    }).join('\n\n---\n\n');
  }

  /**
   * Compare RAG vs Baseline for the same query
   */
  async compare(query) {
    console.log(`Running comparison for: "${query}"`);

    const [ragResult, baselineResult] = await Promise.all([
      this.query(query, { useRAG: true, includeContext: false }),
      this.query(query, { useRAG: false })
    ]);

    return {
      query,
      rag: {
        answer: ragResult.answer,
        retrievedCount: ragResult.retrievedCount,
        processingTimeMs: ragResult.processingTimeMs
      },
      baseline: {
        answer: baselineResult.answer,
        processingTimeMs: baselineResult.processingTimeMs
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Add documents to knowledge base
   */
  async addDocuments(chunks) {
    await this.initialize();
    return await retrievalService.addChunks(chunks);
  }

  /**
   * Get knowledge base statistics
   */
  getStats() {
    return retrievalService.getStats();
  }

  /**
   * Clear knowledge base
   */
  async clearKnowledgeBase() {
    await retrievalService.clear();
    return { success: true, message: 'Knowledge base cleared' };
  }
}

export default new RAGService();
