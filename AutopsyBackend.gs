/**
 * THE AUTOPSY ROOM — COMTECH 4.0
 * Google Apps Script Backend Implementation
 * 
 * This script handles student autopsy report submissions and saves them to a Google Sheet.
 * It includes robust error handling, data logging, and cross-browser compatibility.
 * 
 * @author ComTech Developer
 * @version 2.0.0
 */

// --- CONFIGURATION ---
const AUTOPSY_CONFIG = {
  SHEET_NAME: "AutopsyReports",
  LOG_SHEET_NAME: "SystemLogs",
  HEADERS: [
    "Timestamp", "Name", "Roll", "Section", "Case Investigated", "Total Score",
    "SWOT Score", "PESTLE Score", "Financial Score", "Diagnosis Score", "Analyst Type",
    "Strengths", "Weaknesses", "Opportunities", "Threats", "PESTLE Factors",
    "PESTLE Explanation", "Fatal Number 1", "Fatal Number 2", "Fatal Number 3",
    "Financial Explanation", "Official Cause of Death", "Strategic Prescription", "Evaluator Feedback"
  ],
  LOG_HEADERS: ["Timestamp", "Level", "Roll", "Action", "Details"]
};

/**
 * Handle GET requests (verification).
 */
function doGet(e) {
  return createResponse("OK - AUTOPSY ROOM BACKEND ACTIVE");
}

/**
 * Handle POST requests (form submission).
 */
function doPost(e) {
  try {
    const p = e.parameter;
    const roll = (p.roll || "UNKNOWN").trim().toUpperCase();
    
    // Log the incoming request
    logAction("SUBMISSION_ATTEMPT", roll, "Received POST data");

    if (!p.roll || !p.name) {
      logError("SUBMISSION_FAILED", roll, "Missing critical identity fields");
      return createResponse("ERROR: MISSING_IDENTITY");
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = getOrCreateSheet(ss, AUTOPSY_CONFIG.SHEET_NAME, AUTOPSY_CONFIG.HEADERS);
    
    // Map form parameters to header columns
    const rowData = [
      p.timestamp || new Date().toLocaleString('en-IN'),
      p.name,
      roll,
      p.section,
      p.case,
      p.total_score,
      p.swot_score,
      p.pestle_score,
      p.fin_score,
      p.diag_score,
      p.analyst_type,
      p.swot_s,
      p.swot_w,
      p.swot_o,
      p.swot_t,
      p.pestle_factors,
      p.pestle_explain,
      p.fatal_num1,
      p.fatal_num2,
      p.fatal_num3,
      p.fin_explain,
      p.cause_of_death,
      p.prescription,
      p.feedback
    ];

    // Upsert logic: If roll number exists, append or update? 
    // Usually in forensics, we allow multiple investigations, but for ComTech we usually want one per student.
    // Let's implement an update if roll exists for the same case.
    const existingIndex = findSubmissionIndex(sheet, roll, p.case);
    
    if (existingIndex !== -1) {
      sheet.getRange(existingIndex + 1, 1, 1, rowData.length).setValues([rowData]);
      logAction("SUBMISSION_SUCCESS", roll, "Updated existing report for " + p.case);
    } else {
      sheet.appendRow(rowData);
      logAction("SUBMISSION_SUCCESS", roll, "Saved new report for " + p.case);
    }

    return createResponse("SUCCESS");
  } catch (error) {
    logError("CRITICAL_SERVER_ERROR", "SYSTEM", error.toString());
    return createResponse("ERROR: " + error.toString());
  }
}

// --- UTILITIES ---

/**
 * Find index of a submission for a specific roll and case.
 */
function findSubmissionIndex(sheet, roll, caseName) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    // Column 2 is Roll, Column 4 is Case Investigated (0-based: 2 and 4)
    if (String(data[i][2]).toUpperCase() === roll.toUpperCase() && String(data[i][4]) === caseName) {
      return i;
    }
  }
  return -1;
}

/**
 * Get or create sheet with headers and formatting.
 */
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground("#000000")
         .setFontColor("#f0e6d0")
         .setFontWeight("bold")
         .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Create a response for the frontend.
 */
function createResponse(content) {
  const output = ContentService.createTextOutput(content);
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}

/**
 * Log action to SystemLogs sheet.
 */
function logAction(action, roll, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = getOrCreateSheet(ss, AUTOPSY_CONFIG.LOG_SHEET_NAME, AUTOPSY_CONFIG.LOG_HEADERS);
  logSheet.appendRow([new Date().toLocaleString('en-IN'), "INFO", roll, action, details]);
}

/**
 * Log error to SystemLogs sheet.
 */
function logError(action, roll, details) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = getOrCreateSheet(ss, AUTOPSY_CONFIG.LOG_SHEET_NAME, AUTOPSY_CONFIG.LOG_HEADERS);
  logSheet.appendRow([new Date().toLocaleString('en-IN'), "ERROR", roll, action, details]);
}
