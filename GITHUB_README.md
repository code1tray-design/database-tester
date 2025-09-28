# Gurmat Traders Document Portal

A responsive front-end website for Gurmat Traders that allows customers to search, view, and download their JFirms documents (bills/certificates) using their Aadhaar card number.

## Features

- Search for documents using Aadhaar card number
- View list of documents with dates
- Download documents directly
- Share documents via WhatsApp
- Copy document links to clipboard
- Filter documents by year and month
- Sort documents by date (ascending/descending)
- Responsive design for all devices

## Live Demo

[View Live Demo](https://your-github-username.github.io/gurmat-traders-portal)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-github-username/gurmat-traders-portal.git
cd gurmat-traders-portal
```

### 2. Google Sheets Setup

The website uses a Google Sheet as its database. The sheet should have the following columns:
- Aadhaar Number
- Document Date
- Document Link

Make sure your Google Sheet is published to the web as CSV:
1. Go to File > Share > Publish to web
2. Select "Comma-separated values (.csv)" as the format
3. Click "Publish"
4. Copy the link provided

### 3. Configure the Website

The Google Sheets URL is already configured in the `script.js` file. If you need to change it, update the `sheetUrl` variable in the `fetchDocumentsData` function.

### 4. Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Push your code to the repository
3. Go to Settings > Pages
4. Select the main branch as the source
5. Click Save

Your website will be available at `https://your-github-username.github.io/repository-name`

## Customization

- Update the logo in the `index.html` file
- Modify colors and styles in the `styles.css` file
- Add additional features in the `script.js` file

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please contact Gurmat Traders.