# Medical Document Intelligence System: A Privacy-Preserving RAG Report

## Abstract

This project delivers a local medical document intelligence system that uses Retrieval-Augmented Generation (RAG) and local LLMs to answer clinical queries with high accuracy and private processing. The system accepts PDF and text records, embeds document chunks, retrieves relevant content, and generates responses with source attribution.

## Introduction

Healthcare providers need fast, private access to medical records. Cloud services create privacy risk and compliance issues. This system solves that by processing data locally and using a RAG pipeline to improve accuracy over baseline LLM responses.

## Objectives

- Build a privacy-preserving query system for medical documents
- Support PDF and TXT document uploads
- Use local embeddings and local LLM inference
- Provide source-aware answers and RAG comparison
- Keep all data processing offline

## Architecture

The solution uses a React frontend, Express backend, and Ollama local LLM service. Document text is extracted, chunked, embedded, and stored in a vector database for similarity search.

### Components

- Frontend: React and Vite for chat and document upload
- Backend: Express API with upload, query, comparison, and stats routes
- Embeddings: Transformers.js with all-MiniLM-L6-v2
- Vector store: JSON-backed in-memory store with cosine similarity search
- LLM: Ollama local model for response generation

## System Flow

1. Upload document
2. Extract and chunk text
3. Create embeddings for each chunk
4. Store vectors and metadata
5. Embed query and retrieve top matches
6. Build RAG prompt and generate answer locally

## Requirements

### Functional

- Upload PDF/TXT files (max 10MB)
- Extract text and preserve metadata
- Accept natural language queries
- Return RAG and baseline answers
- Show source attribution

### Non-Functional

- Response time under 5 seconds
- Local processing only
- Intuitive browser interface
- Compatible with modern browsers and Windows

## Implementation

### Backend

The backend uses Express with routes for upload, query, compare, documents, and stats. It integrates with embedding, retrieval, and Ollama services to process requests.

### Frontend

The frontend offers a chat interface, document upload component, and context viewer. It communicates with the backend via Axios.

### Document Processing

PDF and text uploads are parsed, cleaned, and split into semantically meaningful chunks. Each chunk is embedded and stored with metadata.

### RAG Pipeline

The query text is embedded, then the system retrieves the top-k most similar chunks. Those chunks are included in the prompt to the local LLM, producing an answer with citations.

## Evaluation

Testing focused on functionality, performance, and clinical safety. The system was validated for document ingestion, query accuracy, API behavior, and response relevance.

### Results

- Average query latency: 2-4 seconds
- Document upload processing: within acceptable limits
- RAG accuracy outperformed baseline responses
- Source attribution improved transparency

## Discussion

Local RAG adds value by reducing hallucinations and preserving patient privacy. The approach is suitable for hospitals and clinics that cannot use cloud AI due to compliance. The main constraint is local resource usage and single-user deployment.

### Limitations

- English-only support
- Limited to local hardware capacity
- Not yet multi-tenant

### Future Work

- Add multilingual support
- Introduce advanced indexing (e.g., Faiss)
- Improve UI responsiveness and mobile layout
- Add integration with EHR systems

## Conclusion

The project successfully demonstrates a privacy-preserving, locally hosted medical document intelligence system using RAG. It combines local embeddings, vector retrieval, and local LLM generation to deliver accurate, accountable answers without cloud dependency.

## References

1. Lewis, P., et al. (2020). Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks.
2. Vaswani, A., et al. (2017). Attention Is All You Need.
3. Devlin, J., et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding.
4. Ollama Documentation, 2023.
5. HIPAA Privacy Rule, 2003.
