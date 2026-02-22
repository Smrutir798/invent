import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Settings.css';

const Settings = () => {
  const [scriptUrl, setScriptUrl] = useState('');
  const [saved, setSaved] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    // Load saved URL from localStorage
    const savedUrl = localStorage.getItem('googleScriptUrl') || '';
    setScriptUrl(savedUrl);
  }, []);

  const handleSave = () => {
    localStorage.setItem('googleScriptUrl', scriptUrl);
    googleSheetsService.setScriptUrl(scriptUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
          <h1>⚙️ Settings</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span>{user?.name}</span>
            <span className="role-badge admin">👑 Admin</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="settings-main">
        <div className="settings-section">
          <h2>Google Sheets Integration</h2>
          <p className="description">
            Connect your Google Sheets to store and retrieve inventory data. 
            You need to deploy a Google Apps Script as a web app and paste the URL below.
          </p>

          <div className="form-group">
            <label htmlFor="scriptUrl">Google Apps Script Web App URL</label>
            <input
              type="url"
              id="scriptUrl"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
            />
          </div>

          <button onClick={handleSave} className="save-btn">
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>

        <div className="settings-section">
          <h2>Setup Instructions</h2>
          <div className="setup-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Create a Google Sheet</h4>
                <p>Create a new Google Sheet with two sheets named "Inventory" and "Users"</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Set up Headers</h4>
                <p>Add these headers to the Inventory sheet:</p>
                <code>Item Name | Total Qty | Balance | Rate | GST | GST Rate | P Rate | S1 | GST Amount | Sales Rate | Round | Total | Date | Time | Entered By</code>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Add Google Apps Script</h4>
                <p>Go to Extensions → Apps Script and paste the provided script code</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Deploy as Web App</h4>
                <p>Click Deploy → New deployment → Web app. Set "Execute as" to yourself and "Who has access" to Anyone</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h4>Copy URL</h4>
                <p>Copy the Web app URL and paste it in the settings above</p>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h2>Google Apps Script Code</h2>
          <p className="description">Copy this code to your Google Apps Script:</p>
          <pre className="code-block">
{`// Google Apps Script for Inventory Management
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'getInventory') {
    return getInventory();
  } else if (action === 'getUsers') {
    return getUsers();
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  if (action === 'addItem') {
    return addItem(data.data);
  } else if (action === 'updateItem') {
    return updateItem(data.rowIndex, data.data);
  } else if (action === 'deleteItem') {
    return deleteItem(data.rowIndex);
  }
  
  return ContentService.createTextOutput(JSON.stringify({error: 'Invalid action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getInventory() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map((row, index) => {
    const obj = { id: index + 2 };
    headers.forEach((header, i) => {
      const key = header.replace(/\\s+/g, '').charAt(0).toLowerCase() + 
                  header.replace(/\\s+/g, '').slice(1);
      obj[key] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function addItem(itemData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
  const row = [
    itemData.itemName,
    itemData.totalQty,
    itemData.balance,
    itemData.rate,
    itemData.gst,
    itemData.gstRate,
    itemData.pRate,
    itemData.s1,
    itemData.gstAmount,
    itemData.salesRate,
    itemData.round,
    itemData.total,
    itemData.date,
    itemData.time,
    itemData.enteredBy
  ];
  sheet.appendRow(row);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function updateItem(rowIndex, itemData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
  const row = [
    itemData.itemName,
    itemData.totalQty,
    itemData.balance,
    itemData.rate,
    itemData.gst,
    itemData.gstRate,
    itemData.pRate,
    itemData.s1,
    itemData.gstAmount,
    itemData.salesRate,
    itemData.round,
    itemData.total,
    itemData.date,
    itemData.time,
    itemData.enteredBy
  ];
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function deleteItem(rowIndex) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
  sheet.deleteRow(rowIndex);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}

function getUsers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header.toLowerCase()] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}`}
          </pre>
        </div>
      </main>
    </div>
  );
};

export default Settings;
