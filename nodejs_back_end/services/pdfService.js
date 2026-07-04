const PDFDocument = require('pdfkit');

exports.generateTablePDF = (res, title, headers, rows) => {
  const doc = new PDFDocument({ margin: 30, size: 'A4' });

  // Stream output to response
  doc.pipe(res);

  // Add Document Header
  doc.fontSize(20).text(title, { align: 'center' });
  doc.moveDown(2);

  // Table Configuration
  const tableTop = 100;
  const colWidths = headers.map(h => h.width || 100);
  const rowHeight = 25;

  let currentY = tableTop;

  // Draw Headers
  doc.fontSize(10).fillColor('#ffffff');
  // Draw Header Background
  doc.rect(30, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#2c3e50');

  // Print Header Text
  let currentX = 30;
  doc.fillColor('#ffffff');
  headers.forEach((h, index) => {
    doc.text(h.label, currentX + 5, currentY + 7, { width: colWidths[index] - 10, align: 'left' });
    currentX += colWidths[index];
  });

  currentY += rowHeight;

  // Draw Rows
  doc.fillColor('#000000');
  rows.forEach((row, rowIndex) => {
    // Check page overflow
    if (currentY + rowHeight > 800) {
      doc.addPage();
      currentY = 30;
    }

    // Zebra striping background
    if (rowIndex % 2 === 0) {
      doc.rect(30, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#f9f9f9');
    }

    doc.fillColor('#000000');
    currentX = 30;
    row.forEach((cell, cellIndex) => {
      const val = cell !== null && cell !== undefined ? cell.toString() : '';
      doc.text(val, currentX + 5, currentY + 7, { width: colWidths[cellIndex] - 10, align: 'left' });
      currentX += colWidths[cellIndex];
    });

    currentY += rowHeight;
  });

  doc.end();
};
