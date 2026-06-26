import { jsPDF } from "jspdf";

/**
 * Generates a high-resolution, print-ready PDF containing reward slips.
 * Laid out as 5 columns by 10 rows (50 slips) on A4 Portrait pages.
 */
export function generateRewardSlipsPDF(codes: string[], filename: string) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  
  // Set margins to 8mm for a larger printable area
  const marginLeft = 8;
  const marginTop = 8;
  const marginRight = 8;
  const marginBottom = 8;
  
  const cols = 5;
  const rows = 10;

  const totalWidthForTickets = pageWidth - marginLeft - marginRight;
  const ticketWidth = totalWidthForTickets / cols; // 194 / 5 = 38.8mm

  const totalHeightForTickets = pageHeight - marginTop - marginBottom;
  const ticketHeight = totalHeightForTickets / rows; // 281 / 10 = 28.1mm

  const slipsPerPage = cols * rows; // 50

  for (let index = 0; index < codes.length; index++) {
    const pageIndex = Math.floor(index / slipsPerPage);
    const slipOnPageIndex = index % slipsPerPage;
    const colIndex = slipOnPageIndex % cols;
    const rowIndex = Math.floor(slipOnPageIndex / cols);

    // If we've reached a new page (beyond the first page), add it.
    if (index > 0 && slipOnPageIndex === 0) {
      doc.addPage();
    }

    const x = marginLeft + colIndex * ticketWidth;
    const y = marginTop + rowIndex * ticketHeight;

    const code = codes[index];

    // --- 1. DRAW SLIP BORDER (Dashed Cut Lines) ---
    doc.setLineDashPattern([1.5, 1], 0);
    doc.setDrawColor(180, 185, 190); // Grayish border for cutting
    doc.setLineWidth(0.15);
    doc.rect(x, y, ticketWidth, ticketHeight, "S");
    doc.setLineDashPattern([], 0); // Reset to solid

    // --- 2. BRAND HEADER TEXT ---
    doc.setTextColor(15, 138, 95); // MUVA Emerald Green (#0F8A5F)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("MUVA Mobility", x + ticketWidth / 2, y + 4.5, { align: "center" });

    // Tagline
    doc.setTextColor(120, 125, 135); // Gray text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(3.8);
    doc.text("Powering Smarter Mobility", x + ticketWidth / 2, y + 6.8, { align: "center" });

    // --- 3. THANK YOU MESSAGE ---
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.setFont("helvetica", "bold");
    doc.setFontSize(4.5);
    doc.text("Thank you for riding with MUVA!", x + ticketWidth / 2, y + 10.2, { align: "center" });

    // --- 4. REWARD CODE CONTAINER BOX ---
    // Background: very light gray box
    doc.setFillColor(243, 244, 246); // Gray-100
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.setLineWidth(0.15);
    const boxWidth = 32;
    const boxHeight = 5.5;
    const boxX = x + (ticketWidth - boxWidth) / 2;
    const boxY = y + 11.8;
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 1, 1, "FD");

    // Box Value: The actual code
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.text(code, boxX + boxWidth / 2, boxY + 4.0, { align: "center" });

    // --- 5. INSTRUCTIONS & WEBSITE ---
    doc.setTextColor(15, 138, 95); // MUVA Green
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5);
    doc.text("www.muvamobility.com", x + ticketWidth / 2, y + 20.8, { align: "center" });

    doc.setTextColor(75, 85, 99); // Gray-600
    doc.setFont("helvetica", "normal");
    doc.setFontSize(3.8);
    doc.text("Record code to earn points", x + ticketWidth / 2, y + 23.2, { align: "center" });

    // --- 6. CALL TO ACTION ---
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont("helvetica", "italic");
    doc.setFontSize(3.8);
    doc.text("Keep riding with MUVA to earn rewards!", x + ticketWidth / 2, y + 26.0, { align: "center" });
  }

  doc.save(filename);
}
