/**
 * ChatUI Component
 * Main chat interface for querying medical documents
 */

import React, { useState, useRef, useEffect } from 'react';
import { queryRAG, compareResponses } from '../services/api.js';

const ChatUI = ({ onContextSelect }) => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('document');
  const [showComparison, setShowComparison] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userQuery = query.trim();
    setQuery('');
    setIsLoading(true);

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userQuery,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // If comparison mode, fetch both RAG and baseline
      if (showComparison) {
        const result = await compareResponses(userQuery);

        const aiMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: result.rag.answer,
          comparison: {
            rag: result.rag.answer,
            baseline: result.baseline.answer,
            ragTime: result.rag.processingTimeMs,
            baselineTime: result.baseline.processingTimeMs
          },
          retrievedContext: result.rag.retrievedCount > 0 ? [] : undefined,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);

        if (onContextSelect && result.rag.retrievedContext) {
          onContextSelect(result.rag.retrievedContext);
        }
      } else {
        // Standard query: document search or medical bot
        const useRAG = mode === 'document';
        const result = await queryRAG(userQuery, useRAG);

        const aiMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: result.answer,
          retrievedContext: result.retrievedContext,
          retrievedCount: result.retrievedCount,
          processingTime: result.processingTimeMs,
          mode: mode,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, aiMessage]);

        if (onContextSelect && result.retrievedContext) {
          onContextSelect(result.retrievedContext);
        }
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Error: ${error.message || 'Failed to get response'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={styles.container}>
      {/* Messages Area */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>Medical Document Intelligence</h2>
            <p style={styles.emptySubtitle}>
              Ask questions about your medical documents. All processing happens locally.
            </p>
            <div style={styles.features}>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>🔒</span>
                <span>Privacy-Preserving</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>🏥</span>
                <span>Clinically Grounded</span>
              </div>
              <div style={styles.feature}>
                <span style={styles.featureIcon}>⚡</span>
                <span>Real-time Responses</span>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                ...styles.message,
                ...(message.type === 'user' ? styles.userMessage : {}),
                ...(message.type === 'assistant' ? styles.assistantMessage : {}),
                ...(message.type === 'error' ? styles.errorMessage : {})
              }}
            >
              <div style={styles.messageHeader}>
                <span style={styles.messageSender}>
                  {message.type === 'user' ? 'You' : 'Assistant'}
                </span>
                {message.mode && (
                  <span style={styles.modeBadge}>
                    {message.mode === 'document' ? 'Document Search' : 'Medical Bot'}
                  </span>
                )}
                <span style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div style={styles.messageContent}>
                {message.content}
              </div>

              {/* Comparison View */}
              {message.comparison && (
                <div style={styles.comparisonContainer}>
                  <div style={styles.comparisonGrid}>
                    <div style={styles.comparisonColumn}>
                      <div style={styles.comparisonHeader}>RAG Response</div>
                      <div style={styles.comparisonContent}>{message.comparison.rag}</div>
                      <div style={styles.comparisonMeta}>
                        Time: {message.comparison.ragTime}ms
                      </div>
                    </div>
                    <div style={styles.comparisonColumn}>
                      <div style={styles.comparisonHeader}>Baseline (No Retrieval)</div>
                      <div style={styles.comparisonContent}>{message.comparison.baseline}</div>
                      <div style={styles.comparisonMeta}>
                        Time: {message.comparison.baselineTime}ms
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Info */}
              {message.processingTime && (
                <div style={styles.messageMeta}>
                  <span>Retrieved: {message.retrievedCount} chunks</span>
                  <span>•</span>
                  <span>Time: {message.processingTime}ms</span>
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div style={styles.loadingMessage}>
            <div style={styles.loadingSpinner}></div>
            <span>Processing your query...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} style={styles.inputForm}>
        <div style={styles.inputControls}>
          <div style={styles.modeGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="mode"
                value="document"
                checked={mode === 'document'}
                onChange={() => setMode('document')}
                disabled={showComparison}
              />
              <span style={styles.toggleText}>Document Search</span>
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                name="mode"
                value="medical"
                checked={mode === 'medical'}
                onChange={() => setMode('medical')}
                disabled={showComparison}
              />
              <span style={styles.toggleText}>Medical Bot</span>
            </label>
          </div>

          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
            />
            <span style={styles.toggleText}>Compare Mode</span>
          </label>
        </div>

        <div style={styles.inputWrapper}>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a medical question... (e.g., 'What are the symptoms of pneumonia?')"
            style={styles.textarea}
            rows={2}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            style={{
              ...styles.submitButton,
              ...(isLoading || !query.trim() ? styles.submitButtonDisabled : {})
            }}
          >
            {isLoading ? 'Processing...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#fff'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    backgroundColor: '#f8fafc'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    textAlign: 'center',
    padding: '40px'
  },
  emptyTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },
  emptySubtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px'
  },
  features: {
    display: 'flex',
    gap: '24px',
    marginTop: '16px'
  },
  feature: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#475569'
  },
  featureIcon: {
    fontSize: '16px'
  },
  message: {
    marginBottom: '16px',
    padding: '12px 16px',
    borderRadius: '12px',
    maxWidth: '85%'
  },
  userMessage: {
    marginLeft: 'auto',
    backgroundColor: '#3b82f6',
    color: '#fff'
  },
  assistantMessage: {
    marginRight: 'auto',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0'
  },
  errorMessage: {
    marginRight: 'auto',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#dc2626'
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '12px'
  },
  messageSender: {
    fontWeight: '600'
  },
  messageTime: {
    opacity: 0.7
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap'
  },
  messageMeta: {
    display: 'flex',
    gap: '8px',
    fontSize: '11px',
    opacity: 0.7,
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid rgba(0,0,0,0.1)'
  },
  comparisonContainer: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px dashed #e2e8f0'
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  comparisonColumn: {
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px'
  },
  comparisonHeader: {
    fontWeight: '600',
    fontSize: '12px',
    marginBottom: '8px',
    color: '#475569'
  },
  comparisonContent: {
    fontSize: '13px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap'
  },
  comparisonMeta: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '8px'
  },
  loadingMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    color: '#64748b'
  },
  loadingSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #e2e8f0',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  inputForm: {
    padding: '16px 20px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0'
  },
  inputControls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '12px',
    alignItems: 'center'
  },
  modeGroup: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  toggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    cursor: 'pointer'
  },
  modeBadge: {
    marginLeft: '8px',
    padding: '2px 8px',
    borderRadius: '999px',
    backgroundColor: '#e2e8f0',
    color: '#334155',
    fontSize: '11px',
    fontWeight: '600'
  },
  toggleText: {
    color: '#475569'
  },
  inputWrapper: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-end'
  },
  textarea: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit'
  },
  submitButton: {
    padding: '12px 24px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    minWidth: '80px'
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed'
  }
};

export default ChatUI;
