/**
 * RAG System Evaluation Script
 * Evaluates system performance on 20 medical queries
 * Compares RAG vs. Baseline responses
 *
 * Usage: node src/data/evaluate.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'http://localhost:5000/api';

// Load test queries
const testQueriesPath = path.join(__dirname, '../../data/test_queries.json');

async function loadTestQueries() {
  const data = await fs.readFile(testQueriesPath, 'utf-8');
  return JSON.parse(data).testQueries;
}

async function evaluateQuery(query) {
  try {
    const response = await axios.post(`${API_BASE}/compare`, { query });
    return response.data;
  } catch (error) {
    return {
      query,
      error: error.message,
      rag: { answer: 'ERROR', processingTimeMs: 0 },
      baseline: { answer: 'ERROR', processingTimeMs: 0 }
    };
  }
}

function calculateMetrics(results) {
  const metrics = {
    totalQueries: results.length,
    successfulQueries: 0,
    failedQueries: 0,
    avgRagTime: 0,
    avgBaselineTime: 0,
    ragFaster: 0,
    baselineFaster: 0,
    avgTimeImprovement: 0
  };

  let ragTimes = [];
  let baselineTimes = [];

  for (const result of results) {
    if (result.error) {
      metrics.failedQueries++;
    } else {
      metrics.successfulQueries++;
      ragTimes.push(result.rag.processingTimeMs);
      baselineTimes.push(result.baseline.processingTimeMs);

      if (result.rag.processingTimeMs < result.baseline.processingTimeMs) {
        metrics.ragFaster++;
      } else {
        metrics.baselineFaster++;
      }
    }
  }

  if (ragTimes.length > 0) {
    metrics.avgRagTime = Math.round(ragTimes.reduce((a, b) => a + b, 0) / ragTimes.length);
    metrics.avgBaselineTime = Math.round(baselineTimes.reduce((a, b) => a + b, 0) / baselineTimes.length);
  }

  return metrics;
}

function printResults(results, metrics) {
  console.log('\n' + '='.repeat(80));
  console.log('           MEDICAL RAG SYSTEM - EVALUATION REPORT');
  console.log('='.repeat(80));

  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(40));
  console.log(`Total Queries:     ${metrics.totalQueries}`);
  console.log(`Successful:        ${metrics.successfulQueries}`);
  console.log(`Failed:            ${metrics.failedQueries}`);
  console.log(`Success Rate:      ${((metrics.successfulQueries / metrics.totalQueries) * 100).toFixed(1)}%`);

  console.log('\n⏱️  PERFORMANCE');
  console.log('-'.repeat(40));
  console.log(`Avg RAG Time:      ${metrics.avgRagTime}ms`);
  console.log(`Avg Baseline Time: ${metrics.avgBaselineTime}ms`);
  console.log(`RAG Faster:        ${metrics.ragFaster}/${metrics.successfulQueries} queries`);
  console.log(`Baseline Faster:   ${metrics.baselineFaster}/${metrics.successfulQueries} queries`);

  console.log('\n📋 DETAILED RESULTS');
  console.log('-'.repeat(80));

  console.log(
    '#'.padEnd(3) +
    'Query'.padEnd(50) +
    'RAG (ms)'.padStart(12) +
    'Base (ms)'.padStart(12) +
    'Winner'.padStart(10)
  );
  console.log('-'.repeat(80));

  results.forEach((result, index) => {
    if (result.error) {
      console.log(`${index + 1}. ${result.query.substring(0, 47)}... ERROR`);
    } else {
      const winner = result.rag.processingTimeMs < result.baseline.processingTimeMs ? 'RAG' : 'Base';
      console.log(
        `${index + 1}. ${result.query.substring(0, 47).padEnd(50)} ` +
        `${String(result.rag.processingTimeMs).padStart(10)} ` +
        `${String(result.baseline.processingTimeMs).padStart(10)} ` +
        `${winner.padStart(10)}`
      );
    }
  });

  console.log('-'.repeat(80));

  // Sample responses
  console.log('\n📝 SAMPLE RESPONSES');
  console.log('-'.repeat(80));

  const sampleIndices = [0, 5, 10]; // Show first, middle, last
  for (const idx of sampleIndices) {
    if (results[idx] && !results[idx].error) {
      const result = results[idx];
      console.log(`\nQuery: ${result.query}`);
      console.log('\nRAG Response:');
      console.log('  ' + result.rag.answer.substring(0, 200) + (result.rag.answer.length > 200 ? '...' : ''));
      console.log('\nBaseline Response:');
      console.log('  ' + result.baseline.answer.substring(0, 200) + (result.baseline.answer.length > 200 ? '...' : ''));
      console.log('-'.repeat(80));
    }
  }

  console.log('\n✅ EVALUATION COMPLETE');
  console.log('='.repeat(80) + '\n');
}

async function saveResults(results, metrics) {
  const reportPath = path.join(__dirname, '../../data/evaluation_report.json');
  const report = {
    timestamp: new Date().toISOString(),
    metrics,
    results: results.map(({ query, ...rest }) => ({
      question: query,
      ...rest
    }))
  };

  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📁 Full report saved to: ${reportPath}`);
}

async function runEvaluation() {
  console.log('\n🔍 Starting RAG System Evaluation...\n');

  // Check API health
  try {
    await axios.get(`${API_BASE}/health`);
    console.log('✓ API is available');
  } catch (error) {
    console.error('✗ API is not available. Make sure the backend is running.');
    console.error(`  Expected: ${API_BASE}`);
    process.exit(1);
  }

  // Load test queries
  console.log('Loading test queries...');
  const queries = await loadTestQueries();
  console.log(`Loaded ${queries.length} test queries\n`);

  // Run evaluation
  const results = [];
  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    console.log(`[${i + 1}/${queries.length}] Evaluating: ${q.query.substring(0, 40)}...`);

    const result = await evaluateQuery(q.query);
    results.push(result);

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate metrics
  const metrics = calculateMetrics(results);

  // Print results
  printResults(results, metrics);

  // Save results
  await saveResults(results, metrics);
}

// Run evaluation
runEvaluation().catch(err => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});
