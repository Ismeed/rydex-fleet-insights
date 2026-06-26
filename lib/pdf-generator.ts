import { jsPDF } from "jspdf";

/**
 * Generates a high-resolution, print-ready PDF containing reward slips.
 * Laid out as 4 columns by 5 rows on A4 Portrait pages.
 */
export function generateRewardSlipsPDF(codes: string[], filename: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 10;
  const marginTop = 10;
  const marginRight = 10;
  const marginBottom = 10;
  
  const cols = 4;
  const rows = 5;
  const gapX = 3.5;
  const gapY = 4;

  const totalWidthForTickets = pageWidth - marginLeft - marginRight - (cols - 1) * gapX;
  const ticketWidth = totalWidthForTickets / cols; // ~44.875mm

  const totalHeightForTickets = pageHeight - marginTop - marginBottom - (rows - 1) * gapY;
  const ticketHeight = totalHeightForTickets / rows; // ~52.2mm

  const slipsPerPage = cols * rows;

  for (let index = 0; index < codes.length; index++) {
    const pageIndex = Math.floor(index / slipsPerPage);
    const slipOnPageIndex = index % slipsPerPage;
    const colIndex = slipOnPageIndex % cols;
    const rowIndex = Math.floor(slipOnPageIndex / cols);

    // If we've reached a new page (beyond the first page), add it.
    if (index > 0 && slipOnPageIndex === 0) {
      doc.addPage();
    }

    const x = marginLeft + colIndex * (ticketWidth + gapX);
    const y = marginTop + rowIndex * (ticketHeight + gapY);

    const code = codes[index];

    // --- 1. DRAW SLIP BORDER ---
    // Outer border: thin line, rounded corners
    doc.setDrawColor(209, 213, 219); // Gray-300 for crisp print lines
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, ticketWidth, ticketHeight, 2.5, 2.5, "S");

    // --- 2. DRAW HEADER BRAND ACCENT BAR ---
    doc.setFillColor(15, 138, 95); // MUVA Emerald Green (#0F8A5F)
    doc.roundedRect(x, y, ticketWidth, 7, 2.5, 2.5, "F");
    // Draw flat rectangle over the bottom part of the header to remove bottom-roundness
    doc.rect(x, y + 4, ticketWidth, 3, "F");

    // --- 3. BRAND HEADER TEXT ---
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("MUVA Mobility", x + ticketWidth / 2, y + 4.5, { align: "center" });

    // --- 4. SUB-HEADER ---
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.text("Powering Smarter Mobility", x + ticketWidth / 2, y + 9.5, { align: "center" });

    // --- 5. THANK YOU MESSAGE ---
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.text("Thank you for riding with MUVA!", x + ticketWidth / 2, y + 13.5, { align: "center" });

    // --- 6. REWARD CODE CONTAINER BOX ---
    // Background: very light gray box with thin gray outline
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.setLineWidth(0.2);
    const boxX = x + 2.5;
    const boxY = y + 16.5;
    const boxWidth = ticketWidth - 5;
    const boxHeight = 10;
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1.5, 1.5, "FD");

    // Box Label: REWARD CODE
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4);
    doc.text("REWARD CODE", boxX + boxWidth / 2, boxY + 3.2, { align: "center" });

    // Box Value: The actual code (using courier for clear monospaced layout)
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.setFont("courier", "bold");
    doc.setFontSize(9.5);
    doc.text(code, boxX + boxWidth / 2, boxY + 7.8, { align: "center" });

    // --- 7. INSTRUCTIONS ---
    // URL
    doc.setTextColor(15, 138, 95); // MUVA Green
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.text("www.muvamobility.com", x + ticketWidth / 2, y + 30.5, { align: "center" });

    // Description text
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.2);
    doc.text("Create an account & record code to earn points.", x + ticketWidth / 2, y + 33.5, { align: "center" });

    // --- 8. CALL TO ACTION ---
    doc.setTextColor(75, 85, 99); // Gray-600
    doc.setFont("helvetica", "italic");
    doc.setFontSize(4.2);
    doc.text("Ride more. Earn more. Redeem Airtime/Data.", x + ticketWidth / 2, y + 37, { align: "center" });

    // --- 9. QR CODE PLACEHOLDER (Bottom Center) ---
    const qrSize = 5.5;
    const qrX = x + ticketWidth / 2 - qrSize / 2;
    const qrY = y + 39.5;
    doc.setDrawColor(156, 163, 175); // Gray-400
    doc.setLineWidth(0.15);
    doc.rect(qrX, qrY, qrSize, qrSize, "S");
    
    // Draw decorative corner blocks of QR code
    doc.line(qrX + 0.8, qrY + 0.8, qrX + 2, qrY + 0.8);
    doc.line(qrX + 0.8, qrY + 0.8, qrX + 0.8, qrY + 2);
    doc.line(qrX + qrSize - 2, qrY + 0.8, qrX + qrSize - 0.8, qrY + 0.8);
    doc.line(qrX + qrSize - 0.8, qrY + 0.8, qrX + qrSize - 0.8, qrY + 2);
    doc.line(qrX + 0.8, qrY + qrSize - 0.8, qrX + 2, qrY + qrSize - 0.8);
    doc.line(qrX + 0.8, qrY + qrSize - 2, qrX + 0.8, qrY + qrSize - 0.8);
    doc.line(qrX + qrSize - 2, qrY + qrSize - 0.8, qrX + qrSize - 0.8, qrY + qrSize - 0.8);
    doc.line(qrX + qrSize - 0.8, qrY + qrSize - 2, qrX + qrSize - 0.8, qrY + qrSize - 0.8);
    // Center pixel
    doc.setFillColor(156, 163, 175);
    doc.rect(qrX + 2.2, qrY + 2.2, 1.1, 1.1, "F");

    // --- 10. FOOTER ---
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.setFont("helvetica", "normal");
    doc.setFontSize(3.8);
    doc.text("Powered by MUVA Mobility", x + ticketWidth / 2, y + 49.5, { align: "center" });
  }

  doc.save(filename);
}
