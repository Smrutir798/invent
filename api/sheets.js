// Vercel Serverless Function for Google Sheets API
const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1i5b3HHaWIBYj4aLXgPdhSTKDMqkGYoNuGiEDgzviRMs';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Parse credentials from environment variable
function getCredentials() {
  if (process.env.GOOGLE_CREDENTIALS) {
    return JSON.parse(process.env.GOOGLE_CREDENTIALS);
  }
  // Fallback for local development
  return require('../credentials.json');
}

// Get Google Sheets instance
async function getSheets() {
  const credentials = getCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

// Initialize sheets if they don't exist
async function initializeSheets(sheets) {
  try {
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
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
        requestBody: {
          requests: sheetsToCreate.map(sheet => ({
            addSheet: { properties: { title: sheet.name } }
          }))
        }
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

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).set(corsHeaders).end();
    return;
  }

  // Set CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  const { action } = req.query;
  
  try {
    const sheets = await getSheets();
    await initializeSheets(sheets);

    // Route based on action
    switch (action) {
      case 'getInventory':
        return await getInventory(sheets, res);
      case 'addItem':
        return await addItem(sheets, req.body, res);
      case 'updateItem':
        return await updateItem(sheets, req.query.rowIndex, req.body, res);
      case 'deleteItem':
        return await deleteItem(sheets, req.query.rowIndex, res);
      case 'getUsers':
        return await getUsers(sheets, res);
      case 'login':
        return await login(sheets, req.body, res);
      case 'getInvoices':
        return await getInvoices(sheets, res);
      case 'addInvoice':
        return await addInvoice(sheets, req.body, res);
      case 'deleteInvoice':
        return await deleteInvoice(sheets, req.query.rowIndex, res);
      case 'health':
        return res.json({ status: 'ok', message: 'API is running' });
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ==================== INVENTORY FUNCTIONS ====================

async function getInventory(sheets, res) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Inventory!A2:O',
  });

  const rows = response.data.values || [];
  const items = rows.map((row, index) => ({
    id: index + 2,
    itemName: row[0] || '',
    totalQty: row[1] || 0,
    balance: row[2] || 0,
    rate: row[3] || 0,
    gst: row[4] || 0,
    gstRate: row[5] || 0,
    pRate: row[6] || 0,
    s1: row[7] || 0,
    gstAmount: row[8] || 0,
    salesRate: row[9] || 0,
    round: row[10] || 0,
    total: row[11] || 0,
    date: row[12] || '',
    time: row[13] || '',
    enteredBy: row[14] || '',
  }));

  return res.json(items);
}

async function addItem(sheets, item, res) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Inventory!A:O',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        item.itemName, item.totalQty, item.balance, item.rate, item.gst,
        item.gstRate, item.pRate, item.s1, item.gstAmount, item.salesRate,
        item.round, item.total, item.date, item.time, item.enteredBy,
      ]],
    },
  });

  return res.json({ success: true, message: 'Item added successfully' });
}

async function updateItem(sheets, rowIndex, item, res) {
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Inventory!A${rowIndex}:O${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        item.itemName, item.totalQty, item.balance, item.rate, item.gst,
        item.gstRate, item.pRate, item.s1, item.gstAmount, item.salesRate,
        item.round, item.total, item.date, item.time, item.enteredBy,
      ]],
    },
  });

  return res.json({ success: true, message: 'Item updated successfully' });
}

async function deleteItem(sheets, rowIndex, res) {
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const inventorySheet = sheetMeta.data.sheets.find(s => s.properties.title === 'Inventory');
  
  if (!inventorySheet) {
    return res.status(404).json({ error: 'Inventory sheet not found' });
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: inventorySheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: parseInt(rowIndex) - 1,
            endIndex: parseInt(rowIndex),
          },
        },
      }],
    },
  });

  return res.json({ success: true, message: 'Item deleted successfully' });
}

// ==================== USER FUNCTIONS ====================

async function getUsers(sheets, res) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A2:E',
  });

  const rows = response.data.values || [];
  const users = rows.map((row, index) => ({
    id: index + 2,
    username: row[0] || '',
    role: row[2] || 'employee',
    name: row[3] || '',
  }));

  return res.json(users);
}

async function login(sheets, { username, password }, res) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users!A2:D',
  });

  const rows = response.data.values || [];
  
  for (const row of rows) {
    if (row[0] === username && row[1] === password) {
      return res.json({
        success: true,
        user: { username: row[0], role: row[2], name: row[3] },
      });
    }
  }

  return res.json({ success: false, error: 'Invalid credentials' });
}

// ==================== INVOICE FUNCTIONS ====================

async function getInvoices(sheets, res) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Invoices!A2:M',
  });

  const rows = response.data.values || [];
  const invoices = rows.map((row, index) => {
    let items = [];
    try { items = JSON.parse(row[10] || '[]'); } catch (e) { items = []; }

    return {
      id: index + 2,
      invoiceNo: row[0] || '',
      date: row[1] || '',
      buyerName: row[2] || '',
      buyerAddress: row[3] || '',
      buyerGSTIN: row[4] || '',
      buyerState: row[5] || '',
      buyerStateCode: row[6] || '',
      subtotal: row[7] || 0,
      gstAmount: row[8] || 0,
      total: row[9] || 0,
      totalAmount: row[9] || 0,
      items: items,
      createdBy: row[11] || '',
      createdAt: row[12] || '',
    };
  });

  return res.json(invoices);
}

async function addInvoice(sheets, invoice, res) {
  let itemsArray = invoice.items;
  if (typeof invoice.items === 'string') {
    try { itemsArray = JSON.parse(invoice.items); } catch (e) { itemsArray = []; }
  }
  
  const itemsString = typeof invoice.items === 'string' ? invoice.items : JSON.stringify(invoice.items);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Invoices!A:M',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        invoice.invoiceNo, invoice.date, invoice.buyerName, invoice.buyerAddress,
        invoice.buyerGSTIN || '', invoice.buyerState || '', invoice.buyerStateCode || '',
        invoice.subtotal, invoice.gstAmount, invoice.totalAmount || invoice.total,
        itemsString, invoice.createdBy, new Date().toISOString(),
      ]],
    },
  });

  // Update inventory balance
  if (itemsArray && itemsArray.length > 0) {
    await updateInventoryBalance(sheets, itemsArray);
  }

  return res.json({ success: true, message: 'Invoice added successfully' });
}

async function updateInventoryBalance(sheets, items) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Inventory!A2:C',
    });
    
    const rows = response.data.values || [];
    const updates = [];
    
    for (const item of items) {
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === item.itemName) {
          const currentBalance = Number(rows[i][2]) || 0;
          const newBalance = currentBalance - Number(item.quantity);
          updates.push({ range: `Inventory!C${i + 2}`, values: [[newBalance]] });
          break;
        }
      }
    }
    
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'USER_ENTERED', data: updates }
      });
    }
  } catch (error) {
    console.error('Error updating inventory balance:', error);
  }
}

async function deleteInvoice(sheets, rowIndex, res) {
  const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const invoicesSheet = sheetMeta.data.sheets.find(s => s.properties.title === 'Invoices');
  
  if (!invoicesSheet) {
    return res.status(404).json({ error: 'Invoices sheet not found' });
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: invoicesSheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: parseInt(rowIndex) - 1,
            endIndex: parseInt(rowIndex),
          },
        },
      }],
    },
  });

  return res.json({ success: true, message: 'Invoice deleted successfully' });
}
