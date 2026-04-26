import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function convertMarkdownToPDF() {
  try {
    console.log('Reading markdown file...');
    const markdownPath = path.join(__dirname, '..', 'TECHNICAL_REPORT.md');
    const markdownContent = fs.readFileSync(markdownPath, 'utf8');

    console.log('Converting markdown to HTML...');
    const md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true
    });

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Medical Document Intelligence System - Technical Report</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 40px;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 30px;
            margin-bottom: 15px;
            page-break-after: avoid;
        }
        h1 { font-size: 28px; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        h2 { font-size: 24px; border-bottom: 1px solid #bdc3c7; padding-bottom: 5px; }
        h3 { font-size: 20px; }
        h4 { font-size: 18px; }
        p { margin-bottom: 15px; text-align: justify; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            page-break-inside: avoid;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        tr:nth-child(even) { background-color: #f8f9fa; }
        code {
            background-color: #f4f4f4;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        pre {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            page-break-inside: avoid;
        }
        blockquote {
            border-left: 4px solid #3498db;
            padding-left: 15px;
            margin: 20px 0;
            font-style: italic;
            color: #555;
        }
        ul, ol { margin-bottom: 15px; padding-left: 30px; }
        li { margin-bottom: 5px; }
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; }
        @media print {
            body { margin: 20px; }
            h1, h2, h3 { page-break-after: avoid; }
            table { page-break-inside: avoid; }
            pre { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    ${md.render(markdownContent)}
</body>
</html>`;

    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    console.log('Setting content and generating PDF...');
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfPath = path.join(__dirname, '..', 'TECHNICAL_REPORT.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '1in',
        right: '1in',
        bottom: '1in',
        left: '1in'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 1in;">
          Medical Document Intelligence System - Technical Report
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 1in;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });

    await browser.close();

    console.log(`✅ PDF generated successfully: ${pdfPath}`);
    console.log('📄 Your technical report is ready for submission!');

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    process.exit(1);
  }
}

convertMarkdownToPDF();