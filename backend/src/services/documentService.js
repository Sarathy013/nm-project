/**
 * Document Service
 * Handles document ingestion, parsing, and chunking
 * Supports PDF and plain text formats
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import pdfParse from 'pdf-parse';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const DATA_FILE = path.join(__dirname, '../../data/medical_documents.json');

class DocumentService {
  constructor() {
    this.documents = [];
  }

  /**
   * Initialize document store
   */
  async initialize() {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      this.documents = JSON.parse(data);
      console.log(`Loaded ${this.documents.length} document records`);
    } catch (error) {
      this.documents = [];
      console.log('No existing document records, starting fresh');
    }
  }

  /**
   * Parse uploaded file and extract text
   * @param {object} file - Multer file object
   * @returns {Promise<string>} - Extracted text
   */
  async parseFile(file) {
    const filePath = file.path;
    const ext = path.extname(file.originalname).toLowerCase();

    let text = '';

    if (ext === '.pdf') {
      const pdfBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(pdfBuffer);
      text = pdfData.text;
    } else if (ext === '.txt') {
      text = await fs.readFile(filePath, 'utf-8');
    } else {
      // Try to parse as text anyway
      text = await fs.readFile(filePath, 'utf-8');
    }

    return this.cleanText(text);
  }

  /**
   * Clean and normalize text
   */
  cleanText(text) {
    return text
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')          // Collapse whitespace
      .replace(/\n\s*\n/g, '\n\n')      // Normalize paragraph breaks
      .replace(/^\s+|\s+$/g, '')        // Trim
      .replace(/[^\S\n]+/g, ' ');       // Remove multiple spaces but keep newlines
  }

  /**
   * Chunk text into meaningful sections
   * Uses medical document structure: symptoms, diagnosis, treatment, guidelines
   * @param {string} text - Full document text
   * @param {object} metadata - Document metadata
   * @returns {Array} - Array of chunks
   */
  chunkText(text, metadata = {}) {
    const chunks = [];

    // Split by major sections (headers)
    const sections = this.splitBySections(text);

    for (const section of sections) {
      // If section is too long, further split by paragraphs
      if (section.content.length > 1000) {
        const subChunks = this.splitByParagraphs(section.content);
        for (const subChunk of subChunks) {
          if (subChunk.trim().length > 50) { // Minimum chunk size
            chunks.push({
              text: subChunk.trim(),
              metadata: {
                ...metadata,
                section: section.type,
                heading: section.heading || ''
              }
            });
          }
        }
      } else if (section.content.trim().length > 50) {
        chunks.push({
          text: section.content.trim(),
          metadata: {
            ...metadata,
            section: section.type,
            heading: section.heading || ''
          }
        });
      }
    }

    return chunks;
  }

  /**
   * Split text by medical section types
   */
  splitBySections(text) {
    const sections = [];

    // Common medical document section patterns
    const sectionPatterns = [
      { type: 'symptoms', pattern: /(?:symptoms?|clinical presentation|signs)/i },
      { type: 'diagnosis', pattern: /(?:diagnosis|diagnostic criteria|differential)/i },
      { type: 'treatment', pattern: /(?:treatment|therapy|management|intervention)/i },
      { type: 'guidelines', pattern: /(?:guidelines?|recommendations?|protocol)/i },
      { type: 'epidemiology', pattern: /(?:epidemiology|prevalence|incidence)/i },
      { type: 'etiology', pattern: /(?:etiology|causes?|pathophysiology|risk factors?)/i },
      { type: 'prognosis', pattern: /(?:prognosis|outcome|complications?)/i }
    ];

    const lines = text.split('\n');
    let currentSection = { type: 'general', content: '', heading: '' };

    for (const line of lines) {
      const isHeading = this.isHeading(line);

      if (isHeading) {
        // Save previous section if has content
        if (currentSection.content.trim().length > 50) {
          sections.push({ ...currentSection });
        }

        // Detect section type
        const matchedType = sectionPatterns.find(p => p.pattern.test(line));
        currentSection = {
          type: matchedType ? matchedType.type : 'general',
          content: '',
          heading: line.trim()
        };
      } else {
        currentSection.content += line + '\n';
      }
    }

    // Don't forget the last section
    if (currentSection.content.trim().length > 50) {
      sections.push(currentSection);
    }

    return sections;
  }

  /**
   * Split text by paragraphs
   */
  splitByParagraphs(text) {
    return text.split(/\n\n+/);
  }

  /**
   * Check if line is a heading
   */
  isHeading(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > 100) return false;

    // Common heading indicators
    const headingPatterns = [
      /^[A-Z][A-Z\s]+$/,           // ALL CAPS
      /^[A-Z][a-z]+:/,             // Title case with colon
      /^\d+\.\s+[A-Z]/,            // Numbered section
      /^[A-Z][^.!?]{0,50}$/        // Short title-like text
    ];

    return headingPatterns.some(p => p.test(trimmed));
  }

  /**
   * Store document metadata
   */
  async storeDocument(name, type, chunkCount) {
    await this.initialize();

    const doc = {
      id: uuidv4(),
      name,
      type,
      chunkCount,
      uploadedAt: new Date().toISOString()
    };

    this.documents.push(doc);
    await this.persist();

    return doc;
  }

  /**
   * Persist document records
   */
  async persist() {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(this.documents, null, 2));
  }

  /**
   * Get all documents
   */
  getDocuments() {
    return this.documents;
  }

  /**
   * Delete document
   */
  async deleteDocument(id) {
    this.documents = this.documents.filter(d => d.id !== id);
    await this.persist();
  }
}

export default new DocumentService();
