/**
 * ContextViewer Component
 * Displays retrieved document chunks with relevance scores
 */

import React, { useState } from 'react';

const ContextViewer = ({ contexts }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (!contexts || contexts.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📄</span>
          <p>Retrieved context will appear here</p>
        </div>
      </div>
    );
  }

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Get section type badge color
  const getSectionColor = (section) => {
    const colors = {
      symptoms: '#fef3c7',
      diagnosis: '#dbeafe',
      treatment: '#d1fae5',
      guidelines: '#e0e7ff',
      epidemiology: '#fce7f3',
      etiology: '#ffedd5',
      prognosis: '#f3e8ff',
      general: '#f1f5f9'
    };
    return colors[section] || colors.general;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Retrieved Context</h3>
        <span style={styles.count}>{contexts.length} chunks</span>
      </div>

      <div style={styles.contextsList}>
        {contexts.map((context, index) => (
          <div
            key={index}
            style={{
              ...styles.contextCard,
              ...(expandedIndex === index ? styles.contextCardExpanded : {})
            }}
          >
            <div style={styles.contextHeader}>
              <div style={styles.contextMeta}>
                <span style={styles.chunkNumber}>#{index + 1}</span>
                {context.metadata?.section && (
                  <span
                    style={{
                      ...styles.sectionBadge,
                      backgroundColor: getSectionColor(context.metadata.section)
                    }}
                  >
                    {context.metadata.section}
                  </span>
                )}
                <span style={styles.relevanceScore}>
                  {(context.relevanceScore * 100).toFixed(0)}% match
                </span>
              </div>
              <button
                onClick={() => toggleExpand(index)}
                style={styles.expandButton}
              >
                {expandedIndex === index ? '−' : '+'}
              </button>
            </div>

            {context.metadata?.heading && (
              <div style={styles.contextHeading}>{context.metadata.heading}</div>
            )}

            <div
              style={{
                ...styles.contextText,
                ...(expandedIndex === index ? styles.contextTextExpanded : {})
              }}
            >
              {expandedIndex === index
                ? context.text
                : context.text.substring(0, 200) + (context.text.length > 200 ? '...' : '')}
            </div>

            {context.text.length > 200 && (
              <button
                onClick={() => toggleExpand(index)}
                style={styles.readMoreButton}
              >
                {expandedIndex === index ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0'
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e293b'
  },
  count: {
    fontSize: '12px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '12px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    color: '#94a3b8',
    padding: '40px'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5
  },
  contextsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  contextCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s'
  },
  contextCardExpanded: {
    backgroundColor: '#fff',
    borderColor: '#3b82f6'
  },
  contextHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  contextMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  chunkNumber: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b'
  },
  sectionBadge: {
    fontSize: '10px',
    fontWeight: '600',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'capitalize'
  },
  relevanceScore: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: '500'
  },
  expandButton: {
    width: '24px',
    height: '24px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  contextHeading: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    marginBottom: '8px'
  },
  contextText: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#334155'
  },
  contextTextExpanded: {
    whiteSpace: 'pre-wrap'
  },
  readMoreButton: {
    marginTop: '8px',
    fontSize: '12px',
    color: '#3b82f6',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px 0'
  }
};

export default ContextViewer;
