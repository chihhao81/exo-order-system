# ExoOrder System

A React.js based order and customer management system dedicated to efficiency and aesthetics.

## Features

- **Modern UI**: Glassmorphism design with responsive layout.
- **Order Management**: 
    - Dynamic product list with fuzzy search (via Google Apps Script API).
    - Automatic calculation of totals including shipping (7-11 / Black Cat).
    - One-click copy for order confirmation text.
- **Customer Management**: Streamlined customer creation form.
- **Integration**: Connects to Google Apps Script for backend data handling.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Run the local development server:

```bash
npm run dev
```

## Deployment

Build for production:

```bash
npm run build
```

This project generates static files in `dist/` which can be deployed to Vercel, Netlify, or GitHub Pages.

## Configuration

The API endpoint is configured in `src/api/client.js`. Ensure the Google Apps Script Web App is deployed with execution permission set to "Anyone".
