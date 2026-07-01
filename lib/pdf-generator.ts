import { jsPDF } from "jspdf";

interface ColLayout {
  header: string;
  width: number;
  align: "left" | "right" | "center";
  getter: (item: any) => string;
}

export function generateReportPDF(
  reportType: "daily-ops" | "vehicles" | "drivers" | "contracts" | "maintenances",
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
  doc.setFillColor(15, 138, 95); // MUVA Green
  doc.rect(marginLeft, marginTop, 190, 1.5, "F");

  // Logo & Title Block
  doc.setTextColor(17, 24, 39); // Dark Slate
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MUVA Mobility SaaS", marginLeft, marginTop + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.text("Fleet Operations & Hire Purchase OS", marginLeft, marginTop + 11);

  // Right-aligned report details
  const reportTitles: Record<string, string> = {
    "daily-ops": "DAILY OPERATIONS REPORT",
    "vehicles": "VEHICLE FLEET LISTING",
    "drivers": "DRIVER ROSTER REGISTER",
    "contracts": "HIRE PURCHASE AGREEMENTS",
    "maintenances": "FLEET MAINTENANCE LEDGER",
  };
  const title = reportTitles[reportType] || "SaaS OPERATIONS REPORT";
  
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
    const expected = items.reduce((sum, s) => sum + (s.amountExpected || 0), 0);
    const shortfall = Math.max(0, expected - totalRev);

    cards.push(
      { label: "COLLECTED REMITTANCE", value: `₦${totalRev.toLocaleString()}` },
      { label: "EXPECTED REVENUE", value: `₦${expected.toLocaleString()}` },
      { label: "SHORTFALL BALANCE", value: `₦${shortfall.toLocaleString()}` },
      { label: "TOTAL DISPATCH SHIFTS", value: String(shiftsCount) }
    );
  } else if (reportType === "vehicles") {
    const totalVeh = items.length;
    const activeVeh = items.filter((v) => v.status === "ON_ROAD").length;
    const availVeh = items.filter((v) => v.status === "AVAILABLE").length;
    const maintVeh = items.filter((v) => v.status === "MAINTENANCE").length;

    cards.push(
      { label: "TOTAL REGISTERED", value: String(totalVeh) },
      { label: "ON ROAD UNITS", value: String(activeVeh) },
      { label: "AVAILABLE UNITS", value: String(availVeh) },
      { label: "IN WORKSHOP", value: String(maintVeh) }
    );
  } else if (reportType === "drivers") {
    const totalDrv = items.length;
    const activeDrv = items.filter((d) => d.status === "active").length;
    const suspendedDrv = items.filter((d) => d.status === "suspended").length;
    const inactiveDrv = totalDrv - activeDrv - suspendedDrv;

    cards.push(
      { label: "TOTAL DRIVERS", value: String(totalDrv) },
      { label: "ACTIVE DRIVERS", value: String(activeDrv) },
      { label: "SUSPENDED DRIVERS", value: String(suspendedDrv) },
      { label: "INACTIVE ROSTER", value: String(inactiveDrv) }
    );
  } else if (reportType === "contracts") {
    const activeCon = items.filter((c) => c.status === "ACTIVE").length;
    const settledCon = items.filter((c) => c.status === "COMPLETED").length;
    const totalPaid = items.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
    const outstanding = items.reduce((sum, c) => sum + (c.remainingBalance || 0), 0);

    cards.push(
      { label: "ACTIVE HP AGREEMENTS", value: String(activeCon) },
      { label: "SETTLED CONTRACTS", value: String(settledCon) },
      { label: "TOTAL PAID TO DATE", value: `₦${totalPaid.toLocaleString()}` },
      { label: "OUTSTANDING VALUE", value: `₦${outstanding.toLocaleString()}` }
    );
  } else if (reportType === "maintenances") {
    const totalJobs = items.length;
    const totalCost = items.reduce((sum, m) => sum + (m.cost || 0), 0);
    const avgCost = totalJobs > 0 ? Math.round(totalCost / totalJobs) : 0;

    cards.push(
      { label: "TOTAL REPAIR JOBS", value: String(totalJobs) },
      { label: "TOTAL SPENT (NGN)", value: `₦${totalCost.toLocaleString()}` },
      { label: "AVERAGE COST/JOB", value: `₦${avgCost.toLocaleString()}` },
      { label: "AUDITED UNITS", value: String(new Set(items.map(i => i.vehicleId)).size) }
    );
  }

  const cardWidth = 44.5;
  const cardHeight = 15;
  const cardSpacing = 4;
  const cardY = marginTop + 24;

  cards.forEach((card, index) => {
    const cardX = marginLeft + index * (cardWidth + cardSpacing);
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
      { header: "ID", width: 20, align: "left", getter: (s) => s.id },
      { header: "Vehicle ID", width: 22, align: "left", getter: (s) => s.vehicleId.toUpperCase() },
      { header: "Driver Name", width: 35, align: "left", getter: (s) => s.driver?.name || "Driver" },
      { header: "Duration", width: 25, align: "left", getter: (s) => s.hoursWorked !== null ? `${s.hoursWorked}h ${s.minutesWorked}m` : "Active" },
      { header: "Expected", width: 28, align: "right", getter: (s) => "₦" + Math.round(s.amountExpected || 0).toLocaleString() },
      { header: "Received", width: 28, align: "right", getter: (s) => "₦" + Math.round(s.amountReceived || 0).toLocaleString() },
      { header: "Shortfall", width: 32, align: "right", getter: (s) => "₦" + Math.round(s.outstandingBalance || 0).toLocaleString() },
    ];
  } else if (reportType === "vehicles") {
    columns = [
      { header: "Vehicle ID", width: 30, align: "left", getter: (v) => v.id.toUpperCase() },
      { header: "Plate Number", width: 35, align: "left", getter: (v) => v.plateNumber },
      { header: "Type", width: 35, align: "left", getter: (v) => v.vehicleType },
      { header: "Fuel Type", width: 25, align: "left", getter: (v) => v.fuelType },
      { header: "Assigned Driver", width: 40, align: "left", getter: (v) => v.assignedDriver?.name || "None" },
      { header: "Status", width: 25, align: "right", getter: (v) => v.status },
    ];
  } else if (reportType === "drivers") {
    columns = [
      { header: "Driver Name", width: 40, align: "left", getter: (d) => d.name },
      { header: "Phone Number", width: 35, align: "left", getter: (d) => d.phone },
      { header: "Address", width: 55, align: "left", getter: (d) => d.address },
      { header: "Guarantor Name", width: 35, align: "left", getter: (d) => d.guarantorName },
      { header: "Status", width: 25, align: "right", getter: (d) => d.status },
    ];
  } else if (reportType === "contracts") {
    columns = [
      { header: "Driver", width: 35, align: "left", getter: (c) => c.driver?.name || "Driver" },
      { header: "Vehicle ID", width: 25, align: "left", getter: (c) => c.vehicleId.toUpperCase() },
      { header: "Target Amount", width: 32, align: "right", getter: (c) => "₦" + Math.round(c.targetAmount || 0).toLocaleString() },
      { header: "Daily Target", width: 28, align: "right", getter: (c) => "₦" + Math.round(c.dailyTarget || 0).toLocaleString() },
      { header: "Total Paid", width: 28, align: "right", getter: (c) => "₦" + Math.round(c.totalPaid || 0).toLocaleString() },
      { header: "Outstanding", width: 22, align: "right", getter: (c) => "₦" + Math.round(c.remainingBalance || 0).toLocaleString() },
      { header: "Status", width: 20, align: "right", getter: (c) => c.status },
    ];
  } else if (reportType === "maintenances") {
    columns = [
      { header: "Vehicle ID", width: 30, align: "left", getter: (m) => m.vehicleId.toUpperCase() },
      { header: "Repair Category", width: 35, align: "left", getter: (m) => m.type.replace("_", " ") },
      { header: "Workshop Name", width: 40, align: "left", getter: (m) => m.workshop },
      { header: "Cost Expense", width: 30, align: "right", getter: (m) => "₦" + Math.round(m.cost || 0).toLocaleString() },
      { header: "Repair Date", width: 25, align: "right", getter: (m) => new Date(m.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) },
      { header: "Notes", width: 30, align: "left", getter: (m) => m.notes || "None" },
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
      const maxCharLen = Math.floor(col.width / 1.5);
      const text = rawText.length > maxCharLen ? rawText.substring(0, maxCharLen - 3) + "..." : rawText;
      
      doc.text(text, textX, currentY + 4.8, { align: col.align });
      currentX += col.width;
    });

    currentY += rowHeight;
  });
}
