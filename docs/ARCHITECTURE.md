# System Architecture - Medical Document Intelligence

## Overview

This document describes the technical architecture of the Local LLM Medical Document Intelligence System.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            USER INTERFACE                               │
│                         (React SPA - Port 3000)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │   ChatUI    │  │  Context     │  │  Document    │                   │
│  │  Component  │  │  Viewer      │  │  Upload      │                   │
│  └─────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/JSON
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API LAYER (Express)                            │
│                        (Node.js Server - Port 5000)                     │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      API Routes (/api)                          │   │
│  │  POST /query          - Process natural language query          │   │
│  │  POST /compare        - Compare RAG vs Baseline                 │   │
│  │  POST /documents/upload - Upload PDF/TXT file                   │   │
│  │  POST /documents/ingest-text - Ingest raw text                  │   │
│  │  GET  /documents      - List uploaded documents                 │   │
│  │  GET  /stats          - Knowledge base statistics               │   │
│  │  DELETE /knowledge-base - Clear vector store                    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
┌──────────────────────┐ ┌──────────────────┐ ┌─────────────────────────┐
│  EMBEDDING SERVICE   │ │  RETRIEVAL       │ │   OLLAMA SERVICE        │
│  (Transformers.js)   │ │  SERVICE         │ │   (Local LLM)           │
│                      │ │                  │ │                         │
│  Model: all-MiniLM-  │ │  Vector Store:   │ │  Model: LLaMA 3 /       │
│  L6-v2 (384-dim)     │ │  In-memory +     │ │  Mistral 7B             │
│                      │ │  JSON persist    │ │                         │
│  Quantized for speed │ │  Cosine          │ │  Temperature: 0.2-0.4   │
│  Runs in Node.js     │ │  similarity      │ │  Max tokens: 512-1024   │
└──────────────────────┘ └──────────────────┘ └─────────────────────────┘
```

---

## Data Flow

### 1. Document Ingestion Pipeline

```
PDF/TXT File
     │
     ▼
┌─────────────────┐
│ Document Service│
│ - Parse file    │
│ - Clean text    │
│ - Split sections│
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Text Chunks     │
│ (50-1000 chars) │
│ + Metadata      │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Embedding       │
│ Service         │
│ - Generate      │
│   vectors       │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Vector Store    │
│ - Store chunks  │
│ - Persist to    │
│   JSON          │
└─────────────────┘
```

### 2. Query Processing Pipeline (RAG)

```
User Query
     │
     ▼
┌─────────────────┐
│ Embed Query     │
│ (same model)    │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Retrieve Top-K  │
│ Cosine Similar  │
│ (k=5 default)   │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Build Context   │
│ + System Prompt │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ LLM Generation  │
│ (Ollama API)    │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│ Response with   │
│ Attribution     │
└─────────────────┘
```

---

## Component Details

### Embedding Service

**Purpose:** Convert text to numerical vectors for similarity search.

**Technology:** Transformers.js (`@xenova/transformers`)

**Model:** `Xenova/all-MiniLM-L6-v2`
- 384-dimensional output
- Quantized for faster inference
- ~80MB download (cached after first use)
- Runs entirely in Node.js (no Python)

**Key Methods:**
```javascript
embed(text)           // Single text → vector
embedBatch(texts)     // Multiple texts → vectors
getDimension()        // Returns 384
```

### Retrieval Service

**Purpose:** Store and search document embeddings.

**Implementation:** In-memory vector store with JSON persistence

**Data Structure:**
```javascript
{
  chunks: [
    {
      id: "timestamp-index",
      text: "Document chunk content",
      metadata: { filename, section, heading },
      embedding: [0.123, -0.456, ...] // 384 floats
    }
  ]
}
```

**Search Algorithm:** Cosine similarity
```
similarity(A, B) = (A · B) / (||A|| × ||B||)
```

**Key Methods:**
```javascript
addChunks(chunks)     // Add embeddings to store
search(queryEmb, k)   // Find top-k similar
clear()               // Reset store
getStats()            // Get statistics
```

### Ollama Service

**Purpose:** Interface with local LLM for text generation.

**API:** HTTP calls to `http://localhost:11434/api/generate`

**Models Supported:**
- LLaMA 3 8B (recommended)
- Mistral 7B
- Any Ollama-compatible model

**Prompt Template (RAG):**
```
{systemPrompt}

CONTEXT FROM MEDICAL DOCUMENTS:
{retrievedContext}

USER QUERY: {userQuery}

Based ONLY on the context above, provide your response.
```

**System Prompt (Clinical Grounding):**
```
You are a clinical medical document assistant.

RULES:
1. Use ONLY the provided context
2. Do NOT generate information outside context
3. If insufficient data, say "Insufficient data"
4. Be precise and clinically safe

OUTPUT FORMAT:
- Condition:
- Explanation:
- Key Points:
- Source Context:
```

### RAG Service

**Purpose:** Orchestrate the full RAG pipeline.

**Workflow:**
1. Initialize all services
2. Embed user query
3. Retrieve relevant chunks
4. Build context string
5. Call LLM with RAG prompt
6. Return response with attribution

**Configuration:**
```javascript
{
  k: 5,                    // Number of chunks to retrieve
  useRAG: true,            // Enable/disable retrieval
  includeContext: true     // Return chunks to frontend
}
```

### Document Service

**Purpose:** Parse and chunk medical documents.

**Supported Formats:** PDF, TXT

**Chunking Strategy:**
1. Split by section headers (symptoms, diagnosis, treatment, etc.)
2. Further split long sections by paragraphs
3. Filter chunks < 50 characters
4. Attach metadata (section type, heading, filename)

**Section Detection Patterns:**
```javascript
{ type: 'symptoms', pattern: /symptoms?|clinical presentation/i }
{ type: 'diagnosis', pattern: /diagnosis|diagnostic criteria/i }
{ type: 'treatment', pattern: /treatment|therapy|management/i }
{ type: 'guidelines', pattern: /guidelines?|recommendations?/i }
```

---

## API Specification

### Request/Response Examples

#### POST /api/query

**Request:**
```json
{
  "query": "What are the symptoms of pneumonia?",
  "useRAG": true,
  "includeContext": true
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Pneumonia typically presents with fever, productive cough...",
  "query": "What are the symptoms of pneumonia?",
  "retrievedCount": 5,
  "retrievedContext": [
    {
      "text": "Pneumonia typically presents with fever...",
      "metadata": { "section": "symptoms" },
      "relevanceScore": 0.87
    }
  ],
  "processingTimeMs": 2345,
  "model": "llama3",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### POST /api/documents/upload

**Request:** `multipart/form-data`
- `document`: File (PDF or TXT, max 10MB)

**Response:**
```json
{
  "success": true,
  "message": "Document processed successfully",
  "document": {
    "id": "uuid",
    "name": "pneumonia.pdf",
    "type": ".pdf",
    "chunkCount": 12,
    "uploadedAt": "2024-01-15T10:30:00Z"
  },
  "chunksProcessed": 12,
  "textLength": 5432
}
```

---

## Security Considerations

### Privacy Guarantees

1. **No External Calls:** All processing is local after setup
2. **No Data Persistence:** Uploaded files deleted after processing
3. **No Telemetry:** No analytics or tracking
4. **Local Embeddings:** Transformers.js runs in-process
5. **Local Inference:** Ollama runs on localhost

### Input Validation

- File type validation (PDF/TXT only)
- File size limit (10MB)
- Query length validation
- JSON schema validation

### Error Handling

- Graceful degradation if Ollama unavailable
- Clear error messages to frontend
- Logging for debugging
- Transaction rollback on failures

---

## Performance Characteristics

### Latency Breakdown (Typical Query)

| Component | Time |
|-----------|------|
| Query Embedding | 50-100ms |
| Vector Search | 10-50ms |
| Context Building | <10ms |
| LLM Generation | 1000-3000ms |
| **Total** | **~2000-3500ms** |

### Memory Usage

| Component | Memory |
|-----------|--------|
| Node.js Base | ~50MB |
| Embedding Model | ~200MB |
| Vector Store (1000 chunks) | ~50MB |
| LLM (Ollama, external) | ~4-8GB |

### Scalability

- **Vector Store:** Linear search; suitable for <10K chunks
- **Embedding:** Sequential processing; batch for efficiency
- **LLM:** Single concurrent request (Ollama limitation)

---

## Deployment Considerations

### System Requirements

- **CPU:** Modern multi-core (embedding inference)
- **RAM:** 32GB minimum (LLM + embeddings + Node.js)
- **Storage:** 10GB+ (models + vector store)
- **OS:** Windows/Linux/Mac

### Ollama Setup

```bash
# Install
curl -fsSL https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama3

# Run as service
ollama serve
```

### Environment Variables

```env
PORT=5000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3
MAX_CONTEXT_CHUNKS=5
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

---

## Future Architecture Improvements

1. **Vector Database:** Replace in-memory store with FAISS/Chroma
2. **Caching:** Redis for query result caching
3. **Streaming:** SSE for real-time response streaming
4. **Multi-model:** Support multiple LLMs for different tasks
5. **Hybrid Search:** Combine lexical + semantic search
6. **Query Expansion:** Use LLM to expand queries before retrieval

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-19
