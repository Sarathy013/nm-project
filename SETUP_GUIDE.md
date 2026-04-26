# Quick Setup Guide - Medical Document Intelligence System

Follow these steps to get the system running in under 10 minutes.

---

## Step 1: Install Ollama (Required)

### Windows Installation

1. Download Ollama from: https://ollama.ai/download
2. Run the installer
3. After installation, open a new terminal and verify:
   ```bash
   ollama --version
   ```

### Download the LLM Model

```bash
# Download LLaMA 3 (recommended, ~5GB)
ollama pull llama3

# OR download Mistral (smaller, ~4GB)
ollama pull mistral
```

---

## Step 2: Install Node.js (if not already installed)

1. Download from: https://nodejs.org/
2. Choose LTS version (v18+)
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```

---

## Step 3: Install Project Dependencies

```bash
# Navigate to project
cd C:\Users\shali\Desktop\nm1

# Install backend
cd backend
npm install

# Install frontend (new terminal)
cd ../frontend
npm install
```

---

## Step 4: Start the System

### Terminal 1 - Start Ollama (if not running)
```bash
ollama serve
```

### Terminal 2 - Start Backend
```bash
cd C:\Users\shali\Desktop\nm1\backend
npm run dev
```

Wait for: `API Server running on http://localhost:5000`

### Terminal 3 - Start Frontend
```bash
cd C:\Users\shali\Desktop\nm1\frontend
npm run dev
```

Wait for: `Local: http://localhost:3000`

---

## Step 5: Open the Application

Open your browser to: **http://localhost:3000**

---

## Step 6: Upload Sample Medical Documents

1. Click the **Documents** tab
2. Either:
   - Upload a PDF/TXT file, OR
   - Click "Paste Text" and paste content from `docs/SAMPLE_MEDICAL_DOCUMENTS.md`
3. Wait for processing to complete

---

## Step 7: Test the System

1. Go to **Chat Query** tab
2. Try these queries:
   - "What are the symptoms of pneumonia?"
   - "How do you diagnose type 2 diabetes?"
   - "What is the first-line treatment for hypertension?"
3. Enable **Compare Mode** to see RAG vs. Baseline

---

## Troubleshooting

### "Ollama is not running"
```bash
ollama serve
```

### "Model not found"
```bash
ollama pull llama3
```

### "Port already in use"
Edit `backend/.env` and change `PORT=5001`

### Frontend won't load
Make sure backend is running first, then restart frontend.

---

## Verify Everything Works

Run this in your browser console (F12):

```javascript
fetch('/api/health')
  .then(r => r.json())
  .then(d => console.log('API Status:', d))
```

Should output: `{ success: true, status: 'ok', ... }`

---

## Next Steps

1. Upload your own medical documents (PDFs, clinical guidelines)
2. Test with the 20 pre-defined queries in `backend/data/test_queries.json`
3. Evaluate RAG vs. Baseline performance
4. Customize the system prompt in `backend/src/services/ragService.js`

---

**Need help? Check `README.md` for full documentation.**
