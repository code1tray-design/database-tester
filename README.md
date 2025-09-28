# Gurmat Traders Document Portal

A responsive front-end website that allows customers to search, view, and download their JFirms documents (bills/certificates) using their Aadhaar card number.

## Features

- **Search Functionality**: Users can search for their documents using their Aadhaar number
- **Results Display**: Shows a list of documents linked to the searched Aadhaar number
- **Document Actions**: Download, Share on WhatsApp, and Copy Link options for each document
- **Filtering & Sorting**: Filter documents by year and month, and sort by date
- **Responsive Design**: Mobile-friendly interface that works on all devices

## Setup Instructions

### 1. Google Sheets Setup

First, you need to set up your Google Sheet to store document information:

1. Create a new Google Sheet with the following columns:
   - Aadhaar Number
   - Document Date (in YYYY-MM-DD format)
   - Document Link (direct link to the PDF or image file in Google Drive)

2. Fill in your data with customer information and document links

3. Publish your sheet to the web:
   - Click on File > Share > Publish to web
   - Choose the sheet you want to publish
   - Select "Comma-separated values (.csv)" as the format
   - Click Publish
   - Copy the published URL

### 2. Google Sheets API Setup (Alternative Method)

Alternatively, you can use the Google Sheets API for more secure access:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Sheets API for your project
4. Create API credentials (API Key)
5. Set up appropriate API restrictions for security

### 3. Website Configuration

1. Open the `script.js` file
2. Locate the `fetchDocumentsData` function
3. Replace the placeholder URL with your actual Google Sheets published URL or API endpoint:

```javascript
// For published sheet as CSV:
const sheetUrl = 'YOUR_PUBLISHED_SHEET_URL';

// OR for Google Sheets API:
const sheetUrl = 'https://sheets.googleapis.com/v4/spreadsheets/YOUR_SPREADSHEET_ID/values/Sheet1?key=YOUR_API_KEY';
```

4. Update the `processSheetData` function to match your Google Sheet's structure

### 4. Hosting the Website

You can host this website on any web hosting service. Some options include:

- **GitHub Pages**: Free and easy to set up
- **Netlify**: Free tier available with simple deployment
- **Vercel**: Free tier available with simple deployment
- **Any traditional web hosting**: Upload the files via FTP

## Usage

1. Open the website in a web browser
2. Enter a 12-digit Aadhaar number in the search box
3. Click the "Search" button or press Enter
4. View the list of documents associated with the Aadhaar number
5. Use the filter options to narrow down results by year or month
6. Click the "Sort by Date" button to change the sorting order
7. For each document:
   - Click "Download" to download the document
   - Click "Share" to share the document link via WhatsApp
   - Click "Copy Link" to copy the document link to clipboard

## Customization

### Styling

You can customize the appearance of the website by modifying the `styles.css` file. The main color scheme is defined at the top of the file.

### Adding More Features

The codebase is structured to make it easy to add more features. Some ideas for enhancements:

- Add authentication for admin access
- Implement document preview functionality
- Add more sharing options (Email, SMS, etc.)
- Create an admin panel for managing documents

## Troubleshooting

### Common Issues

1. **No Data Showing**: Check your Google Sheet URL and make sure it's correctly set in the `script.js` file
2. **CORS Errors**: If using the Google Sheets API, ensure you've set up proper CORS settings
3. **API Key Issues**: Verify your API key is correct and has the necessary permissions

## License

This project is licensed for the exclusive use of Gurmat Traders.

## Support

For any questions or support, please contact the developer.