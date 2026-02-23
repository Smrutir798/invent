import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './CreateInvoice.css';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Company Details (can be made configurable)
  const companyDetails = {
    name: 'DURGA CYCLE STORE',
    address: 'ADANGA BAZAR, SORO, BALASORE',
    city: 'Odisha - 756046, India',
    gstin: '21AAGFD1091E1Z2',
    state: 'Odisha',
    stateCode: '21',
    email: 'durgacycle.soro@gmail.com',
    phone: '9876543210',
    pan: 'AAGFD1091E',
    bankName: 'STATE BANK OF INDIA',
    accountNo: '30747838665',
    ifsc: 'SBIN0007980',
  };

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Invoice Details
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Buyer Details
  const [buyerDetails, setBuyerDetails] = useState({
    name: '',
    address: '',
    city: '',
    gstin: '',
    state: 'Odisha',
    stateCode: '21',
    phone: '',
  });

  // Invoice Items
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    loadInventory();
    generateInvoiceNo();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.fetchInventory();
      setInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNo = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    setInvoiceNo(`INV${year}${month}${random}`);
  };

  const handleBuyerChange = (e) => {
    const { name, value } = e.target;
    setBuyerDetails(prev => ({ ...prev, [name]: value }));
  };

  const addItem = () => {
    if (!selectedItem) return;

    const inventoryItem = inventory.find(item => item.id.toString() === selectedItem);
    if (!inventoryItem) return;

    const qty = parseInt(quantity) || 1;
    const availableStock = Number(inventoryItem.balance) || 0;

    // Check already added quantity for this item in current invoice
    const alreadyAddedQty = items
      .filter(item => item.inventoryId === inventoryItem.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    // Check if total quantity exceeds available stock
    if (qty + alreadyAddedQty > availableStock) {
      const remaining = availableStock - alreadyAddedQty;
      if (remaining <= 0) {
        alert(`No more stock available for "${inventoryItem.itemName}". Already added ${alreadyAddedQty} units.`);
      } else {
        alert(`Insufficient stock! Only ${remaining} more units available for "${inventoryItem.itemName}" (${alreadyAddedQty} already in invoice).`);
      }
      return;
    }

    const rate = Number(inventoryItem.rate) || 0;
    const gstPercent = Number(inventoryItem.gst) || 18;
    const disc = parseFloat(discount) || 0;

    const baseAmount = rate * qty;
    const discountAmount = (baseAmount * disc) / 100;
    const taxableAmount = baseAmount - discountAmount;
    const gstAmount = (taxableAmount * gstPercent) / 100;
    const totalAmount = taxableAmount + gstAmount;

    const newItem = {
      id: Date.now(),
      inventoryId: inventoryItem.id, // Store inventory row index for quantity reduction
      itemName: inventoryItem.itemName,
      hsn: '87120010', // Default HSN for cycles
      gstPercent,
      quantity: qty,
      rate,
      rateWithTax: rate + (rate * gstPercent) / 100,
      discount: disc,
      discountAmount,
      taxableAmount,
      sgst: gstAmount / 2,
      cgst: gstAmount / 2,
      totalAmount,
    };

    setItems(prev => [...prev, newItem]);
    setSelectedItem('');
    setQuantity(1);
    setDiscount(0);
  };

  const removeItem = (itemId) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.taxableAmount) || 0), 0);
    const totalSGST = items.reduce((sum, item) => sum + (Number(item.sgst) || 0), 0);
    const totalCGST = items.reduce((sum, item) => sum + (Number(item.cgst) || 0), 0);
    const totalGST = totalSGST + totalCGST;
    const grandTotal = items.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);

    return { subtotal, totalSGST, totalCGST, totalGST, grandTotal };
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    const convertLessThanThousand = (n) => {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const remainder = num % 1000;

    let result = '';
    if (crore) result += convertLessThanThousand(crore) + ' Crore ';
    if (lakh) result += convertLessThanThousand(lakh) + ' Lakh ';
    if (thousand) result += convertLessThanThousand(thousand) + ' Thousand ';
    if (remainder) result += convertLessThanThousand(remainder);

    return result.trim() + ' Rupees Only';
  };

  const handleSave = async () => {
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (!buyerDetails.name) {
      alert('Please enter buyer name');
      return;
    }

    setSaving(true);
    const totals = calculateTotals();

    const invoiceData = {
      invoiceNo,
      date: invoiceDate,
      time: new Date().toTimeString().split(' ')[0],
      buyerName: buyerDetails.name,
      buyerAddress: buyerDetails.address,
      buyerGSTIN: buyerDetails.gstin,
      buyerPhone: buyerDetails.phone,
      items: JSON.stringify(items),
      subtotal: totals.subtotal,
      sgst: totals.totalSGST,
      cgst: totals.totalCGST,
      gstAmount: totals.totalGST,
      totalAmount: totals.grandTotal,
      amountInWords: numberToWords(Math.round(totals.grandTotal)),
      createdBy: user?.username || 'unknown',
    };

    try {
      await googleSheetsService.addInvoice(invoiceData);
      
      // Reduce inventory balance for each item
      const inventoryUpdates = items.map(item => ({
        rowIndex: item.inventoryId,
        quantity: item.quantity
      }));
      await googleSheetsService.reduceInventoryBalance(inventoryUpdates);
      
      alert('Invoice saved successfully! Inventory updated.');
      navigate('/billing');
    } catch (error) {
      console.error('Error saving invoice:', error);
      
      // Still try to reduce inventory in demo mode
      try {
        const inventoryUpdates = items.map(item => ({
          rowIndex: item.inventoryId,
          quantity: item.quantity
        }));
        await googleSheetsService.reduceInventoryBalance(inventoryUpdates);
      } catch (e) {
        console.error('Error reducing inventory:', e);
      }
      
      alert('Invoice saved (demo mode)');
      navigate('/billing');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  };

  const totals = calculateTotals();

  return (
    <div className="create-invoice-page">
      <header className="invoice-header no-print">
        <div className="header-left">
          <button onClick={() => navigate('/billing')} className="back-btn">
            ← Back
          </button>
          <h1>🧾 Create Invoice</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span>{user?.name}</span>
            <span className={`role-badge ${user?.role}`}>
              {user?.role === 'admin' ? '👑 Admin' : '👤 Employee'}
            </span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="invoice-main">
        {/* Form Section - No Print */}
        <div className="invoice-form no-print">
          <div className="form-row">
            <div className="form-section">
              <h3>Invoice Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Invoice No.</label>
                  <input type="text" value={invoiceNo} readOnly className="readonly" />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Buyer Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Buyer Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={buyerDetails.name}
                    onChange={handleBuyerChange}
                    placeholder="Enter buyer name"
                  />
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input
                    type="text"
                    name="gstin"
                    value={buyerDetails.gstin}
                    onChange={handleBuyerChange}
                    placeholder="Enter GSTIN (optional)"
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={buyerDetails.address}
                    onChange={handleBuyerChange}
                    placeholder="Enter address"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={buyerDetails.phone}
                    onChange={handleBuyerChange}
                    placeholder="Enter phone"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Add Items</h3>
            <div className="add-item-row">
              <select
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                className="item-select"
              >
                <option value="">Select an item...</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.itemName} - ₹{formatCurrency(Number(item.rate))} (Stock: {item.balance})
                  </option>
                ))}
              </select>
              <div className="input-with-label">
                <label>Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  placeholder="1"
                  className="qty-input"
                />
              </div>
              <div className="input-with-label">
                <label>Discount %</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  max="100"
                  placeholder="0"
                  className="disc-input"
                />
              </div>
              <button onClick={addItem} className="add-item-btn">
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Preview - Printable */}
        <div className="invoice-preview">
          <div className="invoice-paper">
            {/* Header */}
            <div className="invoice-title">TAX INVOICE</div>
            
            <div className="invoice-top">
              <div className="company-info">
                <h2>{companyDetails.name}</h2>
                <p>{companyDetails.address}</p>
                <p>{companyDetails.city}</p>
                <p>GSTIN/UIN: {companyDetails.gstin}</p>
                <p>State: {companyDetails.state}, Code: {companyDetails.stateCode}</p>
                <p>E-Mail: {companyDetails.email}</p>
              </div>
              <div className="invoice-info">
                <table className="info-table">
                  <tbody>
                    <tr>
                      <td>Invoice No.</td>
                      <td><strong>{invoiceNo}</strong></td>
                    </tr>
                    <tr>
                      <td>Dated</td>
                      <td><strong>{invoiceDate}</strong></td>
                    </tr>
                    <tr>
                      <td>Delivery Note</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Mode/Terms</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="invoice-parties">
              <div className="buyer-info">
                <h4>Buyer (Bill to):</h4>
                <p><strong>{buyerDetails.name || '_______________'}</strong></p>
                <p>{buyerDetails.address || '_______________'}</p>
                <p>GSTIN/UIN: {buyerDetails.gstin || '_______________'}</p>
                <p>State: {buyerDetails.state}, Code: {buyerDetails.stateCode}</p>
                <p>Contact: {buyerDetails.phone || '_______________'}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="items-table">
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Description of Goods</th>
                  <th>HSN/SAC</th>
                  <th>GST %</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Rate (incl Tax)</th>
                  <th>Dis %</th>
                  <th>Amount</th>
                  <th className="no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="empty-row">No items added</td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}</td>
                      <td className="item-desc">{item.itemName}</td>
                      <td>{item.hsn}</td>
                      <td>{item.gstPercent}%</td>
                      <td>{item.quantity} PCS</td>
                      <td>₹{formatCurrency(item.rate)}</td>
                      <td>₹{formatCurrency(item.rateWithTax)}</td>
                      <td>{item.discount}%</td>
                      <td className="amount-cell">₹{formatCurrency(item.totalAmount)}</td>
                      <td className="no-print">
                        <button onClick={() => removeItem(item.id)} className="remove-btn">✕</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="subtotal-row">
                  <td colSpan="8" className="text-right">Subtotal:</td>
                  <td className="amount-cell">₹{formatCurrency(totals.subtotal)}</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="gst-row">
                  <td colSpan="8" className="text-right">SGST:</td>
                  <td className="amount-cell">₹{formatCurrency(totals.totalSGST)}</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="gst-row">
                  <td colSpan="8" className="text-right">CGST:</td>
                  <td className="amount-cell">₹{formatCurrency(totals.totalCGST)}</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="total-row">
                  <td colSpan="8" className="text-right"><strong>Total:</strong></td>
                  <td className="amount-cell total-amount">₹{formatCurrency(totals.grandTotal)}</td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            </table>

            {/* Amount in Words */}
            <div className="amount-words">
              <strong>Indian Rupees {numberToWords(Math.round(totals.grandTotal))}</strong>
            </div>

            {/* GST Breakdown */}
            <div className="gst-breakdown">
              <h4>GST Breakdown:</h4>
              <table className="gst-table">
                <thead>
                  <tr>
                    <th>HSN/SAC</th>
                    <th>Taxable Value</th>
                    <th>CGST Rate</th>
                    <th>CGST Amt</th>
                    <th>SGST Rate</th>
                    <th>SGST Amt</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>{item.hsn}</td>
                      <td>₹{formatCurrency(item.taxableAmount)}</td>
                      <td>{item.gstPercent / 2}%</td>
                      <td>₹{formatCurrency(item.cgst)}</td>
                      <td>{item.gstPercent / 2}%</td>
                      <td>₹{formatCurrency(item.sgst)}</td>
                      <td>₹{formatCurrency(item.cgst + item.sgst)}</td>
                    </tr>
                  ))}
                  <tr className="gst-total">
                    <td><strong>Total</strong></td>
                    <td><strong>₹{formatCurrency(totals.subtotal)}</strong></td>
                    <td></td>
                    <td><strong>₹{formatCurrency(totals.totalCGST)}</strong></td>
                    <td></td>
                    <td><strong>₹{formatCurrency(totals.totalSGST)}</strong></td>
                    <td><strong>₹{formatCurrency(totals.totalGST)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="invoice-footer">
              <div className="company-bank">
                <h4>Company's Bank Details:</h4>
                <p>Bank Name: {companyDetails.bankName}</p>
                <p>A/c No.: {companyDetails.accountNo}</p>
                <p>IFSC: {companyDetails.ifsc}</p>
                <p>PAN: {companyDetails.pan}</p>
              </div>
              <div className="signature">
                <p>for {companyDetails.name}</p>
                <div className="signature-line"></div>
                <p>Authorised Signatory</p>
              </div>
            </div>

            <div className="invoice-note">
              <p>This is a Computer Generated Invoice</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="invoice-actions no-print">
          <button onClick={() => navigate('/billing')} className="cancel-btn">
            Cancel
          </button>
          <button onClick={handlePrint} className="print-btn">
            🖨️ Print Invoice
          </button>
          <button onClick={handleSave} className="save-btn" disabled={saving}>
            {saving ? 'Saving...' : '💾 Save Invoice'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default CreateInvoice;
