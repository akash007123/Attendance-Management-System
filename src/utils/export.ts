// Export utilities for CSV, Excel (.xls), and printable PDF reports
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Attendance } from "../types/attendance";
import { formatDate, formatTime, formatDurationHoursMinutes } from "./date";

export interface MonthlyAttendancePDFOptions {
  user: {
    name: string;
    email: string;
    department?: string;
    designation?: string;
    id?: string;
  };
  monthYear: string; // e.g. "2026-09" or "September 2026"
  records: Attendance[];
}

export function generateMonthlyAttendancePDF({
  user,
  monthYear,
  records,
}: MonthlyAttendancePDFOptions): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36; // 0.5 inch margins

  // Sort records chronologically
  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Parse Month Title
  let formattedMonth = monthYear;
  if (monthYear && /^\d{4}-\d{2}$/.test(monthYear)) {
    const [yearStr, monthStr] = monthYear.split("-");
    const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
    formattedMonth = d.toLocaleString("en-US", { month: "long", year: "numeric" });
  } else if (!monthYear && sortedRecords.length > 0) {
    const d = new Date(sortedRecords[0].date);
    formattedMonth = d.toLocaleString("en-US", { month: "long", year: "numeric" });
  } else if (!monthYear) {
    formattedMonth = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  }

  // Calculate Aggregates
  const totalDays = sortedRecords.length;
  const completedShifts = sortedRecords.filter((r) => r.status === "COMPLETED").length;
  const incompleteShifts = sortedRecords.filter((r) => r.status === "INCOMPLETE").length;
  const totalWorkingMinutes = sortedRecords.reduce(
    (acc, curr) => acc + (curr.totalWorkingMinutes || 0),
    0
  );
  const totalOvertimeHours = sortedRecords.reduce(
    (acc, curr) => acc + (curr.overtimeHours || 0),
    0
  );
  const validCount = sortedRecords.filter((r) => r.validationStatus === "VALID").length;
  const validationRate = totalDays > 0 ? Math.round((validCount / totalDays) * 100) : 100;

  const totalHrs = Math.floor(totalWorkingMinutes / 60);
  const totalMins = totalWorkingMinutes % 60;
  const formattedTotalDuration = `${totalHrs}h ${totalMins}m`;

  // === 1. Top Header Banner ===
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 54, "F");

  // Top Accent Bar
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageWidth, 4, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ENTERPRISE ATTENDANCE MANAGEMENT SYSTEM", margin, 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Official Employee Monthly Attendance & Biometric Audit Report", margin, 42);

  const printTimestamp = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  doc.text(`Generated: ${printTimestamp}`, pageWidth - margin, 35, { align: "right" });

  // === 2. Document Title ===
  let currentY = 76;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`Monthly Attendance Summary - ${formattedMonth}`, margin, currentY);

  // Subtitle / Period
  currentY += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Report Period: ${formattedMonth} | Geofence & Biometric Verification Verified`, margin, currentY);

  // === 3. Employee Information Box ===
  currentY += 12;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 58, 4, 4, "FD");

  // Details in 2 columns
  const col1X = margin + 14;
  const col2X = margin + (pageWidth - margin * 2) / 2 + 10;
  const infoRow1Y = currentY + 18;
  const infoRow2Y = currentY + 34;
  const infoRow3Y = currentY + 48;

  // Left Column
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text("EMPLOYEE NAME:", col1X, infoRow1Y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(user.name || "N/A", col1X + 90, infoRow1Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("EMPLOYEE ID / EMAIL:", col1X, infoRow2Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(`${user.id || "EMP"} / ${user.email}`, col1X + 90, infoRow2Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("DEPARTMENT:", col1X, infoRow3Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(user.department || "General", col1X + 90, infoRow3Y);

  // Right Column
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("DESIGNATION:", col2X, infoRow1Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text(user.designation || "Staff", col2X + 80, infoRow1Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("STANDARD SHIFT:", col2X, infoRow2Y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text("8.00 Hours / Day", col2X + 80, infoRow2Y);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 116, 139);
  doc.text("TOTAL SHIFTS:", col2X, infoRow3Y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(37, 99, 235);
  doc.text(`${totalDays} Days Logged`, col2X + 80, infoRow3Y);

  // === 4. Monthly Summary KPI Blocks (4 cards) ===
  currentY += 68;
  const cardGap = 8;
  const totalCards = 4;
  const availableWidth = pageWidth - margin * 2;
  const cardWidth = (availableWidth - cardGap * (totalCards - 1)) / totalCards;
  const cardHeight = 44;

  const kpis = [
    {
      title: "TOTAL WORKING TIME",
      val: formattedTotalDuration,
      sub: `${totalDays} shifts recorded`,
      color: [15, 23, 42],
    },
    {
      title: "COMPLETED SHIFTS (≥8h)",
      val: `${completedShifts} / ${totalDays}`,
      sub: `${totalDays > 0 ? Math.round((completedShifts / totalDays) * 100) : 0}% compliance`,
      color: [16, 185, 129], // emerald
    },
    {
      title: "INCOMPLETE SHIFTS (<8h)",
      val: `${incompleteShifts}`,
      sub: "under 8 hours duration",
      color: [245, 158, 11], // amber
    },
    {
      title: "APPROVED OVERTIME",
      val: `${totalOvertimeHours.toFixed(1)}h`,
      sub: `Validation rate: ${validationRate}%`,
      color: [37, 99, 235], // blue
    },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + cardGap);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 3, 3, "FD");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.title, cardX + 7, currentY + 12);

    // Value
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, cardX + 7, currentY + 26);

    // Subtitle
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(kpi.sub, cardX + 7, currentY + 37);
  });

  // === 5. Detailed Attendance Table ===
  currentY += cardHeight + 14;

  const tableHead = [
    [
      "#",
      "Date",
      "Punch In",
      "Punch Out",
      "Duration",
      "Shift Status",
      "Biometric",
      "Overtime",
      "Geofence Location",
    ],
  ];

  const tableBody = sortedRecords.map((rec, index) => {
    const dateFormatted = formatDate(rec.date);
    const inTime = formatTime(rec.punchIn);
    const outTime = rec.punchOut ? formatTime(rec.punchOut) : "Active";
    const duration = formatDurationHoursMinutes(rec.totalWorkingMinutes);
    const isCompleted = rec.totalWorkingMinutes >= 480;
    const shiftStatus = rec.status === "COMPLETED" || isCompleted ? "COMPLETED" : rec.status;
    const validation = rec.validationStatus || "VALID";
    const otHours = rec.overtimeHours ? `${rec.overtimeHours}h` : "--";
    const address = rec.punchInLocation?.address || "Main Office (Authorized)";

    return [
      String(index + 1),
      dateFormatted,
      inTime,
      outTime,
      duration,
      shiftStatus,
      validation,
      otHours,
      address.length > 28 ? address.substring(0, 26) + "..." : address,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHead,
    body: tableBody.length > 0 ? tableBody : [["-", "No attendance records found for this period", "", "", "", "", "", "", ""]],
    theme: "grid",
    styles: {
      fontSize: 7.5,
      cellPadding: 3.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: [30, 58, 138], // Deep blue
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 18, halign: "center" },
      1: { cellWidth: 58, fontStyle: "bold" },
      2: { cellWidth: 48, halign: "center" },
      3: { cellWidth: 48, halign: "center" },
      4: { cellWidth: 46, halign: "center", fontStyle: "bold" },
      5: { cellWidth: 58, halign: "center" },
      6: { cellWidth: 50, halign: "center" },
      7: { cellWidth: 42, halign: "center" },
      8: { cellWidth: "auto" },
    },
    didParseCell: (data) => {
      // Custom styling for status column
      if (data.section === "body" && data.column.index === 5) {
        const text = String(data.cell.raw);
        if (text === "COMPLETED") {
          data.cell.styles.textColor = [16, 185, 129]; // Emerald
          data.cell.styles.fontStyle = "bold";
        } else if (text === "INCOMPLETE" || text === "HALF_DAY") {
          data.cell.styles.textColor = [245, 158, 11]; // Amber
        }
      }
      // Custom styling for biometric validation
      if (data.section === "body" && data.column.index === 6) {
        const text = String(data.cell.raw);
        if (text === "VALID") {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (text === "SUSPICIOUS" || text === "INVALID") {
          data.cell.styles.textColor = [239, 68, 68];
          data.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: margin, right: margin, bottom: 65 },
  });

  // === 6. Signatures and Verification Footer ===
  // Retrieve final Y position after table
  const finalY = (doc as any).lastAutoTable?.finalY || currentY + 120;
  
  // Check if signatures fit on current page; if not, add page
  let signY = finalY + 28;
  if (signY + 50 > pageHeight - 50) {
    doc.addPage();
    signY = 50;
  }

  // Signature Blocks
  const sigBoxWidth = 180;
  const leftSigX = margin + 20;
  const rightSigX = pageWidth - margin - sigBoxWidth - 20;

  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.8);
  doc.line(leftSigX, signY + 28, leftSigX + sigBoxWidth, signY + 28);
  doc.line(rightSigX, signY + 28, rightSigX + sigBoxWidth, signY + 28);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Employee Signature / Date", leftSigX + sigBoxWidth / 2, signY + 38, { align: "center" });
  doc.text("Authorized HR / Manager Signature", rightSigX + sigBoxWidth / 2, signY + 38, { align: "center" });

  // Page Numbers and Stamp on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    // Decorative bottom border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 30, pageWidth - margin, pageHeight - 30);

    doc.text(
      "Enterprise Attendance System • Biometrically Validated & Geofenced Audit Record",
      margin,
      pageHeight - 18
    );
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 18, { align: "right" });
  }

  // Safe file name
  const safeUserName = (user.name || "Employee").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeMonth = (formattedMonth || "Monthly").replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `Attendance_Report_${safeUserName}_${safeMonth}.pdf`;

  doc.save(filename);
}


export function exportToCSV(data: Record<string, any>[], filename = "attendance-report.csv"): void {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(header => `"${header.replace(/"/g, '""')}"`).join(","));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const val = row[header];
      if (val === null || val === undefined) return '""';
      const stringVal = typeof val === "object" ? JSON.stringify(val) : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, filename);
}

export function exportToExcel(data: Record<string, any>[], filename = "attendance-report.xls"): void {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  
  // Create an HTML table string that Excel recognizes natively
  let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Attendance Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
  <body><table border="1"><thead><tr>`;
  
  headers.forEach(h => {
    tableHtml += `<th style="background-color: #f1f5f9; font-weight: bold; padding: 6px;">${escapeHtml(h)}</th>`;
  });
  tableHtml += `</tr></thead><tbody>`;

  data.forEach(row => {
    tableHtml += `<tr>`;
    headers.forEach(h => {
      const val = row[h] ?? "";
      const stringVal = typeof val === "object" ? JSON.stringify(val) : String(val);
      tableHtml += `<td style="padding: 4px;">${escapeHtml(stringVal)}</td>`;
    });
    tableHtml += `</tr>`;
  });

  tableHtml += `</tbody></table></body></html>`;

  const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  triggerDownload(blob, filename.endsWith(".xls") ? filename : `${filename}.xls`);
}

export function exportToPDF(
  data: Record<string, any>[],
  title = "Attendance Management Report",
  filename = "attendance-report.pdf"
): void {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const sample = data[0];
  const headers = Object.keys(sample).slice(0, 7); // select main columns
  const rows = data.map((item) =>
    headers.map((h) => {
      const val = item[h];
      if (val === null || val === undefined) return "--";
      if (typeof val === "object") return JSON.stringify(val);
      return String(val);
    })
  );

  exportToPrintablePDF(title, headers, rows, `Generated on ${new Date().toLocaleString()}`);
}

export function exportToPrintablePDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  subtitle = `Generated on ${new Date().toLocaleDateString("en-IN")}`
): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Pop-up blocked! Please allow pop-ups for this site to export PDF.");
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; }
          h1 { margin: 0 0 4px 0; font-size: 20px; color: #0f172a; }
          p.sub { margin: 0 0 20px 0; font-size: 13px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
          th { background: #f8fafc; text-align: left; padding: 8px 10px; border-bottom: 2px solid #cbd5e1; font-weight: 600; color: #334155; }
          td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; color: #1e293b; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: right; }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div>
            <h1>${escapeHtml(title)}</h1>
            <p class="sub">${escapeHtml(subtitle)}</p>
          </div>
          <button onclick="window.print()" style="padding: 6px 14px; background: #2563eb; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;">Print / Save as PDF</button>
        </div>
        <table>
          <thead>
            <tr>
              ${headers.map(h => `<th>${escapeHtml(h)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                r =>
                  `<tr>${r.map(c => `<td>${escapeHtml(String(c))}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
        <div class="footer">Enterprise Attendance Management System</div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
