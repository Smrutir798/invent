// Local development server for API
const http = require('http');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex > 0) {
        const key = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1);
        process.env[key] = value;
      }
    }
  });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1i5b3HHaWIBYj4aLXgPdhSTKDMqkGYoNuGiEDgzviRMs';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function getCredentials() {
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  throw new Error('GOOGLE_CREDENTIALS not set');
}

async function getSheets() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({ credentials, scopes: SCOPES });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

async function initializeSheets(sheets) {
  try {
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const existingSheets = spreadsheet.data.sheets.map(s => s.properties.title);
    
    const requiredSheets = [
      { name: 'Inventory', headers: ['ItemName', 'TotalQty', 'Balance', 'Rate', 'GST', 'GSTRate', 'PRate', 'S1', 'GSTAmount', 'SalesRate', 'Round', 'Total', 'Date', 'Time', 'EnteredBy'] },
      { name: 'Users', headers: ['Username', 'Password', 'Role', 'Name', 'CreatedAt'] },
      { name: 'Invoices', headers: ['InvoiceNo', 'Date', 'BuyerName', 'BuyerAddress', 'BuyerGSTIN', 'BuyerState', 'BuyerStateCode', 'Subtotal', 'GSTAmount', 'Total', 'Items', 'CreatedBy', 'CreatedAt'] }
    ];
    
    const sheetsToCreate = requiredSheets.filter(s => !existingSheets.includes(s.name));
    
    if (sheetsToCreate.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: sheetsToCreate.map(sheet => ({ addSheet: { properties: { title: sheet.name } } })) }
      });
      
      for (const sheet of sheetsToCreate) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheet.name}!A1:${String.fromCharCode(64 + sheet.headers.length)}1`,
          valueInputOption: 'RAW',
          requestBody: { values: [sheet.headers] }
        });
      }
    }
  } catch (error) {
    console.error('Error initializing sheets:', error.message);
  }
}

// API handlers
async function getInventory(sheets) {
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Inventory!A2:O' });
  const rows = response.data.values || [];
  return rows.map((row, index) => ({
    id: index + 2, itemName: row[0] || '', totalQty: row[1] || 0, balance: row[2] || 0, rate: row[3] || 0,
    gst: row[4] || 0, gstRate: row[5] || 0, pRate: row[6] || 0, s1: row[7] || 0, gstAmount: row[8] || 0,
    salesRate: row[9] || 0, round: row[10] || 0, total: row[11] || 0, date: row[12] || '', time: row[13] || '', enteredBy: row[14] || '',
  }));
}

async function addItem(sheets, item) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID, range: 'Inventory!A:O', valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[item.itemName || '', item.totalQty || 0, item.balance || 0, item.rate || 0, item.gst || 0,
      item.gstRate || 0, item.pRate || 0, item.s1 || '', item.gstAmount || 0, item.salesRate || 0,
      item.round || 0, item.total || 0, item.date || '', item.time || '', item.enteredBy || '']] }
  });
  return { success: true, message: 'Item added successfully' };
}

async function updateItem(sheets, rowIndex, item) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID, range: `Inventory!A${rowIndex}:O${rowIndex}`, valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[item.itemName || '', item.totalQty || 0, item.balance || 0, item.rate || 0, item.gst || 0,
      item.gstRate || 0, item.pRate || 0, item.s1 || '', item.gstAmount || 0, item.salesRate || 0,
      item.round || 0, item.total || 0, item.date || '', item.time || '', item.enteredBy || '']] }
  });
  return { success: true, message: 'Item updated successfully' };
}

async function deleteItem(sheets, rowIndex) {
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const inventorySheet = sheetMeta.data.sheets.find(s => s.properties.title === 'Inventory');
  if (!inventorySheet) throw new Error('Inventory sheet not found');
  
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ deleteDimension: { range: { sheetId: inventorySheet.properties.sheetId, dimension: 'ROWS', startIndex: parseInt(rowIndex) - 1, endIndex: parseInt(rowIndex) } } }] }
  });
  return { success: true, message: 'Item deleted successfully' };
}

async function getUsers(sheets) {
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Users!A2:E' });
  const rows = response.data.values || [];
  return rows.map((row, index) => ({ id: index + 2, username: row[0] || '', role: row[2] || 'employee', name: row[3] || '' }));
}

async function login(sheets, username, password) {
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Users!A2:D' });
  const rows = response.data.values || [];
  const user = rows.find(row => row[0] === username && row[1] === password);
  if (user) return { success: true, user: { username: user[0], role: user[2] || 'employee', name: user[3] || user[0] } };
  return { success: false, error: 'Invalid credentials' };
}

async function getInvoices(sheets) {
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Invoices!A2:M' });
  const rows = response.data.values || [];
  return rows.map((row, index) => {
    let items = []; try { items = JSON.parse(row[10] || '[]'); } catch (e) {}
    return { id: index + 2, invoiceNo: row[0] || '', date: row[1] || '', buyerName: row[2] || '', buyerAddress: row[3] || '',
      buyerGSTIN: row[4] || '', buyerState: row[5] || '', buyerStateCode: row[6] || '', subtotal: row[7] || 0,
      gstAmount: row[8] || 0, total: row[9] || 0, totalAmount: row[9] || 0, items, createdBy: row[11] || '', createdAt: row[12] || '' };
  });
}

async function addInvoice(sheets, invoice) {
  const itemsString = typeof invoice.items === 'string' ? invoice.items : JSON.stringify(invoice.items);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID, range: 'Invoices!A:M', valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[invoice.invoiceNo, invoice.date, invoice.buyerName, invoice.buyerAddress,
      invoice.buyerGSTIN || '', invoice.buyerState || '', invoice.buyerStateCode || '',
      invoice.subtotal, invoice.gstAmount, invoice.totalAmount || invoice.total, itemsString, invoice.createdBy, new Date().toISOString()]] }
  });
  return { success: true, message: 'Invoice added successfully' };
}

async function deleteInvoice(sheets, rowIndex) {
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const invoicesSheet = sheetMeta.data.sheets.find(s => s.properties.title === 'Invoices');
  if (!invoicesSheet) throw new Error('Invoices sheet not found');
  
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ deleteDimension: { range: { sheetId: invoicesSheet.properties.sheetId, dimension: 'ROWS', startIndex: parseInt(rowIndex) - 1, endIndex: parseInt(rowIndex) } } }] }
  });
  return { success: true, message: 'Invoice deleted successfully' };
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  
  const url = new URL(req.url, `http://localhost`);
  const action = url.searchParams.get('action');
  const rowIndex = url.searchParams.get('rowIndex');
  
  // Parse body
  let body = {};
  if (req.method === 'POST') {
    body = await new Promise(resolve => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
    });
  }
  
  try {
    const sheets = await getSheets();
    await initializeSheets(sheets);
    
    let result;
    switch (action) {
      case 'getInventory': result = await getInventory(sheets); break;
      case 'addItem': result = await addItem(sheets, body); break;
      case 'updateItem': result = await updateItem(sheets, rowIndex, body); break;
      case 'deleteItem': result = await deleteItem(sheets, rowIndex); break;
      case 'getUsers': result = await getUsers(sheets); break;
      case 'login': result = await login(sheets, body.username, body.password); break;
      case 'getInvoices': result = await getInvoices(sheets); break;
      case 'addInvoice': result = await addInvoice(sheets, body); break;
      case 'deleteInvoice': result = await deleteInvoice(sheets, rowIndex); break;
      case 'health': result = { status: 'ok' }; break;
      default: result = { error: 'Invalid action' };
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.message }));
  }
});

const PORT = 3001;
server.listen(PORT, () => console.log(`API server running at http://localhost:${PORT}`));
