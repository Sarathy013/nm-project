/**
 * Medical Document Intelligence System
 * Main Application Component
 */

import React, { useState } from 'react';
import ChatUI from './components/ChatUI.jsx';
import DocumentUpload from './components/DocumentUpload.jsx';
import ContextViewer from './components/ContextViewer.jsx';

function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [contexts, setContexts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleContextSelect = (newContexts) => {
    setContexts(newContexts);
  };

  const handleUploadComplete = () => {
    // Refresh could be added here to update stats
    console.log('Upload complete, knowledge base updated');
  };

  return (
    <div style={styles.appContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>
            <span style={styles.logoIcon}>🏥</span>
            Medical Document Intelligence
          </h1>
          <span style={styles.badge}>Local LLM + RAG</span>
        </div>
        <div style={styles.headerRight}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={styles.sidebarToggle}
            title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Navigation Tabs */}
        <div style={styles.tabs}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              ...styles.tab,
              ...(activeTab === 'chat' ? styles.activeTab : {})
            }}
          >
            💬 Chat Query
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              ...styles.tab,
              ...(activeTab === 'upload' ? styles.activeTab : {})
            }}
          >
            📄 Documents
          </button>
        </div>

        {/* Content Area */}
        <div style={styles.contentArea}>
          <div style={styles.chatSection}>
            <ChatUI onContextSelect={handleContextSelect} />
          </div>

          {/* Sidebar with Context Viewer and Upload */}
          {sidebarOpen && (
            <div style={styles.sidebar}>
              <div style={styles.contextSection}>
                <ContextViewer contexts={contexts} />
              </div>
              {activeTab === 'upload' && (
                <div style={styles.uploadSection}>
                  <DocumentUpload onUploadComplete={handleUploadComplete} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <span>🔒 All processing is local - No data leaves this system</span>
        <span>•</span>
        <span>Powered by Ollama + Transformers.js</span>
      </footer>

      {/* Global Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        * {
          box-sizing: border-box;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f1f5f9'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoIcon: {
    fontSize: '24px'
  },
  badge: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    padding: '4px 8px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center'
  },
  sidebarToggle: {
    width: '32px',
    height: '32px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  tabs: {
    display: 'flex',
    padding: '0 24px',
    paddingTop: '16px',
    gap: '8px',
    backgroundColor: '#f1f5f9'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px 8px 0 0',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    borderBottom: 'none'
  },
  activeTab: {
    backgroundColor: '#fff',
    color: '#1e293b',
    borderBottom: '2px solid #3b82f6',
    marginBottom: '-2px'
  },
  contentArea: {
    flex: 1,
    display: 'flex',
    padding: '0',
    overflow: 'hidden',
    backgroundColor: '#fff',
    margin: '0 16px 16px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  chatSection: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  },
  sidebar: {
    width: '400px',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #e2e8f0',
    overflow: 'hidden'
  },
  contextSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderBottom: '1px solid #e2e8f0'
  },
  uploadSection: {
    height: '50%',
    display: 'flex',
    flexDirection: 'column'
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    padding: '10px 24px',
    backgroundColor: '#fff',
    borderTop: '1px solid #e2e8f0',
    fontSize: '12px',
    color: '#64748b'
  }
};

export default App;
