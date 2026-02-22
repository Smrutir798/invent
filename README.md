# 📦 Inventory Management System

A modern React-based inventory management system with Google Sheets integration for data storage and billing/invoice generation.

## Features

- **User Authentication**: Login system with Admin and Employee roles
- **Role-Based Access Control**:
  - **Admin**: Full access (view, add, edit, delete items, manage users, settings, reports)
  - **Employee**: Limited access (view, add items, and create invoices)
- **Inventory Management**: Add, edit, delete inventory items
- **Automatic GST Calculation**: Auto-calculates GST amounts and totals
- **Google Sheets Integration**: All data stored in Google Sheets
- **Billing & Invoicing**: Create GST-compliant invoices with print support
- **Reports & Analytics**: View inventory statistics and reports (Admin only)
- **Responsive Design**: Works on desktop and mobile devices

## Billing Features

- **GST-Compliant Invoices**: Generate invoices with SGST/CGST breakdown
- **Auto Invoice Numbering**: Sequential invoice numbers (INV-0001, INV-0002, etc.)
- **Buyer Details**: Capture buyer name, address, GSTIN, and state
- **Item Selection**: Select items from inventory with auto price fill
- **HSN Codes**: Support for HSN codes on invoice items
- **Amount in Words**: Automatic conversion of total to words
- **Print Support**: Print-ready invoice format
- **Invoice History**: View and manage all created invoices

## Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Employee | employee1 | emp123 |
| Employee | employee2 | emp456 |

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Account (for Google Sheets integration)

### Installation

1. **Navigate to the project folder**:
   ```bash
   cd inventory-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** and go to `http://localhost:5173`

## Google Sheets Setup (For Production Use)

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Rename it to "Inventory Management"

### Step 2: Create Required Sheets

Create three sheets within the spreadsheet:

#### Sheet 1: "Inventory" (with headers in Row 1)
```
Item Name | Total Qty | Balance | Rate | GST | GST Rate | P Rate | S1 | GST Amount | Sales Rate | Round | Total | Date | Time | Entered By
```

#### Sheet 2: "Users" (with headers in Row 1)
```
Username | Password | Role | Name
```

Add initial users:
```
admin    | admin123 | admin    | Administrator
employee1| emp123   | employee | Employee One
employee2| emp456   | employee | Employee Two
```

#### Sheet 3: "Invoices" (with headers in Row 1)
```
Invoice No | Date | Buyer Name | Buyer Address | Buyer GSTIN | Buyer State | State Code | Subtotal | GST Amount | Total | Items (JSON) | Created By | Created At
```

### Step 3: Add Google Apps Script

1. In your Google Sheet, go to **Extensions → Apps Script**
2. Delete any existing code
3. Copy and paste the code from `google-apps-script.js` file
4. Click **Save** (Ctrl+S)

### Step 4: Deploy as Web App

1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - Description: "Inventory API"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the **Web app URL**

### Step 5: Configure the App

1. Open the app and login as Admin
2. Go to **Settings**
3. Paste the Web app URL in the Google Apps Script URL field
4. Click **Save Settings**

## Role Permissions

### Admin
- View all inventory items
- Add new items
- Edit existing items
- Delete items
- Create and view invoices
- Delete invoices
- Manage users
- Access settings
- View reports & analytics

### Employee
- View all inventory items
- Add new items
- Create and view invoices

## Vercel Deployment

### Step 1: Push to GitHub

1. Create a GitHub repository
2. Push your code to GitHub

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and login with GitHub
2. Click **New Project**
3. Import your GitHub repository
4. Configure the project (Vercel auto-detects Vite)

### Step 3: Set Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

| Variable | Value |
|----------|-------|
| `GOOGLE_SPREADSHEET_ID` | Your Google Sheet ID (from URL) |
| `GOOGLE_CREDENTIALS` | Entire contents of `credentials.json` as a JSON string |

**To get Spreadsheet ID**: Open your Google Sheet, the ID is in the URL:
`https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`

**To format credentials**: Copy the entire contents of `credentials.json` and paste it as the value.

### Step 4: Redeploy

After adding environment variables, redeploy the project:
1. Go to Deployments tab
2. Click the three dots on the latest deployment
3. Click "Redeploy"

## Local Development

For local development, create a `.env` file with:
```
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_CREDENTIALS={"type":"service_account",...}
```

