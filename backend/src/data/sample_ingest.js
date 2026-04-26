/**
 * Sample Document Ingestion Script
 * Run this to quickly populate the knowledge base with sample medical data
 *
 * Usage: node src/data/sample_ingest.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_BASE = 'http://localhost:7000/api';

// Sample medical documents to ingest
const sampleDocuments = [
  {
    name: 'Pneumonia Guidelines',
    content: `PNEUMONIA CLINICAL GUIDELINES

SYMPTOMS
Pneumonia typically presents with fever (often high-grade, >38°C), productive cough with purulent sputum, pleuritic chest pain, shortness of breath, tachypnea, tachycardia, fatigue, and confusion in elderly patients.

DIAGNOSIS
Diagnostic criteria include: 1) Clinical presentation consistent with lower respiratory tract infection, 2) New infiltrate on chest radiograph (gold standard), 3) Supportive findings: elevated WBC count, hypoxemia.

TREATMENT - OUTPATIENT
First-line: Amoxicillin 1g TID for 5-7 days. Alternative: Doxycycline 100mg BID. For comorbidities: Amoxicillin-clavulanate PLUS macrolide (azithromycin).

TREATMENT - INPATIENT
Beta-lactam (ceftriaxone, ampicillin-sulbactam) PLUS macrolide. Respiratory fluoroquinolone monotherapy (levofloxacin, moxifloxacin).

CURB-65 SCORE
Used for severity assessment: Confusion, Urea >19 mg/dL, Respiratory rate >=30/min, Blood pressure (systolic <90 or diastolic <=60), Age >=65. Score 0-1: Outpatient. Score 2: Hospitalize. Score >=3: ICU consideration.`
  },
  {
    name: 'Type 2 Diabetes Management',
    content: `TYPE 2 DIABETES MELLITUS MANAGEMENT

SYMPTOMS
Classic symptoms of hyperglycemia: Polyuria (frequent urination), Polydipsia (increased thirst), Polyphagia (increased hunger), unexplained weight loss, fatigue, blurred vision, slow-healing wounds, recurrent infections.

DIAGNOSIS
Diagnostic criteria (confirmed on two occasions): 1) Fasting plasma glucose >=126 mg/dL, 2) HbA1c >=6.5%, 3) 2-hour plasma glucose >=200 mg/dL during OGTT, 4) Random glucose >=200 mg/dL with symptoms.

TREATMENT - LIFESTYLE
Medical nutrition therapy, physical activity >=150 min/week, weight loss 5-10% of body weight, diabetes self-management education.

TREATMENT - PHARMACOLOGIC
First-line: Metformin 500-2000 mg/day (contraindicated in eGFR <30). Second-line based on comorbidities: GLP-1 RA for ASCVD, SGLT2i for heart failure, ACEi/ARB for CKD.

GLYCEMIC TARGETS
HbA1c <7.0% for most adults. Fasting glucose 80-130 mg/dL. Postprandial glucose <180 mg/dL.`
  },
  {
    name: 'Hypertension Management',
    content: `HYPERTENSION MANAGEMENT GUIDELINES

DIAGNOSIS - BLOOD PRESSURE CATEGORIES
Normal: <120/<80 mmHg. Elevated: 120-129/<80. Stage 1 HTN: 130-139 OR 80-89. Stage 2 HTN: >=140 OR >=90.

TREATMENT - LIFESTYLE
DASH diet (fruits, vegetables, low-fat dairy). Sodium reduction <2300 mg/day (ideally <1500 mg). Weight loss (1 kg loss = 1 mmHg reduction). Physical activity 90-150 min/week. Alcohol moderation.

TREATMENT - PHARMACOLOGIC
First-line agents: Thiazide diuretics (chlorthalidone, HCTZ), ACE inhibitors (lisinopril), ARBs (losartan), Calcium channel blockers (amlodipine).

SPECIAL POPULATIONS
Black patients: Thiazide or CCB preferred. CKD: ACEi or ARB (renoprotective). Diabetes: ACEi or ARB first-line. Pregnancy: Methyldopa, labetalol, nifedipine (AVOID ACEi/ARB).

BLOOD PRESSURE TARGETS
Most adults: <130/80 mmHg. Elderly/frail: Individualize.`
  },
  {
    name: 'Acute Coronary Syndrome',
    content: `ACUTE CORONARY SYNDROME (ACS)

SYMPTOMS
Classic: Chest pain/pressure (substernal, radiating to arm, jaw, back), described as squeezing/tightness. Associated: dyspnea, diaphoresis, nausea, lightheadedness. Duration >20 minutes.

DIAGNOSIS
Initial workup within 10 minutes: 12-lead ECG, cardiac biomarkers (troponin), chest X-ray, basic labs. STEMI: ST elevation. NSTEMI: No ST elevation, elevated troponin. Unstable Angina: No ST elevation, normal troponin.

IMMEDIATE MANAGEMENT - MONA-B
Morphine (for pain not relieved by nitrates), Oxygen (if SpO2 <90%), Nitroglycerin (sublingual/IV), Aspirin 325mg chewed, Beta-blocker (within 24 hours).

ANTIPLATELET THERAPY
Dual antiplatelet therapy (DAPT): Aspirin + P2Y12 inhibitor (Clopidogrel, Ticagrelor, Prasugrel).

REPERFUSION FOR STEMI
Primary PCI (preferred, within 90 minutes). Fibrinolysis if PCI unavailable within 120 minutes (alteplase, tenecteplase).`
  },
  {
    name: 'Asthma Management',
    content: `ASTHMA MANAGEMENT GUIDELINES

SYMPTOMS
Wheezing (expiratory), dyspnea (episodic), chest tightness, cough (worse at night/early morning). Triggered by allergens, exercise, cold air, viral infections, irritants.

DIAGNOSIS
Clinical criteria: 1) Recurrent episodes of wheezing, coughing, dyspnea, chest tightness. 2) Variable expiratory airflow limitation (FEV1 increases >12% AND >200mL post-bronchodilator).

SEVERITY CLASSIFICATION
Intermittent: Symptoms <=2 days/week. Mild Persistent: >2 days/week. Moderate Persistent: Daily symptoms. Severe Persistent: Symptoms throughout day.

TREATMENT - STEPWISE
Step 1 (Intermittent): SABA PRN. Step 2 (Mild Persistent): Low-dose ICS. Step 3 (Moderate): Low-dose ICS + LABA. Step 4-5 (Severe): Medium/High-dose ICS + LABA, consider biologics.

EXACERBATION MANAGEMENT
SABA + Ipratropium via nebulizer. Systemic corticosteroids (Prednisone 40-60mg). Oxygen to maintain SpO2 >=90%. Consider IV Magnesium sulfate for severe cases.`
  }
];

async function ingestSampleDocuments() {
  console.log('=== Sample Document Ingestion ===\n');

  for (const doc of sampleDocuments) {
    console.log(`Ingesting: ${doc.name}...`);

    try {
      const response = await axios.post(`${API_BASE}/documents/ingest-text`, {
        text: doc.content,
        name: doc.name
      });

      if (response.data.success) {
        console.log(`  ✓ Success: ${response.data.chunksProcessed} chunks processed\n`);
      } else {
        console.log(`  ✗ Failed: ${response.data.error}\n`);
      }
    } catch (error) {
      console.log(`  ✗ Error: ${error.message}`);
      console.log(`  Make sure the backend is running on ${API_BASE}\n`);
    }
  }

  // Get stats
  try {
    const statsResponse = await axios.get(`${API_BASE}/stats`);
    console.log('\n=== Knowledge Base Stats ===');
    console.log(`Total chunks: ${statsResponse.data.totalChunks}`);
    console.log(`Embedding dimension: ${statsResponse.data.embeddingDimension}`);
  } catch (error) {
    console.log('Could not fetch stats:', error.message);
  }

  console.log('\n=== Done! ===');
  console.log('You can now query the system at http://localhost:7000');
}

// Run if executed directly
ingestSampleDocuments().catch(console.error);
