// ============================================================
//  auth.js — MINDCLASH  |  Credentials + Google Sheets Logging
//
//  WHY IT WASN'T LOGGING BEFORE:
//  Using fetch with mode:"no-cors" + Content-Type:"application/json"
//  triggers a CORS preflight that browsers block silently.
//  Fix: send data via GET query params — no preflight needed,
//  Apps Script handles it with doGet(e), works every time.
//
//  Google Sheet columns written on every Sign In:
//    A: Timestamp  |  B: Name  |  C: Roll Number  |  D: Status
//
//  ── APPS SCRIPT CODE (paste this, then redeploy) ────────────
//
//    function doGet(e) {
//      try {
//        var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
//        sheet.appendRow([
//          e.parameter.timestamp,
//          e.parameter.name,
//          e.parameter.rollNumber,
//          e.parameter.status
//        ]);
//        return ContentService
//          .createTextOutput(JSON.stringify({ result: "success" }))
//          .setMimeType(ContentService.MimeType.JSON);
//      } catch(err) {
//        return ContentService
//          .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
//          .setMimeType(ContentService.MimeType.JSON);
//      }
//    }
//
//  Deploy settings:
//    Execute as  → Me
//    Who can access → Anyone
//  ⚠️  After changing the script, always click
//      "Deploy → Manage Deployments → ✏️ Edit → New Version → Deploy"
//      The URL stays the same but the code updates.
// ============================================================


// ============================================================
//  ⚠️  PASTE YOUR WEB APP URL HERE
// ============================================================
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzF41Fq9vgSqu60c4y9qarGYSNUdXL45FjZNN8mBqg6eK_rgWb14bNh3tL4oOhUYvBM/exec";
// e.g. "https://script.google.com/macros/s/AKfycbx.../exec"


// ============================================================
//  CREDENTIALS STORE
//  Add every valid { name, roll } pair below.
//  name  — must match exactly what the student types (case-insensitive)
//  roll  — must match exactly what the student types (case-insensitive)
// ============================================================
const USERS = [
  { name: "Rahul Sharma",   roll: "MC2024001" },
 //2025 bcom  hons acca  
  { name: "ADITYA SHARMA", roll: "2520992004" },
{ name: "AKSHDEEP", roll: "2520992006" },
{ name: "ALISHA", roll: "2520992007" },
{ name: "ANANTVIR KAUR", roll: "2520992009" },
{ name: "ANANYA VERMA", roll: "2520992010" },
{ name: "ANSH KAPILA", roll: "2520992013" },
{ name: "ANUPRIYA SHARMA", roll: "2520992015" },
{ name: "ARJUN RANA", roll: "2520992017" },
{ name: "ARMAANPREET KAUR", roll: "2520992018" },
{ name: "ARMANDEEP KAUR", roll: "2520992019" },
{ name: "ASHISH", roll: "2520992023" },
{ name: "ATHARV SHARMA", roll: "2520992024" },
{ name: "AVNEET KAUR", roll: "2520992026" },
{ name: "AVNEET KAUR", roll: "2520992027" },
{ name: "BALRAJ SANDHAY", roll: "2520992030" },
{ name: "BHARGAVI SHARDA", roll: "2520992032" },
{ name: "BIVASH BARMAN", roll: "2520992033" },
{ name: "BRAHMJOT SINGH", roll: "2520992034" },
{ name: "CHHAVI VOHRA", roll: "2520992035" },
{ name: "DEEPANSHU DAMANDEEP BAWA", roll: "2520992037" },
{ name: "DHIREN DHIMAN", roll: "2520992040" },
{ name: "DHRUV GUPTA", roll: "2520992041" },
{ name: "DHWANI", roll: "2520992042" },
{ name: "DIPANSHU", roll: "2520992043" },
{ name: "DIVANSH GARG", roll: "2520992044" },
{ name: "DIXI", roll: "2520992047" },
{ name: "EKAMJOT RANDHAWA", roll: "2520992048" },
{ name: "GAURAV", roll: "2520992051" },
{ name: "GAURAV BANSAL", roll: "2520992052" },
{ name: "GITANSH JINDAL", roll: "2520992054" },
{ name: "GUNIKA JINDAL", roll: "2520992056" },
{ name: "GURKANWAL SINGH", roll: "2520992057" },
{ name: "GURMEET KAUR", roll: "2520992058" },
{ name: "GURPREET KAUR", roll: "2520992059" },
{ name: "GURSUKHMAN SINGH", roll: "2520992060" },
{ name: "GURWINDER KAUR", roll: "2520992061" },
{ name: "HANSIK BARYAH", roll: "2520992062" },
{ name: "HARMAN PREET KAUR", roll: "2520992064" },
{ name: "HARMEET SINGH", roll: "2520992065" },
{ name: "HARNOOR KAUR", roll: "2520992066" },
{ name: "HARSHDEEP KAUR", roll: "2520992067" },
{ name: "HARSHDEEP SINGH", roll: "2520992068" },
{ name: "HARSHIT THAKUR", roll: "2520992069" },
{ name: "HARSHPREET KAUR", roll: "2520992071" },
{ name: "ISHPREET KAUR", roll: "2520992074" },
{ name: "JAPLEEN KAUR", roll: "2520992075" },
{ name: "JASHAN SHARMA", roll: "2520992077" },
{ name: "KARTIK DAWER", roll: "2520992082" },
{ name: "KARTIK MUNJAL", roll: "2520992083" },
{ name: "KESHAV GARG", roll: "2520992085" },
{ name: "KHUSHI KUMARI", roll: "2520992087" },
{ name: "KHUSHPREET KAUR", roll: "2520992088" },
{ name: "KISHREEN KAUR SIDANA", roll: "2520992089" },
{ name: "KRISH BANSAL", roll: "2520992090" },
{ name: "KRISHNA KUMAR", roll: "2520992091" },
{ name: "LOVEJYOT KAUR", roll: "2520992093" },
{ name: "MADHAV CHHABRA", roll: "2520992094" },
{ name: "MADHAV JINDAL", roll: "2520992095" },
{ name: "MANREET KAUR", roll: "2520992097" },
{ name: "MANSI", roll: "2520992098" },
{ name: "MANSIMAR KAUR", roll: "2520992099" },
{ name: "MANTHAN SINGLA", roll: "2520992100" },
{ name: "MANVEER KAUR", roll: "2520992101" },
// bcom acca m1
{ name: "ABNEET KAUR", roll: "2420992001" },
{ name: "ADITYA MADAAN", roll: "2420992002" },
{ name: "AMRITVIR SINGH", roll: "2420992006" },
{ name: "ARSHAAN KALIA", roll: "2420992010" },
{ name: "ARSHAAN SOOD", roll: "2420992011" },
{ name: "ARSHDEEP SINGH KANG", roll: "2420992012" },
{ name: "ARSHPREET KAUR", roll: "2420992014" },
{ name: "ARYAN", roll: "2420992015" },
{ name: "ARYAN BAJWAL", roll: "2420992016" },
{ name: "AVYA BHATIA", roll: "2420992017" },
{ name: "BHOOMI VERMA", roll: "2420992022" },
{ name: "CHARANPREET KAUR", roll: "2420992023" },
{ name: "DAXITA VERMA", roll: "2420992024" },
{ name: "DHRUV MALHOTRA", roll: "2420992026" },
{ name: "GARIMA", roll: "2420992028" },
{ name: "GAURAV GUPTA", roll: "2420992029" },
{ name: "GURKARAN KAUR", roll: "2420992033" },
{ name: "GURKIRAT SINGH", roll: "2420992034" },
{ name: "GURLEEN KAUR", roll: "2420992036" },
{ name: "GURMAT SINGH", roll: "2420992037" },
{ name: "GURSIMRAN KAUR", roll: "2420992038" },
{ name: "HARJOT SINGH", roll: "2420992039" },
{ name: "HARJOT SINGH", roll: "2420992040" },
{ name: "HARPREET KAUR", roll: "2420992041" },
{ name: "HIMANSHU JANGDA", roll: "2420992043" },
{ name: "HIMKESH BANSAL", roll: "2420992045" },
{ name: "JAPJIT KAUR GILL", roll: "2420992048" },
{ name: "JASHANDEEP SINGH", roll: "2420992049" },
{ name: "JASHANJOT SINGH", roll: "2420992050" },
{ name: "JASHANPREET KAUR", roll: "2420992051" },
{ name: "KANIKA PAHUJA", roll: "2420992052" },
{ name: "KARAN SACHDEVA", roll: "2420992053" },
{ name: "KASHISH KAPOOR", roll: "2420992054" },
{ name: "KIRANPREET KAUR", roll: "2420992055" },
{ name: "KRISH SINGLA", roll: "2420992056" },
{ name: "LOVISH GULATI", roll: "2420992059" },
{ name: "MAHIMA SAINI", roll: "2420992061" },
{ name: "MANNAT", roll: "2420992062" },
{ name: "MANVI CHOPRA", roll: "2420992063" },
{ name: "MEHAK", roll: "2420992064" },
{ name: "MEHAKDEEP KAUR", roll: "2420992065" },
{ name: "MISTY BAKSHI", roll: "2420992066" },
{ name: "NATASHA", roll: "2420992068" },
{ name: "NAVNEET KAUR", roll: "2420992069" },
{ name: "NAVNEET SINGH", roll: "2420992070" },
{ name: "PRABHLEEN KAUR BRAR", roll: "2420992075" },
{ name: "RAGHAV GUPTA", roll: "2420992078" },
{ name: "RAGHAV RANA", roll: "2420992079" },
{ name: "RAGHAV BANSAL", roll: "2420992080" },
{ name: "RIDHIMA RATHORE", roll: "2420992081" },
{ name: "RYTHM BHOLA", roll: "2420992083" },
{ name: "SARBJEET KAUR", roll: "2420992084" },
{ name: "SHEENA SINGLA", roll: "2420992087" },
{ name: "SHRUTI KUMARI", roll: "2420992090" },
{ name: "SIMRANDEEP KAUR", roll: "2420992092" },
{ name: "SIMRANPREET KAUR", roll: "2420992093" },
{ name: "SUKHMANI KAUR", roll: "2420992094" },
{ name: "SUMANPREET KAUR", roll: "2420992095" },
{ name: "SWAYAM VERMA", roll: "2420992096" },
{ name: "TANISHA", roll: "2420992097" },
{ name: "VAIBHAV CHHABRA", roll: "2420992099" },
{ name: "VAIBHAV GOYAL", roll: "2420992100" },
{ name: "VARUNDEEP SINGH", roll: "2420992101" },
{ name: "YASHAB ALI", roll: "2420992103" },
{ name: "ISHIKA DHAWAN", roll: "2420992104" },
{ name: "AANYA BATRA", roll: "2420992105" },
{ name: "EKAM DHAMMU", roll: "2420992108" },
{ name: "Suhana Aggarwal", roll: "2420992109" },
//bcom hon 2024 
{ name: "AKANSHA", roll: "2420991503" },
{ name: "ANMOL", roll: "2420991506" },
{ name: "ANMOLPREET SINGH", roll: "2420991507" },
{ name: "ANSH BHASIN", roll: "2420991508" },
{ name: "ANSHIKA SRIVASTAVA", roll: "2420991511" },
{ name: "ARYAN SIHAG", roll: "2420991514" },
{ name: "CHAHAT KATHURIA", roll: "2420991517" },
{ name: "CHESTHA", roll: "2420991518" },
{ name: "FARHA KHATUN", roll: "2420991524" },
{ name: "GARV BANSAL", roll: "2420991525" },
{ name: "GURMANPREET KAUR", roll: "2420991529" },
{ name: "JASKARAN SINGH", roll: "2420991534" },
{ name: "JASPINDER KAUR", roll: "2420991535" },
{ name: "JATIN BANSAL", roll: "2420991536" },
{ name: "JIYA GUJRAL", roll: "2420991537" },
{ name: "KAMALJEET KAUR", roll: "2420991538" },
{ name: "KANWERJIT SINGH SAINI", roll: "2420991539" },
{ name: "KHUSHPREET KAUR", roll: "2420991541" },
{ name: "KIRATPAL SINGH", roll: "2420991542" },
{ name: "LAKSHITA", roll: "2420991544" },
{ name: "MANDEEP SINGH", roll: "2420991547" },
{ name: "MOHIT SONI", roll: "2420991550" },
{ name: "MRIDUL SHARMA", roll: "2420991551" },
{ name: "PIYUSH", roll: "2420991555" },
{ name: "PULKIT KAMAL", roll: "2420991558" },
{ name: "RAMANPREET KAUR SEKHON", roll: "2420991560" },
{ name: "RIYA", roll: "2420991562" },
{ name: "SAHIL", roll: "2420991563" },
{ name: "SARGUNDEEP KAUR", roll: "2420991564" },
{ name: "SHIVAM DUA", roll: "2420991566" },
{ name: "SHIVAM VERMA", roll: "2420991568" },
{ name: "SHUBHKARAN DHAWAN", roll: "2420991569" },
{ name: "TANMAY JHINGON", roll: "2420991574" },
{ name: "VANSH RANA", roll: "2420991575" },
{ name: "VANSH WADHWA", roll: "2420991576" },
{ name: "VANSHIKA", roll: "2420991577" },
{ name: "KRRISH SAHNI", roll: "2420991579" },
{ name: "SIYA MAKKAR", roll: "2420991581" },
//2025 bcom hons acca m2
{ name: "MAYANK", roll: "2520992103" },
{ name: "MEHAKPREET KAUR", roll: "2520992104" },
{ name: "MEHUL MUNJAL", roll: "2520992105" },
{ name: "MOLLY VERMA", roll: "2520992107" },
{ name: "NAMAN SOOD", roll: "2520992108" },
{ name: "NAVNEET KAUR", roll: "2520992110" },
{ name: "NAVSHAGAN KAUR", roll: "2520992111" },
{ name: "NIDHIKA", roll: "2520992112" },
{ name: "NIRMIT SINGH", roll: "2520992113" },
{ name: "NIYAMAT KAUR", roll: "2520992115" },
{ name: "PAHUL PREET SINGH", roll: "2520992116" },
{ name: "PALAK", roll: "2520992117" },
{ name: "PARNEET KAUR", roll: "2520992118" },
{ name: "PARNEET KAUR", roll: "2520992119" },
{ name: "PAWANPREET KAUR", roll: "2520992122" },
{ name: "PRABHNOOR KAUR", roll: "2520992125" },
{ name: "PRABHPREET KAUR", roll: "2520992126" },
{ name: "PRACHI VERMA", roll: "2520992127" },
{ name: "PRATHAM", roll: "2520992128" },
{ name: "PRIYAL", roll: "2520992130" },
{ name: "PRIYANKA", roll: "2520992132" },
{ name: "PUSHKAR", roll: "2520992133" },
{ name: "RAJANDEEP SINGH", roll: "2520992134" },
{ name: "RAJVEER SINGH", roll: "2520992135" },
{ name: "RAMANDEEP SINGH", roll: "2520992138" },
{ name: "RAMNEET KAUR", roll: "2520992139" },
{ name: "RIYA", roll: "2520992143" },
{ name: "RONAK GOYAL", roll: "2520992144" },
{ name: "RUBALPREET KAUR", roll: "2520992145" },
{ name: "SAHIBPREET SINGH", roll: "2520992146" },
{ name: "SAMARJIT SINGH", roll: "2520992150" },
{ name: "SAMARTH ABROL", roll: "2520992151" },
{ name: "SATYAM", roll: "2520992155" },
{ name: "SAURAV SHEKHAR", roll: "2520992156" },
{ name: "SEHAJPREET KAUR", roll: "2520992157" },
{ name: "SHIVANSHU KUMAR GOUR", roll: "2520992158" },
{ name: "SHUBHANGI", roll: "2520992160" },
{ name: "SIMRAN", roll: "2520992161" },
{ name: "SIMRANJEET SINGH", roll: "2520992162" },
{ name: "SOHALPREET KAUR", roll: "2520992164" },
{ name: "SUHANI CHAWLA", roll: "2520992165" },
{ name: "SUHANI HANDA", roll: "2520992166" },
{ name: "SUKHMEEN KAUR", roll: "2520992168" },
{ name: "SUKHPREET KAUR", roll: "2520992169" },
{ name: "SWAYAM SHARMA", roll: "2520992173" },
{ name: "TAARAN BANTH", roll: "2520992174" },
{ name: "TAJESHWAR SINGH SOHI", roll: "2520992175" },
{ name: "TANISH MUTREJA", roll: "2520992176" },
{ name: "TANISHKA MUTREJA", roll: "2520992179" },
{ name: "TANISHQ SAINI", roll: "2520992180" },
{ name: "TARANPREET KAUR", roll: "2520992181" },
{ name: "TUSHAR MAKKAR", roll: "2520992183" },
{ name: "UMANGDEEP SINGH SABHARWAL", roll: "2520992184" },
{ name: "USTITDEEP SINGH", roll: "2520992185" },
{ name: "VAIBHAV SETHI", roll: "2520992187" },
{ name: "VANSH NAGI", roll: "2520992188" },
{ name: "VARUN BANSAL", roll: "2520992190" },
{ name: "VARUN CHADHA", roll: "2520992191" },
{ name: "VISHAVDEEP SINGH", roll: "2520992192" },
{ name: "WINKLE NIRMAAN", roll: "2520992193" },
{ name: "YASHIKA GARG", roll: "2520992195" },
{ name: "YASHITA BATRA", roll: "2520992196" },
{ name: "YUVRAJ SINGH", roll: "2520992197" },
{ name: "MOKSHA", roll: "2520992198" },
{ name: "JASNEET KAUR", roll: "2520992199" },
{ name: "HARMANNAT KHAIRA", roll: "2520992201" },
//bcom hons 2025 plain  m batch 
{ name: "DAVINDER SINGH", roll: "2520991509" },
{ name: "EKAMNOOR SINGH", roll: "2520991511" },
{ name: "GURJOT SINGH", roll: "2520991514" },
{ name: "GURKIRAT SINGH", roll: "2520991515" },
{ name: "GURKIRAT SINGH", roll: "2520991516" },
{ name: "GURKIRAT SINGH", roll: "2520991517" },
{ name: "GURLEEN KAUR", roll: "2520991518" },
{ name: "GURSHIRAT SINGH", roll: "2520991520" },
{ name: "HARSHITA", roll: "2520991525" },
{ name: "ISHITA", roll: "2520991528" },
{ name: "JAIVEER SINGH", roll: "2520991530" },
{ name: "JASKARAN SINGH RANDHAWA", roll: "2520991532" },
{ name: "JASMEET SINGH", roll: "2520991533" },
{ name: "JASMEET SINGH", roll: "2520991534" },
{ name: "KAWALJIT KAUR", roll: "2520991537" },
{ name: "KHUSHI GUJRAL", roll: "2520991538" },
{ name: "KOMALPREET KAUR", roll: "2520991540" },
{ name: "MANJOT SINGH", roll: "2520991544" },
{ name: "NISHU KASHYAP", roll: "2520991547" },
{ name: "PARTH BAJAJ", roll: "2520991548" },
{ name: "PRIYANSHU TANDON", roll: "2520991549" },
{ name: "SANCHIT", roll: "2520991554" },
{ name: "SEHAJ SINGH", roll: "2520991557" },
{ name: "SHERAFGHAN KHAN", roll: "2520991559" },
{ name: "SUMIT SHARMA", roll: "2520991561" },
{ name: "VANSH KANWAL SINGH", roll: "2520991566" },
{ name: "YASH KUMRA", roll: "2520991569" },
{ name: "YASHNOOR KAUR", roll: "2520991570" },
{ name: "SEHAJVEER SINGH", roll: "2520991572" },
{ name: "NAINA", roll: "2520991575" },
  // ── add more students below ──
  // { name: "Student Name", roll: "RollNumber" },
];


// ============================================================
//  GOOGLE SHEETS LOGGER  (GET-based — works without CORS issues)
// ============================================================
async function logToSheet({ name, rollNumber, status }) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.startsWith("YOUR_")) {
    console.warn("⚠️  MINDCLASH: Paste your Apps Script URL into APPS_SCRIPT_URL in auth.js");
    return;
  }

  // Build query string — GET params, no preflight, no CORS block
  const params = new URLSearchParams({
    timestamp:  new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    name:       name       || "—",
    rollNumber: rollNumber || "—",
    status:     status     || "—",
  });

  try {
    // Using an <img> tag trick as the most reliable no-CORS GET method
    // (fetch with no-cors on GET also works but swallows errors silently)
    const url = APPS_SCRIPT_URL + "?" + params.toString();

    await fetch(url, { method: "GET", mode: "no-cors" });
    console.log("✅ Logged to Sheet:", Object.fromEntries(params));
  } catch (err) {
    console.error("❌ Sheet log failed:", err);
  }
}


// ============================================================
//  VALIDATION  — checks name + roll number together
// ============================================================
function validateUser(name, rollNumber) {
  const match = USERS.find(
    u =>
      u.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      u.roll.trim().toLowerCase() === rollNumber.trim().toLowerCase()
  );
  if (match) return { success: true };
  return {
    success: false,
    message: "Name and roll number don't match our records. Please check and try again.",
  };
}


// ============================================================
//  SESSION HELPERS
// ============================================================
const SESSION_KEY = "mindclash_session";

function saveSession(name, rollNumber) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name, roll: rollNumber, ts: Date.now() }));
}
function getSession() {
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}


// ============================================================
//  MAIN LOGIN HANDLER  — called from index.html → onSignIn()
// ============================================================
async function handleLogin(name, rollNumber) {

  // 1. Validate
  const result = validateUser(name, rollNumber);

  // 2. Log to Sheet regardless of success/failure
  await logToSheet({
    name,
    rollNumber,
    status: result.success ? "✅ Success" : "❌ Failed",
  });

  // 3. Respond
  if (result.success) {
    saveSession(name, rollNumber);

    // Store identity for location_tester.html to use in denied-access logs
    sessionStorage.setItem('mindclash_pending', JSON.stringify({ name, roll: rollNumber }));

    // ⚠️  Redirect to location check first — it will forward to dashboard on success
    window.location.href = "location_tester.html";
    return { success: true };
  }

  return { success: false, message: result.message };
}


// Expose to global scope
window.MindClashAuth = { handleLogin, getSession, clearSession };
