/**
 * Ollama Service
 * Interfaces with local Ollama LLM for text generation
 * All inference happens locally - no cloud API calls
 */

import axios from 'axios';

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3';
    this.timeout = 60000; // 60 second timeout for generation
  }

  /**
   * Check if Ollama is available
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000
      });
      return {
        available: true,
        models: response.data.models || []
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Generate response from LLM
   * @param {string} prompt - Prompt to send to LLM
   * @param {object} options - Generation options
   * @returns {Promise<object>} - Generation result
   */
  async generate(prompt, options = {}) {
    const {
      temperature = 0.3, // Lower temperature for more factual responses
      topP = 0.9,
      maxTokens = 1024,
      stream = false
    } = options;

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.model,
          prompt: prompt,
          stream: stream,
          options: {
            temperature,
            top_p: topP,
            num_predict: maxTokens
          }
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        response: response.data.response,
        model: this.model,
        contextUsed: response.data.context || []
      };
    } catch (error) {
      console.error('Ollama generation error:', error.message);

      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Ollama is not running. Please start Ollama service.',
          model: this.model
        };
      }

      return {
        success: false,
        error: error.message,
        model: this.model
      };
    }
  }

  /**
   * Generate with RAG-optimized prompt
   * @param {string} systemPrompt - System instructions
   * @param {string} userQuery - User's question
   * @param {string} context - Retrieved context
   * @returns {Promise<object>} - Generation result
   */
  async generateWithRAG(systemPrompt, userQuery, context) {
    const prompt = this.buildRAGPrompt(systemPrompt, userQuery, context);
    return this.generate(prompt, {
      temperature: 0.2, // Even lower for RAG - want factual accuracy
      maxTokens: 512
    });
  }

  /**
   * Build RAG-optimized prompt
   */
  buildRAGPrompt(systemPrompt, userQuery, context) {
    return `${systemPrompt}

CONTEXT FROM MEDICAL DOCUMENTS:
${context}

USER QUERY: ${userQuery}

Based ONLY on the context above, provide your response following the system instructions.`;
  }

  /**
   * Generate baseline response (no retrieval)
   * @param {string} query - User query
   * @returns {Promise<object>} - Generation result
   */
  async generateBaseline(query) {
    const prompt = `You are a medical knowledge assistant. Answer the following query based on your training knowledge.

QUERY: ${query}

Provide a clear, clinically relevant response.`;

    return this.generate(prompt, {
      temperature: 0.4,
      maxTokens: 512
    });
  }

  /**
   * Set model
   */
  setModel(model) {
    this.model = model;
  }

  /**
   * Get current model
   */
  getModel() {
    return this.model;
  }
}

export default new OllamaService();
