import React from "react";

interface PrintableSlipsProps {
  codes: string[];
}

export function PrintableSlips({ codes }: PrintableSlipsProps) {
  // Helper to chunk codes into pages of exactly 50
  const pageSize = 50;
  const pages: string[][] = [];
  
  for (let i = 0; i < codes.length; i += pageSize) {
    const chunk = codes.slice(i, i + pageSize);
    // Pad the last page if it's not full
    while (chunk.length < pageSize) {
      chunk.push("RYD-XXXXXX");
    }
    pages.push(chunk);
  }

  // If no codes are provided, render at least one blank page
  if (pages.length === 0) {
    const blankPage = Array(50).fill("RYD-XXXXXX");
    pages.push(blankPage);
  }

  return (
    <div className="hidden print:block print-container">
      {/* Print Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          /* Hide everything else on page print */
          body > :not(.print-container) {
            display: none !important;
          }
          .print-container {
            display: block !important;
            width: 210mm;
          }
          .print-page {
            width: 210mm;
            height: 296mm; /* slightly less than 297mm to prevent blank extra pages */
            page-break-after: always;
            box-sizing: border-box;
            padding: 10mm;
            display: grid !important;
            grid-template-columns: repeat(5, 1fr) !important;
            grid-template-rows: repeat(10, 1fr) !important;
            gap: 2mm !important;
            background: white !important;
          }
          .print-page:last-child {
            page-break-after: avoid;
          }
        }
      `}} />

      {/* Pages */}
      {pages.map((pageCodes, pageIndex) => (
        <div key={pageIndex} className="print-page">
          {pageCodes.map((code, index) => (
            <div
              key={index}
              style={{
                border: "1px dashed #9CA3AF",
                padding: "8px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                alignItems: "center",
                textAlign: "center",
                boxSizing: "border-box",
                height: "100%",
                overflow: "hidden",
                backgroundColor: "white",
              }}
            >
              <div style={{ width: "100%" }}>
                <div style={{ fontWeight: 800, fontSize: "9px", color: "#15803D", letterSpacing: "-0.02em", lineHeight: "1" }}>
                  RYDEX MOBILITY
                </div>
                <div style={{ fontSize: "5px", color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "2px" }}>
                  Passenger Reward Slip
                </div>
              </div>

              <div style={{ margin: "4px 0", width: "100%", backgroundColor: "#F3F4F6", padding: "4px 0", borderRadius: "4px", border: "1px solid #E5E7EB" }}>
                <div style={{ fontSize: "4.5px", textTransform: "uppercase", fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.02em" }}>Reward Code</div>
                <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "10px", color: "#111827", letterSpacing: "0.05em" }}>
                  {code}
                </div>
              </div>

              <div style={{ width: "100%" }}>
                <div style={{ fontWeight: 700, fontSize: "5px", color: "#15803D" }}>www.rydexmobility.com</div>
                <div style={{ fontSize: "4px", color: "#9CA3AF", lineHeight: "1.2" }}>
                  Enter code to claim 10 points. Enjoy rewarding transit.
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
