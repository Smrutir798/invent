import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Customers.css';

const Returns = () => {
  const [returns, setReturns] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNo: '', date: new Date().toISOString().split('T')[0], customerName: '',
    items: [], totalRefund: 0, reason: '', type: 'return'
  });
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [returnData, invData, invoiceData] = await Promise.all([
        googleSheetsService.fetchReturns(),
        googleSheetsService.fetchInventory(),
        googleSheetsService.fetchInvoices()
      ]);
      setReturns(returnData);
      setInventory(invData);
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvoiceSelect = (invoiceNo) => {
    const invoice = invoices.find(i => i.invoiceNo === invoiceNo);
    if (invoice) {
      setSelectedInvoice(invoice);
      let items = [];
      try { items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || []; } catch(e) {}
      setFormData({
        ...formData,
        invoiceNo,
        customerName: invoice.buyerName,
        items: items.map(i => ({ ...i, returnQty: 0, selected: false }))
      });
    }
  };

  const toggleItemReturn = (index, returnQty) => {
    const newItems = [...formData.items];
    newItems[index].returnQty = parseInt(returnQty) || 0;
    newItems[index].selected = newItems[index].returnQty > 0;
    const totalRefund = newItems.reduce((sum, i) => sum + (i.selected ? (i.returnQty * (Number(i.rate) || 0)) : 0), 0);
    setFormData({ ...formData, items: newItems, totalRefund });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const returnItems = formData.items.filter(i => i.selected && i.returnQty > 0);
    if (returnItems.length === 0) { alert('Select items to return'); return; }

    try {
      const returnNo = `RET${Date.now().toString().slice(-6)}`;
      await googleSheetsService.addReturn({
        returnNo,
        ...formData,
        items: JSON.stringify(returnItems),
        createdBy: user?.username
      });

      // Increase inventory balance for returned items
      for (const item of returnItems) {
        const invItem = inventory.find(i => i.itemName === item.itemName);
        if (invItem) {
          await googleSheetsService.increaseInventoryBalance([{ rowIndex: invItem.id, quantity: item.returnQty }]);
        }
      }

      alert('Return processed! Inventory updated.');
      setShowAddModal(false);
      setFormData({ invoiceNo: '', date: new Date().toISOString().split('T')[0], customerName: '', items: [], totalRefund: 0, reason: '', type: 'return' });
      setSelectedInvoice(null);
      loadData();
    } catch (error) {
      alert('Error processing return');
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const handleLogout = () => { logout(); navigate('/login'); };

  const totalReturns = returns.reduce((sum, r) => sum + (Number(r.totalRefund) || 0), 0);

  return (
    <div className="returns-page">
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
          <h1>🔄 Returns & Exchanges</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="page-main">
        <div className="toolbar">
          <input type="text" placeholder="Search returns..." className="search-input" />
          <button onClick={() => setShowAddModal(true)} className="add-btn">➕ New Return</button>
        </div>

        {loading ? (
          <div className="loading">Loading returns...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Return No.</th>
                  <th>Date</th>
                  <th>Invoice No.</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Refund Amount</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {returns.length === 0 ? (
                  <tr><td colSpan="7" className="no-data">No returns recorded</td></tr>
                ) : (
                  returns.map((ret, idx) => {
                    let items = []; try { items = JSON.parse(ret.items || '[]'); } catch(e) {}
                    return (
                      <tr key={idx}>
                        <td className="name-cell">{ret.returnNo}</td>
                        <td>{ret.date}</td>
                        <td>{ret.invoiceNo}</td>
                        <td>{ret.customerName}</td>
                        <td>{items.length} items</td>
                        <td className="amount-cell negative">{formatCurrency(ret.totalRefund)}</td>
                        <td>{ret.reason || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{returns.length}</span>
            <span className="stat-label">Total Returns</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{color: '#dc3545'}}>{formatCurrency(totalReturns)}</span>
            <span className="stat-label">Total Refunded</span>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '700px'}}>
            <h2>Process Return</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Select Invoice</label>
                  <select value={formData.invoiceNo} onChange={e => handleInvoiceSelect(e.target.value)}>
                    <option value="">Select Invoice</option>
                    {invoices.map(inv => <option key={inv.invoiceNo} value={inv.invoiceNo}>{inv.invoiceNo} - {inv.buyerName}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Return Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="return">Return (Refund)</option>
                    <option value="exchange">Exchange</option>
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Reason</label>
                  <textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Reason for return..." />
                </div>
              </div>

              {formData.items.length > 0 && (
                <>
                  <h3 style={{marginTop: '1rem'}}>Select Items to Return</h3>
                  <table className="data-table" style={{marginBottom: '1rem'}}>
                    <thead><tr><th>Item</th><th>Sold Qty</th><th>Rate</th><th>Return Qty</th></tr></thead>
                    <tbody>
                      {formData.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.itemName}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.rate)}</td>
                          <td>
                            <input type="number" min="0" max={item.quantity} value={item.returnQty}
                              onChange={e => toggleItemReturn(idx, e.target.value)}
                              style={{width: '70px', padding: '0.3rem'}} />
                          </td>
                        </tr>
                      ))}
                      <tr style={{fontWeight: 'bold', background: '#f5f5f5'}}>
                        <td colSpan="3">Total Refund</td>
                        <td style={{color: '#dc3545'}}>{formatCurrency(formData.totalRefund)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Process Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Returns;
