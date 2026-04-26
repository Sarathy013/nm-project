/**
 * DocumentUpload Component
 * Handles file upload and text ingestion for medical documents
 */

import React, { useState, useRef } from 'react';
import { uploadDocument, ingestText, getDocuments, deleteDocument } from '../services/api.js';

const DocumentUpload = ({ onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const inputRef = useRef(null);

  const loadDocuments = async () => {
    try {
      const result = await getDocuments();
      setDocuments(result.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  React.useEffect(() => {
    loadDocuments();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file) => {
    const allowedTypes = ['.pdf', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedTypes.includes(ext)) {
      alert('Please upload a PDF or TXT file');
      return;
    }

    setUploading(true);

    try {
      const result = await uploadDocument(file);
      if (result.success) {
        alert(`Document uploaded successfully! ${result.chunksProcessed} chunks processed.`);
        loadDocuments();
        if (onUploadComplete) {
          onUploadComplete(result);
        }
      }
    } catch (error) {
      alert(`Upload failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim() || !documentName.trim()) {
      alert('Please provide both a name and text content');
      return;
    }

    setUploading(true);

    try {
      const result = await ingestText(textInput, documentName);
      if (result.success) {
        alert(`Text ingested successfully! ${result.chunksProcessed} chunks processed.`);
        setTextInput('');
        setDocumentName('');
        setShowTextInput(false);
        loadDocuments();
        if (onUploadComplete) {
          onUploadComplete(result);
        }
      }
    } catch (error) {
      alert(`Ingestion failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(id);
      loadDocuments();
    } catch (error) {
      alert('Failed to delete document');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Medical Documents</h2>
        <button
          onClick={() => setShowTextInput(!showTextInput)}
          style={styles.textButton}
        >
          {showTextInput ? 'Upload File' : 'Paste Text'}
        </button>
      </div>

      {showTextInput ? (
        <div style={styles.textInputContainer}>
          <input
            type="text"
            placeholder="Document name"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            style={styles.nameInput}
          />
          <textarea
            placeholder="Paste medical text content here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            style={styles.textarea}
            rows={8}
          />
          <div style={styles.buttonRow}>
            <button
              onClick={handleTextSubmit}
              disabled={uploading || !textInput.trim() || !documentName.trim()}
              style={{
                ...styles.submitButton,
                ...(uploading || !textInput.trim() || !documentName.trim() ? styles.disabledButton : {})
              }}
            >
              {uploading ? 'Processing...' : 'Ingest Text'}
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            ...styles.dropzone,
            ...(dragActive ? styles.dropzoneActive : {})
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleChange}
            style={styles.fileInput}
          />
          <div style={styles.dropzoneContent}>
            <span style={styles.dropIcon}>📄</span>
            <p style={styles.dropText}>
              Drag & drop a PDF or TXT file here, or click to browse
            </p>
            <p style={styles.dropSubtext}>
              Supported formats: PDF, TXT (max 10MB)
            </p>
            {uploading && <p style={styles.uploadingText}>Processing document...</p>}
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div style={styles.documentList}>
          <h3 style={styles.listTitle}>Uploaded Documents ({documents.length})</h3>
          <div style={styles.documents}>
            {documents.map((doc) => (
              <div key={doc.id} style={styles.documentItem}>
                <div style={styles.documentInfo}>
                  <span style={styles.documentName}>{doc.name}</span>
                  <span style={styles.documentMeta}>
                    {doc.chunkCount} chunks • {new Date(doc.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff',
    height: '100%',
    overflowY: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b'
  },
  textButton: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    color: '#475569'
  },
  textInputContainer: {
    marginBottom: '20px'
  },
  nameInput: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    marginBottom: '12px'
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '12px'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed'
  },
  dropzone: {
    border: '2px dashed #e2e8f0',
    borderRadius: '12px',
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginBottom: '20px'
  },
  dropzoneActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff'
  },
  dropzoneContent: {
    pointerEvents: 'none'
  },
  dropIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px'
  },
  dropText: {
    fontSize: '16px',
    color: '#475569',
    marginBottom: '8px'
  },
  dropSubtext: {
    fontSize: '13px',
    color: '#94a3b8'
  },
  uploadingText: {
    fontSize: '14px',
    color: '#3b82f6',
    marginTop: '16px',
    fontWeight: '500'
  },
  fileInput: {
    display: 'none'
  },
  documentList: {
    marginTop: '20px'
  },
  listTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  documents: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  documentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  documentInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  documentName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b'
  },
  documentMeta: {
    fontSize: '12px',
    color: '#64748b'
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#fff',
    border: '1px solid #fecaca',
    color: '#dc2626',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer'
  }
};

export default DocumentUpload;
