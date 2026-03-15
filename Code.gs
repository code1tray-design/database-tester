/**
 * COMTECH 4.0 — Level 2: Create & Incubate
 * Google Apps Script Backend Implementation
 * 
 * This script handles student verification and form submission for the ComTech system.
 * It provides a secure way to manage student data and business plan submissions.
 * 
 * @author ComTech Developer
 * @version 1.0.0
 */

// --- CONFIGURATION ---
const CONFIG = {
  SHEET_NAMES: {
    REGISTERED_STUDENTS: "RegisteredStudents",
    SUBMISSIONS: "Submissions",
    LOGS: "SystemLogs"
  },
  HEADERS: {
    SUBMISSIONS: [
      "Timestamp", "Name", "Roll", "Class", "Section", "Theme", "Business Idea", "AI Score",
      "Content & Research (/25)", "Innovation (/25)", "Financial (/25)", "Presentation (/25)",
      "Locations Visited", "Interviews Done", "Pain Point 1", "Pain Point 2", "Pain Point 3",
      "Problem Statement", "Target Segment", "SWOT Strengths", "SWOT Weaknesses", "SWOT Opportunities", "SWOT Threats",
      "UVP", "Solution", "Revenue Streams", "Unfair Advantage", "Key Metrics", "PESTLE",
      "Startup Costs", "Monthly Revenue", "Monthly Costs", "Year 1 Revenue", "Year 2 Revenue", "Year 3 Revenue", "Funding Model",
      "MVP Description", "MVP Tech", "Pilot Recruit", "Pilot Metrics", "Marketing Strategy", "Hashtags",
      "Mentor", "Mentor Feedback", "Elevator Pitch", "AI Feedback", "Device ID", "AI Detected", "AI Suspicion %",
      "Break-even Months", "Monthly Profit", "Gross Margin %", "ROI Year 1 %", "Growth Y1-Y2 %", "Growth Y2-Y3 %"
    ],
    REGISTERED_STUDENTS: ["Roll", "Name", "Section", "ThemeNum", "DeviceID"],
    LOGS: ["Timestamp", "Level", "Action", "Roll", "Message"]
  }
};

/**
 * Handle GET requests for student verification (login).
 * @param {GoogleAppsScript.Events.DoGet} e - The event object.
 * @returns {GoogleAppsScript.Content.TextOutput} The response output.
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const roll = (e.parameter.roll || "").trim().toUpperCase();
    const deviceId = (e.parameter.device || "").trim().toUpperCase();

    if (action === "login") {
      return handleLogin(roll, deviceId);
    }

    return createResponse("ERROR: INVALID_ACTION");
  } catch (error) {
    logError("doGet", "", error.toString());
    return createResponse("ERROR: SERVER_ERROR");
  }
}

/**
 * Handle POST requests for form submissions.
 * @param {GoogleAppsScript.Events.DoPost} e - The event object.
 * @returns {GoogleAppsScript.Content.TextOutput} The response output.
 */
function doPost(e) {
  try {
    // Log the entire event for debugging
    logAction("DEBUG_POST", "SYSTEM", JSON.stringify(e));

    const p = e.parameter;
    const roll = (p.roll || "").trim().toUpperCase();
    
    if (!roll) {
      logError("doPost", "MISSING_ROLL", "Parameters: " + JSON.stringify(p));
      return createResponse("ERROR: MISSING_ROLL");
    }

    return handleSubmission(p);
  } catch (error) {
    logError("doPost", "", error.toString());
    return createResponse("ERROR: SERVER_ERROR");
  }
}

// --- CORE HANDLERS ---

/**
 * Handle student login and verification.
 * @param {string} roll - Student roll number.
 * @param {string} deviceId - Device ID.
 */
function handleLogin(roll, deviceId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const studentSheet = getOrCreateSheet(ss, CONFIG.SHEET_NAMES.REGISTERED_STUDENTS, CONFIG.HEADERS.REGISTERED_STUDENTS);
  const submissionsSheet = getOrCreateSheet(ss, CONFIG.SHEET_NAMES.SUBMISSIONS, CONFIG.HEADERS.SUBMISSIONS);
  
  const studentData = findRowByValue(studentSheet, 0, roll); // Column 0 is Roll
  
  if (!studentData) {
    logAction("LOGIN", roll, "Roll number not found");
    return createResponse("NOT_FOUND");
  }

  // Check device conflict
  const registeredDeviceId = studentData[4]; // Column 4 is DeviceID
  if (registeredDeviceId && registeredDeviceId !== deviceId) {
    logAction("LOGIN", roll, "Device ID conflict: " + deviceId + " vs " + registeredDeviceId);
    return createResponse("DEVICE_CONFLICT");
  }

  // Update device ID if not already set
  if (!registeredDeviceId) {
    updateRowByValue(studentSheet, 0, roll, { 4: deviceId }); // Update column 4
    logAction("LOGIN", roll, "Device ID registered: " + deviceId);
  }

  // Check if already submitted
  const existingSubmission = findRowByValue(submissionsSheet, 2, roll); // Column 2 is Roll
  let response = {
    name: studentData[1],
    section: studentData[2],
    themeNum: studentData[3]
  };

  if (existingSubmission) {
    logAction("LOGIN", roll, "Student already submitted, returning data");
    return createResponse("ALREADY_SUBMITTED:" + JSON.stringify(response));
  }

  logAction("LOGIN", roll, "Student verified successfully");
  return createResponse(JSON.stringify(response));
}

/**
 * Handle form submission and save data.
 * @param {Object} p - Form parameters.
 */
function handleSubmission(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getOrCreateSheet(ss, CONFIG.SHEET_NAMES.SUBMISSIONS, CONFIG.HEADERS.SUBMISSIONS);
  const roll = p.roll.trim().toUpperCase();

  // Prepare data row
  const rowData = [
    p.timestamp || new Date().toLocaleString('en-IN'),
    p.name,
    roll,
    p.class,
    p.section,
    p.theme,
    p.biz_name,
    p.ai_score,
    p.sc_research,
    p.sc_innovation,
    p.sc_financial,
    p.sc_presentation,
    p.locations,
    p.interviews,
    p.pain1,
    p.pain2,
    p.pain3,
    p.problem_stmt,
    p.target_segment,
    p.swot_s,
    p.swot_w,
    p.swot_o,
    p.swot_t,
    p.uvp,
    p.solution,
    p.revenue_streams,
    p.advantage,
    p.metrics,
    p.pestle,
    p.startup_cost,
    p.monthly_revenue,
    p.monthly_costs,
    p.pl_yr1,
    p.pl_yr2,
    p.pl_yr3,
    p.funding_model,
    p.mvp_desc,
    p.mvp_tech,
    p.pilot_recruit,
    p.pilot_measure,
    p.mkt_social,
    p.mkt_hashtags,
    p.mentor_name,
    p.mentor_feedback,
    p.pitch_summary,
    p.ai_feedback,
    p.device_id,
    p.ai_detected,
    p.ai_suspicion_pct,
    p.break_even_months,
    p.monthly_profit,
    p.gross_margin_pct,
    p.roi_year1_pct,
    p.growth_y1_y2_pct,
    p.growth_y2_y3_pct
  ];

  // Upsert logic: If roll number exists, update row, otherwise append
  const existingRowIndex = findRowIndexByValue(sheet, 2, roll); // Column 2 is Roll
  
  if (existingRowIndex !== -1) {
    sheet.getRange(existingRowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
    logAction("SUBMISSION", roll, "Updated existing submission");
  } else {
    sheet.appendRow(rowData);
    logAction("SUBMISSION", roll, "New submission added");
  }

  return createResponse("OK");
}

// --- UTILITIES ---

/**
 * Get a sheet by name or create it with headers if it doesn't exist.
 */
function getOrCreateSheet(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
         .setBackground("#1a2e50")
         .setFontColor("#F5A623")
         .setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/**
 * Find a row index by a specific value in a column.
 * @returns {number} 0-based row index, or -1 if not found.
 */
function findRowIndexByValue(sheet, colIndex, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]).toUpperCase() === String(value).toUpperCase()) {
      return i;
    }
  }
  return -1;
}

/**
 * Find a row's data by a specific value in a column.
 */
function findRowByValue(sheet, colIndex, value) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]).toUpperCase() === String(value).toUpperCase()) {
      return data[i];
    }
  }
  return null;
}

/**
 * Update specific columns in a row found by a value.
 */
function updateRowByValue(sheet, colIndex, value, updates) {
  const rowIndex = findRowIndexByValue(sheet, colIndex, value);
  if (rowIndex !== -1) {
    for (const [cIdx, val] of Object.entries(updates)) {
      sheet.getRange(rowIndex + 1, parseInt(cIdx) + 1).setValue(val);
    }
    return true;
  }
  return false;
}

/**
 * Create a TextOutput response.
 */
function createResponse(content) {
  const output = ContentService.createTextOutput(content);
  // Explicitly set MIME type to TEXT to avoid browser sniffing issues
  output.setMimeType(ContentService.MimeType.TEXT);
  return output;
}

/**
 * Log a system action.
 */
function logAction(action, roll, message) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = getOrCreateSheet(ss, CONFIG.SHEET_NAMES.LOGS, CONFIG.HEADERS.LOGS);
  logSheet.appendRow([new Date().toLocaleString('en-IN'), "INFO", action, roll, message]);
}

/**
 * Log a system error.
 */
function logError(action, roll, message) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = getOrCreateSheet(ss, CONFIG.SHEET_NAMES.LOGS, CONFIG.HEADERS.LOGS);
  logSheet.appendRow([new Date().toLocaleString('en-IN'), "ERROR", action, roll, message]);
}

// --- UNIT TESTS / TEST RUNNER ---

/**
 * Run manual tests to verify functionality.
 * Note: These require a real Spreadsheet context to work fully.
 */
function runTests() {
  Logger.log("Starting tests...");
  
  // Test getOrCreateSheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const testSheet = getOrCreateSheet(ss, "TestSheet", ["Col1", "Col2"]);
  Logger.log("Sheet created/retrieved: " + testSheet.getName());
  
  // Test findRowIndexByValue (negative)
  const idx = findRowIndexByValue(testSheet, 0, "NON_EXISTENT");
  Logger.log("Search for non-existent: " + (idx === -1 ? "PASSED" : "FAILED"));
  
  // Add test data
  testSheet.appendRow(["TEST_ROLL", "TEST_NAME"]);
  const idx2 = findRowIndexByValue(testSheet, 0, "TEST_ROLL");
  Logger.log("Search for existing: " + (idx2 !== -1 ? "PASSED" : "FAILED"));
  
  // Cleanup test sheet
  // ss.deleteSheet(testSheet);
  
  Logger.log("Tests completed.");
}
