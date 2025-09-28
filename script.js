// Global variables
let documentsData = [];
let sortDirection = 'desc'; // Default sort: newest first
let currentPage = 1;
let itemsPerPage = 5; // Default items per page
// Only using list view as per requirement
let viewMode = 'list';

// DOM Elements
const aadhaarInput = document.getElementById('aadhaar-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-msg');
const resultsSection = document.getElementById('results-section');
const resultsList = document.getElementById('results-list');
const noResults = document.getElementById('no-results');
const yearFilter = document.getElementById('year-filter');
const monthFilter = document.getElementById('month-filter');
const sortBtn = document.getElementById('sort-btn');
let paginationControls;
let viewToggle;

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Splash screen handling
    const splashScreen = document.getElementById('splash-screen');
    
    // Hide splash screen after animation completes
    setTimeout(() => {
        splashScreen.style.opacity = '0';
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    }, 3000); // 3 seconds for the complete animation sequence

    // Input validation for Aadhaar number (numbers only)
    aadhaarInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Search button click event
    searchBtn.addEventListener('click', handleSearch);

    // Enter key press in input field
    aadhaarInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Sort button click event
    sortBtn.addEventListener('click', () => {
        sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
        sortBtn.innerHTML = `<i class="fas fa-sort"></i> Sort by Date ${sortDirection === 'desc' ? '(Newest)' : '(Oldest)'}`;
        displayResults(documentsData);
    });

    // Filter change events
    yearFilter.addEventListener('change', applyFilters);
    monthFilter.addEventListener('change', applyFilters);
    
    // Initialize items per page selector
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page
            displayResults(documentsData);
        });
    }
});

// Handle search functionality
async function handleSearch() {
    const aadhaarNumber = aadhaarInput.value.trim();
    
    // Validate Aadhaar number (basic validation)
    if (!aadhaarNumber) {
        showError('Please enter an Aadhaar number');
        return;
    }
    
    if (aadhaarNumber.length !== 12) {
        showError('Aadhaar number must be 12 digits');
        return;
    }
    
    // Clear previous error
    clearError();
    
    try {
        // Show loading state
        searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
        searchBtn.disabled = true;
        
        // Fetch data from Google Sheets
        const data = await fetchDocumentsData(aadhaarNumber);
        
        // Process and display results
        if (data && data.length > 0) {
            documentsData = data;
            populateYearFilter(data);
            displayResults(data);
            resultsSection.style.display = 'block';
            noResults.style.display = 'none';
            resultsList.style.display = 'grid';
        } else {
            resultsSection.style.display = 'block';
            resultsList.style.display = 'none';
            noResults.style.display = 'block';
        }
    } catch (error) {
        showError('Error fetching data. Please try again later.');
        console.error('Error:', error);
    } finally {
        // Reset button state
        searchBtn.innerHTML = 'Search';
        searchBtn.disabled = false;
    }
}

// Fetch documents data from Google Sheets
async function fetchDocumentsData(aadhaarNumber) {
    // Use the provided Google Sheets CSV URL
    const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRufQMfGruBmHw1jNrXCAVkToNP4abWSc_xU5BukoNflRMJFKih87oaAZLZFlDAMR3IU2EoMAUufH6M/pub?gid=0&single=true&output=csv';
    
    try {
        const response = await fetch(sheetUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const csvText = await response.text();
        
        // Process the CSV data
        const documents = processCSVData(csvText, aadhaarNumber);
        
        return documents;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Process CSV data from Google Sheets
function processCSVData(csvText, aadhaarNumber) {
    // Parse CSV data
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
        return [];
    }
    
    // Get headers from the first row
    const headers = rows[0];
    
    // First try exact match for column names
    let aadhaarIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'adhar card number');
    let dateIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'date');
    let linkIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'link');
    let farmerNameIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'farmer name');
    let fatherNameIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'father name');
    let seasonIndex = headers.findIndex(header => 
        header.trim().toLowerCase() === 'season');
        
    // If exact match fails, try with includes as fallback
    if (aadhaarIndex === -1) {
        aadhaarIndex = headers.findIndex(header => 
            header.trim().toLowerCase().includes('adhar'));
        if (aadhaarIndex !== -1) {
            console.log('Found Aadhaar column using includes:', headers[aadhaarIndex]);
        }
    }
    
    if (dateIndex === -1) {
        dateIndex = headers.findIndex(header => 
            header.trim().toLowerCase().includes('date'));
    }
    
    if (linkIndex === -1) {
        linkIndex = headers.findIndex(header => 
            header.trim().toLowerCase().includes('link'));
    }
    
    if (farmerNameIndex === -1) {
        farmerNameIndex = headers.findIndex(header => 
            header.trim().toLowerCase().includes('farmer'));
    }
    
    if (fatherNameIndex === -1) {
        fatherNameIndex = headers.findIndex(header => 
            header.trim().toLowerCase().includes('father'));
    }
    
    if (seasonIndex === -1) {
        seasonIndex = headers.findIndex(header => 
            header.trim().toLowerCase().includes('season'));
    }
        
    // Debug: Print all headers to console
    console.log('All CSV headers:', headers);
    
    // Check if all required columns exist
    if (aadhaarIndex === -1 || dateIndex === -1 || linkIndex === -1) {
        console.error('CSV is missing required columns');
        console.error('Available headers:', headers);
        console.error('Aadhaar index:', aadhaarIndex);
        console.error('Date index:', dateIndex);
        console.error('Link index:', linkIndex);
        return [];
    }
    
    // Log for debugging
    console.log('Found columns - Aadhaar:', headers[aadhaarIndex], 'Date:', headers[dateIndex], 'Link:', headers[linkIndex]);
    
    // Process data rows and filter by Aadhaar number
    const documents = rows.slice(1)
        .filter(row => row.length >= Math.max(aadhaarIndex, dateIndex, linkIndex) + 1)
        .filter(row => {
            // Normalize Aadhaar numbers by removing spaces and comparing
            const rowAadhaar = row[aadhaarIndex].replace(/\s+/g, '').trim();
            const searchAadhaar = aadhaarNumber.replace(/\s+/g, '').trim();
            
            // Log for debugging
            console.log('Comparing:', rowAadhaar, 'with search term:', searchAadhaar, 'Match:', rowAadhaar === searchAadhaar);
            
            return rowAadhaar === searchAadhaar;
        })
        .map(row => {
            const document = {
                aadhaar: row[aadhaarIndex],
                date: formatDate(row[dateIndex]),
                link: row[linkIndex]
            };
            
            // Add optional fields if they exist
            if (farmerNameIndex !== -1 && row[farmerNameIndex]) {
                document.farmerName = row[farmerNameIndex];
            }
            
            if (fatherNameIndex !== -1 && row[fatherNameIndex]) {
                document.fatherName = row[fatherNameIndex];
            }
            
            if (seasonIndex !== -1 && row[seasonIndex]) {
                document.season = row[seasonIndex];
            }
            
            return document;
        });
    
    return documents;
}

// Parse CSV string into array of arrays
function parseCSV(csvText) {
    // Remove any BOM characters and normalize line endings
    csvText = csvText.replace(/^\ufeff/, '').replace(/\r\n?/g, '\n');
    
    const lines = csvText.split('\n');
    return lines.map(line => {
        // Handle quoted values with commas inside them
        const result = [];
        let startIndex = 0;
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                inQuotes = !inQuotes;
            } else if (line[i] === ',' && !inQuotes) {
                result.push(line.substring(startIndex, i).replace(/^"|"$/g, '').trim());
                startIndex = i + 1;
            }
        }
        
        // Add the last value
        result.push(line.substring(startIndex).replace(/^"|"$/g, '').trim());
        
        return result;
    }).filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
}

// Format date to ensure consistent YYYY-MM-DD format
function formatDate(dateStr) {
    // Try to parse the date string
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        // If invalid, try to parse common Indian date formats (DD/MM/YYYY or DD-MM-YYYY)
        const parts = dateStr.split(/[\/\-\.]/);
        if (parts.length === 3) {
            // Assume DD/MM/YYYY format
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JS
            const year = parseInt(parts[2], 10);
            
            const newDate = new Date(year, month, day);
            if (!isNaN(newDate.getTime())) {
                return newDate.toISOString().split('T')[0]; // YYYY-MM-DD
            }
        }
        return dateStr; // Return original if parsing fails
    }
    
    // Return formatted date
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Function to display search results
function displayResults(documents) {
    const resultsList = document.getElementById('results-list');
    const noResults = document.getElementById('no-results');
    const resultsSection = document.getElementById('results-section');
    const paginationControls = document.getElementById('pagination-controls');
    
    // Clear previous results
    resultsList.innerHTML = '';
    
    // Filter documents based on selected filters
    const filteredDocs = filterDocuments(documents);
    
    // Sort documents by date
    const sortedDocs = sortDocuments(filteredDocs);
    
    // Show no results message if needed
    if (sortedDocs.length === 0) {
        noResults.style.display = 'block';
        resultsList.style.display = 'none';
        paginationControls.style.display = 'none';
        return;
    } else {
        noResults.style.display = 'none';
        resultsList.style.display = 'flex'; // Always use list view
        paginationControls.style.display = 'flex';
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(sortedDocs.length / itemsPerPage);
    if (currentPage > totalPages) {
        currentPage = 1;
    }
    
    // Get current page items
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sortedDocs.length);
    const currentPageItems = sortedDocs.slice(startIndex, endIndex);
    
    // Create document list items (only using list view as per requirement)
    currentPageItems.forEach(doc => {
        const listItem = createDocumentListItem(doc);
        resultsList.appendChild(listItem);
    });
    
    // Update pagination controls
    updatePaginationControls(totalPages);
    
    // Show results section
    resultsSection.style.display = 'block';
    
    // Scroll to results section
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Create a document card for the results list
function createDocumentCard(doc) {
    const card = document.createElement('div');
    card.className = 'document-card';
    
    // Format date for display
    const dateObj = new Date(doc.date);
    const formattedDate = dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Add farmer name if available
    if (doc.farmerName) {
        const farmerInfo = document.createElement('div');
        farmerInfo.className = 'farmer-info';
        farmerInfo.innerHTML = `<strong>Farmer:</strong> ${doc.farmerName}`;
        card.appendChild(farmerInfo);
    }
    
    // Add father's name if available
    if (doc.fatherName) {
        const fatherInfo = document.createElement('div');
        fatherInfo.className = 'father-info';
        fatherInfo.innerHTML = `<strong>Father:</strong> ${doc.fatherName}`;
        card.appendChild(fatherInfo);
    }
    
    // Add season if available
    if (doc.season) {
        const seasonInfo = document.createElement('div');
        seasonInfo.className = 'season-info';
        seasonInfo.innerHTML = `<strong>Season:</strong> ${doc.season}`;
        card.appendChild(seasonInfo);
    }
    
    // Create actions container
    const actions = document.createElement('div');
    actions.className = 'document-actions';
    
    // Download button
    const downloadBtn = document.createElement('a');
    downloadBtn.className = 'action-btn download-btn';
    downloadBtn.href = doc.link;
    downloadBtn.target = '_blank';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download';
    
    // WhatsApp share button
    const whatsappBtn = document.createElement('a');
    whatsappBtn.className = 'action-btn whatsapp-btn';
    whatsappBtn.href = `https://wa.me/?text=Your%20document%20from%20Gurmat%20Traders:%20${encodeURIComponent(doc.link)}`;
    whatsappBtn.target = '_blank';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Share';
    
    // Copy link button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'action-btn copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Link';
    copyBtn.addEventListener('click', function() {
        copyToClipboard(doc.link);
    });
    
    actions.appendChild(downloadBtn);
    actions.appendChild(whatsappBtn);
    actions.appendChild(copyBtn);
    
    // Add date div
    const dateDiv = document.createElement('div');
    dateDiv.className = 'document-date';
    dateDiv.textContent = formattedDate;
    
    card.appendChild(dateDiv);
    card.appendChild(actions);
    
    return card;
}

// Copy link to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        // Show a temporary success message
        const btn = event.target.closest('.copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// Filter documents based on selected year and month
function filterDocuments(documents) {
    const selectedYear = yearFilter.value;
    const selectedMonth = monthFilter.value;
    
    return documents.filter(doc => {
        const docDate = new Date(doc.date);
        const docYear = docDate.getFullYear().toString();
        const docMonth = (docDate.getMonth() + 1).toString().padStart(2, '0');
        
        const yearMatch = selectedYear === 'all' || docYear === selectedYear;
        const monthMatch = selectedMonth === 'all' || docMonth === selectedMonth;
        
        return yearMatch && monthMatch;
    });
}

// Sort documents by date
function sortDocuments(documents) {
    return [...documents].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
}

// Populate year filter with available years from data
function populateYearFilter(documents) {
    // Clear previous options except 'All Years'
    yearFilter.innerHTML = '<option value="all">All Years</option>';
    
    // Get unique years from documents
    const years = [...new Set(documents.map(doc => {
        return new Date(doc.date).getFullYear();
    }))].sort((a, b) => b - a); // Sort years in descending order
    
    // Add year options
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year.toString();
        option.textContent = year.toString();
        yearFilter.appendChild(option);
    });
}

// Apply filters and update display
function applyFilters() {
    currentPage = 1; // Reset to first page when filters change
    displayResults(documentsData);
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// Clear error message
function clearError() {
    errorMessage.textContent = '';
    errorMessage.style.display = 'none';
}

// Create a document list item (compact view)
function createDocumentListItem(doc) {
    const listItem = document.createElement('div');
    listItem.className = 'document-list-item';
    
    // Create main info section
    const mainInfo = document.createElement('div');
    mainInfo.className = 'list-item-main';
    
    // Date element
    const dateElement = document.createElement('div');
    dateElement.className = 'list-item-date';
    dateElement.innerHTML = `<i class="far fa-calendar-alt"></i> ${formatDate(doc.date)}`;
    mainInfo.appendChild(dateElement);
    
    // Farmer info
    const infoElement = document.createElement('div');
    infoElement.className = 'list-item-info';
    
    let infoHTML = '';
    if (doc.farmerName) {
        infoHTML += `<span class="list-farmer"><strong>Farmer:</strong> ${doc.farmerName}</span>`;
    }
    if (doc.fatherName) {
        infoHTML += ` <span class="list-father"><strong>Father:</strong> ${doc.fatherName}</span>`;
    }
    if (doc.season) {
        infoHTML += ` <span class="list-season"><strong>Season:</strong> ${doc.season}</span>`;
    }
    
    infoElement.innerHTML = infoHTML;
    mainInfo.appendChild(infoElement);
    
    listItem.appendChild(mainInfo);
    
    // Create actions section
    const actionsSection = document.createElement('div');
    actionsSection.className = 'list-item-actions';
    
    // Download button
    const downloadBtn = document.createElement('a');
    downloadBtn.href = doc.link;
    downloadBtn.target = '_blank';
    downloadBtn.className = 'list-action-btn download-btn';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.title = 'Download';
    actionsSection.appendChild(downloadBtn);
    
    // WhatsApp share button
    const whatsappBtn = document.createElement('a');
    whatsappBtn.href = `https://wa.me/?text=View your document: ${encodeURIComponent(doc.link)}`;
    whatsappBtn.target = '_blank';
    whatsappBtn.className = 'list-action-btn whatsapp-btn';
    whatsappBtn.innerHTML = '<i class="fab fa-whatsapp"></i>';
    whatsappBtn.title = 'Share on WhatsApp';
    actionsSection.appendChild(whatsappBtn);
    
    // Copy link button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'list-action-btn copy-btn';
    copyBtn.innerHTML = '<i class="fas fa-link"></i>';
    copyBtn.title = 'Copy Link';
    copyBtn.addEventListener('click', () => copyToClipboard(doc.link));
    actionsSection.appendChild(copyBtn);
    
    listItem.appendChild(actionsSection);
    
    return listItem;
}

// Update pagination controls
function updatePaginationControls(totalPages) {
    const paginationControls = document.getElementById('pagination-controls');
    if (!paginationControls) return;
    
    paginationControls.innerHTML = '';
    
    // Create page info
    const pageInfo = document.createElement('div');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pageInfo.id = 'page-info';
    
    // Create previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn prev-btn';
    prevBtn.id = 'prev-page';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            displayResults(documentsData);
        }
    };
    
    // Create next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn next-btn';
    nextBtn.id = 'next-page';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayResults(documentsData);
        }
    };
    
    paginationControls.appendChild(prevBtn);
    paginationControls.appendChild(pageInfo);
    paginationControls.appendChild(nextBtn);
}

// No longer needed as we only use list view