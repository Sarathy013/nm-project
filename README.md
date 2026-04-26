# 🏥 Medical Document Intelligence System

A **privacy-preserving, offline AI system** for healthcare providers to query medical documents using natural language. Built with local LLMs and Retrieval-Augmented Generation (RAG) - **zero cloud dependencies**.

![Local LLM](https://img.shields.io/badge/LLM-Ollama-green)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-blue)
![RAG](https://img.shields.io/badge/Architecture-RAG-orange)

---

## 🎯 Overview

This system enables clinicians to:
- Ask natural language questions about medical documents
- Receive accurate, context-grounded responses
- View source documents that informed the response
- Compare RAG responses vs. baseline LLM answers
- All processing happens **locally** - no data leaves the system

### Key Features

| Feature | Description |
|---------|-------------|
| 🔒 **Privacy-First** | No internet calls, no cloud APIs, full HIPAA compliance |
| 🧠 **RAG Pipeline** | Retrieval-Augmented Generation reduces hallucinations |
| 📄 **Document Upload** | PDF and TXT support with intelligent chunking |
| ⚡ **Real-time** | Sub-5 second response times |
| 📊 **Comparison Mode** | See RAG vs. Baseline side-by-side |
| 🏷️ **Source Attribution** | View retrieved context with relevance scores |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                │
│                   Chat UI + Document Upload                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express API (Port 5000)                     │
│    /api/query  /api/documents/upload  /api/compare           │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Embedding    │  │   Vector      │  │   Ollama      │
│  Service      │  │   Store       │  │   Service     │
│  (Transformers│  │  (FAISS-like) │  │  (LLaMA 3)    │
│  .js)         │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

---

## 📋 Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
   ```bash
   # Check version
   node --version

   # Install from https://nodejs.org/
   ```

2. **Ollama** (for local LLM)
   ```bash
   # Windows: Download from https://ollama.ai
   # After installation, verify:
   ollama --version
   ```

3. **LLaMA 3 Model** (or Mistral)
   ```bash
   # Download the model (requires ~5GB disk space)
   ollama pull llama3

   # Alternative (smaller):
   ollama pull mistral
   ```

---

## 🚀 Installation

### 1. Clone/Navigate to Project

```bash
cd C:\Users\shali\Desktop\nm1
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Configure Environment

Edit `backend/.env` if needed:

```env
PORT=5000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3
MAX_CONTEXT_CHUNKS=5
EMBEDDING_MODEL=Xenova/all-MiniLM-L6-v2
```

---

## ▶️ Running the System

### Start Ollama (if not running)

```bash
ollama serve
```

### Start Backend Server

```bash
cd backend
npm run dev
```

Server will start on `http://localhost:5000`

### Start Frontend (new terminal)

```bash
cd frontend
npm run dev
```

Frontend will start on `http://localhost:3000`

---

## 📖 Usage Guide

### Step 1: Upload Medical Documents

1. Navigate to the **Documents** tab
2. Upload PDF or TXT files, or paste text directly
3. Documents are automatically:
   - Parsed and cleaned
   - Split into meaningful chunks (symptoms, diagnosis, treatment, etc.)
   - Converted to embeddings
   - Stored in the local vector database

### Step 2: Query the System

1. Go to the **Chat Query** tab
2. Type your medical question, e.g.:
   - "What are the symptoms of pneumonia?"
   - "How do you diagnose type 2 diabetes?"
   - "What is the first-line treatment for hypertension?"
3. Toggle **Use RAG Retrieval** for context-grounded answers
4. Toggle **Compare Mode** to see RAG vs. Baseline side-by-side

### Step 3: Review Results

- **AI Response**: The generated answer
- **Retrieved Context**: Source document chunks with relevance scores
- **Processing Info**: Number of chunks retrieved and response time

---

## 🧪 Evaluation

### Sample Test Queries

The system includes 20 pre-defined test queries in `backend/data/test_queries.json`:

```json
{
  "query": "What are the symptoms of pneumonia?",
  "expectedTopics": ["fever", "cough", "chest pain"],
  "category": "symptoms"
}
```

### Evaluation Criteria

| Criterion | Description |
|-----------|-------------|
| **Accuracy** | Information is factually correct |
| **Relevance** | Response addresses the query |
| **Completeness** | All key aspects are covered |
| **Grounding** | No hallucinations outside context |
| **Clinical Appropriateness** | Suitable for clinical reference |

### Scoring Rubric

| Score | Description |
|-------|-------------|
| 5 | Excellent - Accurate, complete, well-grounded |
| 4 | Good - Mostly accurate, minor omissions |
| 3 | Adequate - Correct but incomplete |
| 2 | Poor - Significant issues or hallucinations |
| 1 | Unacceptable - Wrong or dangerous |

---

## 📡 API Reference

### Query Endpoints

#### `POST /api/query`
Process a natural language query through RAG pipeline.

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
  "retrievedCount": 5,
  "retrievedContext": [...],
  "processingTimeMs": 2345,
  "model": "llama3"
}
```

#### `POST /api/compare`
Compare RAG vs. Baseline responses.

**Request:**
```json
{
  "query": "What is the treatment for hypertension?"
}
```

#### `GET /api/stats`
Get knowledge base statistics.

### Document Endpoints

#### `POST /api/documents/upload`
Upload a PDF or TXT file.

**Request:** `multipart/form-data`
- `document`: File (PDF or TXT)

#### `POST /api/documents/ingest-text`
Ingest raw text content.

**Request:**
```json
{
  "text": "Medical content here...",
  "name": "Sample Document"
}
```

#### `GET /api/documents`
List all uploaded documents.

#### `DELETE /api/documents/:id`
Delete a document.

---

## 🗂️ Project Structure

```
nm1/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express API server
│   │   ├── routes/
│   │   │   └── api.js             # API route definitions
│   │   ├── controllers/
│   │   │   ├── queryController.js # Query handlers
│   │   │   └── documentController.js # Document handlers
│   │   ├── services/
│   │   │   ├── ragService.js      # RAG orchestration
│   │   │   ├── embeddingService.js # Text embeddings
│   │   │   ├── retrievalService.js # Vector search
│   │   │   ├── ollamaService.js   # LLM integration
│   │   │   └── documentService.js # Document parsing
│   │   └── data/
│   │       ├── medical_documents.json
│   │       └── test_queries.json
│   ├── uploads/                   # Temporary file storage
│   ├── vector_store/              # Persisted embeddings
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.js                 # Main component
│   │   ├── components/
│   │   │   ├── ChatUI.js          # Chat interface
│   │   │   ├── ContextViewer.js   # Retrieved context display
│   │   │   └── DocumentUpload.js  # File upload component
│   │   └── services/
│   │       └── api.js             # API client
│   ├── package.json
│   └── vite.config.js
├── docs/
│   └── SAMPLE_MEDICAL_DOCUMENTS.md
└── README.md
```

---

## 🔧 Troubleshooting

### Ollama Not Running

**Error:** "Ollama is not running"

**Solution:**
```bash
ollama serve
```

### Model Not Found

**Error:** "model 'llama3' not found"

**Solution:**
```bash
ollama pull llama3
```

### Embedding Model Download Slow

The first run downloads the embedding model (~80MB). Subsequent runs are cached.

### Port Already in Use

**Error:** "Port 5000 is already in use"

**Solution:** Change `PORT` in `backend/.env`

---

## 🔒 Privacy & Security

This system is designed for **complete data privacy**:

- ✅ No external API calls (except initial model download)
- ✅ All embeddings generated locally (Transformers.js)
- ✅ All inference runs locally (Ollama)
- ✅ Vector store persisted locally (JSON files)
- ✅ Uploaded files deleted after processing
- ✅ No telemetry or analytics

**HIPAA Compliance Considerations:**
- Data never leaves the local system
- No third-party data processing
- Suitable for on-premise deployment in healthcare settings

---

## 🎯 Success Criteria

The system successfully:

- [x] Accepts natural language queries
- [x] Retrieves relevant document chunks
- [x] Generates context-grounded responses
- [x] Runs entirely offline (after setup)
- [x] Provides comparison mode (RAG vs. Baseline)
- [x] Displays source attribution
- [x] Processes documents automatically
- [x] Achieves sub-5 second response times

---

## 🚀 Future Enhancements

Potential improvements:

- [ ] Multilingual support (Tamil + English)
- [ ] Confidence scores for responses
- [ ] Patient record integration
- [ ] Advanced chunking strategies
- [ ] Multiple vector indices for different specialties
- [ ] Citation extraction and linking
- [ ] Response streaming
- [ ] Conversation history

---

## 📄 License

This project is for educational and research purposes.

---

## 🙏 Acknowledgments

- **Ollama** - Local LLM runtime
- **Transformers.js** - In-browser/local embeddings
- **Express.js** - API framework
- **React** - UI framework
- **Vite** - Build tool

---

**Built with ❤️ for healthcare providers who need privacy-preserving AI.**
#   n m - p r o j e c t  
 #   n m - p r o j e c t  
 