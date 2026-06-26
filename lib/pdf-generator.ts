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

interface ColLayout {
  header: string;
  width: number;
  align: "left" | "right" | "center";
  getter: (item: any) => string;
}

export function generateReportPDF(
  reportType: "daily-ops" | "vehicles" | "drivers" | "rewards",
  items: any[],
  periodText: string,
  filename: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 15;
  const marginBottom = 15;

  // --- 1. DRAW BRANDED REPORT HEADER ---
  // Brand Green Header strip
  doc.setFillColor(15, 138, 95); // MUVA Green
  doc.rect(marginLeft, marginTop, 190, 1.5, "F");

  // Logo & Title Block
  doc.setTextColor(17, 24, 39); // Dark Slate
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MUVA Mobility", marginLeft, marginTop + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.text("Powering Smarter Mobility", marginLeft, marginTop + 11);

  // Right-aligned report details
  const reportTitles: Record<string, string> = {
    "daily-ops": "DAILY OPERATIONS REPORT",
    "vehicles": "VEHICLE PERFORMANCE REPORT",
    "drivers": "DRIVER PERFORMANCE REPORT",
    "rewards": "REWARD REDEMPTIONS REPORT",
  };
  const title = reportTitles[reportType] || "BUSINESS REPORT";
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text(title, pageWidth - marginRight, marginTop + 7, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(107, 114, 128);
  const genDateStr = `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  doc.text(genDateStr, pageWidth - marginRight, marginTop + 11, { align: "right" });

  // Divider
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.setLineWidth(0.2);
  doc.line(marginLeft, marginTop + 14, pageWidth - marginRight, marginTop + 14);

  // Period label
  doc.setTextColor(55, 65, 81); // Gray-700
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`Reporting Period: ${periodText}`, marginLeft, marginTop + 20);

  // --- 2. CALCULATE AND DRAW KPI GRID (4 cards) ---
  const cards: { label: string; value: string }[] = [];
  if (reportType === "daily-ops") {
    const totalRev = items.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const shiftsCount = items.length;
    const totalDist = items.reduce((sum, s) => sum + (s.distanceCovered || 0), 0);
    const totalHrs = items.reduce((sum, s) => sum + (s.hoursWorked || 0) + (s.minutesWorked || 0) / 60, 0);
    const avgRevHr = totalHrs > 0 ? Math.round(totalRev / totalHrs) : 0;

    cards.push(
      { label: "TOTAL REVENUE", value: `NGN ${totalRev.toLocaleString()}` },
      { label: "TOTAL SHIFTS", value: String(shiftsCount) },
      { label: "DISTANCE COVERED", value: `${Math.round(totalDist).toLocaleString()} KM` },
      { label: "AVG REVENUE / HOUR", value: `NGN ${avgRevHr.toLocaleString()}` }
    );
  } else if (reportType === "vehicles") {
    const totalVeh = items.length;
    const activeVeh = items.filter((v) => v.status === "ACTIVE").length;
    const cngVeh = items.filter((v) => String(v.fuelType).toUpperCase() === "CNG").length;
    const evVeh = items.filter((v) => String(v.fuelType).toUpperCase() === "EV").length;

    cards.push(
      { label: "TOTAL REGISTERED", value: String(totalVeh) },
      { label: "ACTIVE VEHICLES", value: String(activeVeh) },
      { label: "CNG VEHICLES", value: String(cngVeh) },
      { label: "EV VEHICLES", value: String(evVeh) }
    );
  } else if (reportType === "drivers") {
    const totalDrv = items.length;
    const activeDrv = items.filter((d) => d.status === "active").length;
    const suspendedDrv = items.filter((d) => d.status === "suspended").length;
    const avgRev = items.reduce((sum, d) => sum + (d.avgPerDay || 0), 0) / (totalDrv || 1);

    cards.push(
      { label: "TOTAL DRIVERS", value: String(totalDrv) },
      { label: "ACTIVE DRIVERS", value: String(activeDrv) },
      { label: "SUSPENDED DRIVERS", value: String(suspendedDrv) },
      { label: "AVG DAILY REVENUE", value: `NGN ${Math.round(avgRev).toLocaleString()}` }
    );
  } else if (reportType === "rewards") {
    const totalReq = items.length;
    const pendingReq = items.filter((r) => r.status === "PENDING_APPROVAL").length;
    const deliveredReq = items.filter((r) => r.status === "DELIVERED").length;
    const totalPts = items.reduce((sum, r) => sum + (r.pointsUsed || 0), 0);

    cards.push(
      { label: "TOTAL REDEMPTIONS", value: String(totalReq) },
      { label: "PENDING APPROVAL", value: String(pendingReq) },
      { label: "DELIVERED REWARDS", value: String(deliveredReq) },
      { label: "TOTAL POINTS USED", value: `${totalPts.toLocaleString()} PTS` }
    );
  }

  const cardWidth = 44.5;
  const cardHeight = 15;
  const cardSpacing = 4;
  const cardY = marginTop + 24;

  cards.forEach((card, index) => {
    const cardX = marginLeft + index * (cardWidth + cardSpacing);
    // Draw background
    doc.setFillColor(249, 250, 251); // Gray-50
    doc.setDrawColor(229, 231, 235); // Gray-200
    doc.setLineWidth(0.2);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1, 1, "FD");

    // Draw text label
    doc.setTextColor(107, 114, 128); // Gray-500
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.text(card.label, cardX + 3, cardY + 4.5);

    // Draw value
    doc.setTextColor(17, 24, 39); // Gray-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text(card.value, cardX + 3, cardY + 11);
  });

  // --- 3. DEFINE COLUMNS FOR DATA TABLE ---
  let columns: ColLayout[] = [];
  if (reportType === "daily-ops") {
    columns = [
      { header: "ID", width: 22, align: "left", getter: (s) => s.id },
      { header: "Vehicle", width: 22, align: "left", getter: (s) => s.vehicleId.toUpperCase() },
      { header: "Driver", width: 35, align: "left", getter: (s) => s.driver?.name || "Driver" },
      { header: "Duration", width: 26, align: "left", getter: (s) => s.hoursWorked !== null ? `${s.hoursWorked}h ${s.minutesWorked}m` : "Active" },
      { header: "Date", width: 25, align: "left", getter: (s) => new Date(s.startTime).toLocaleDateString() },
      { header: "Distance", width: 25, align: "right", getter: (s) => s.distanceCovered !== null ? `${Math.round(s.distanceCovered)} KM` : "—" },
      { header: "Revenue", width: 35, align: "right", getter: (s) => s.revenue ? "N" + Math.round(s.revenue).toLocaleString() : "N0" },
    ];
  } else if (reportType === "vehicles") {
    columns = [
      { header: "Vehicle ID", width: 30, align: "left", getter: (v) => v.id.toUpperCase() },
      { header: "Plate No.", width: 35, align: "left", getter: (v) => v.plateNumber },
      { header: "Type", width: 30, align: "left", getter: (v) => v.vehicleType },
      { header: "Fuel", width: 25, align: "left", getter: (v) => v.fuelType },
      { header: "Assigned Driver", width: 45, align: "left", getter: (v) => v.assignedDriver?.name || "None" },
      { header: "Status", width: 25, align: "right", getter: (v) => v.status },
    ];
  } else if (reportType === "drivers") {
    columns = [
      { header: "Driver Name", width: 35, align: "left", getter: (d) => d.name },
      { header: "Phone Number", width: 30, align: "left", getter: (d) => d.phone },
      { header: "Address", width: 40, align: "left", getter: (d) => d.address },
      { header: "Guarantor Name", width: 35, align: "left", getter: (d) => d.guarantorName },
      { header: "Status", width: 25, align: "right", getter: (d) => d.status },
      { header: "Avg/Day", width: 25, align: "right", getter: (d) => d.avgPerDay ? "N" + Math.round(d.avgPerDay).toLocaleString() : "N0" },
    ];
  } else if (reportType === "rewards") {
    columns = [
      { header: "Passenger", width: 40, align: "left", getter: (r) => r.passenger?.name || "Passenger" },
      { header: "Phone", width: 35, align: "left", getter: (r) => r.passenger?.phone || "—" },
      { header: "Reward Requested", width: 45, align: "left", getter: (r) => r.rewardRequested },
      { header: "Points", width: 20, align: "right", getter: (r) => String(r.pointsUsed) },
      { header: "Status", width: 25, align: "right", getter: (r) => r.status },
      { header: "Date", width: 25, align: "right", getter: (r) => new Date(r.requestedAt).toLocaleDateString() },
    ];
  }

  // --- 4. DRAW DATA TABLE ---
  const tableStartY = marginTop + 44;
  drawReportTable(doc, items, columns, tableStartY);

  // --- 5. SAVE PDF ---
  doc.save(filename);
}

function drawReportTable(
  doc: jsPDF,
  items: any[],
  columns: ColLayout[],
  startY: number
) {
  const pageHeight = 297;
  const marginBottom = 15;
  const rowHeight = 7.5;
  const marginLeft = 10;
  
  let currentY = startY;

  // Draw header row
  doc.setFillColor(17, 24, 39); // Dark slate
  doc.rect(marginLeft, currentY, 190, rowHeight, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  
  let currentX = marginLeft;
  columns.forEach((col) => {
    let textX = currentX + 2;
    if (col.align === "right") {
      textX = currentX + col.width - 2;
    } else if (col.align === "center") {
      textX = currentX + col.width / 2;
    }
    doc.text(col.header, textX, currentY + 5.0, { align: col.align });
    currentX += col.width;
  });

  currentY += rowHeight;

  // Draw rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  
  items.forEach((item, index) => {
    if (currentY + rowHeight > pageHeight - marginBottom) {
      doc.addPage();
      currentY = 15; // start near top of new page
      
      // Draw header row again
      doc.setFillColor(17, 24, 39);
      doc.rect(marginLeft, currentY, 190, rowHeight, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      currentX = marginLeft;
      columns.forEach((col) => {
        let textX = currentX + 2;
        if (col.align === "right") {
          textX = currentX + col.width - 2;
        } else if (col.align === "center") {
          textX = currentX + col.width / 2;
        }
        doc.text(col.header, textX, currentY + 5.0, { align: col.align });
        currentX += col.width;
      });
      
      currentY += rowHeight;
      doc.setFont("helvetica", "normal");
    }

    // Row background (zebra striping)
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251); // Gray-50
      doc.rect(marginLeft, currentY, 190, rowHeight, "F");
    }

    // Row bottom border line
    doc.setDrawColor(243, 244, 246); // Gray-100
    doc.setLineWidth(0.1);
    doc.line(marginLeft, currentY + rowHeight, marginLeft + 190, currentY + rowHeight);

    // Write text columns
    doc.setTextColor(55, 65, 81); // Gray-700
    currentX = marginLeft;
    columns.forEach((col) => {
      let textX = currentX + 2;
      if (col.align === "right") {
        textX = currentX + col.width - 2;
      } else if (col.align === "center") {
        textX = currentX + col.width / 2;
      }
      
      const rawText = col.getter(item) || "";
      // Smart substring truncate to avoid overlap in cells
      const maxCharLen = Math.floor(col.width / 1.7);
      const text = rawText.length > maxCharLen ? rawText.substring(0, maxCharLen - 3) + "..." : rawText;
      
      doc.text(text, textX, currentY + 4.8, { align: col.align });
      currentX += col.width;
    });

    currentY += rowHeight;
  });
}

