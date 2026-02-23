import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Customers.css';

const Quotations = () => {
  const [quotations, setQuotations] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '', customerName: '', date: new Date().toISOString().split('T')[0],
    validUntil: '', items: [], totalAmount: 0, notes: '', status: 'pending'
  });
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [quoteData, invData, custData] = await Promise.all([
        googleSheetsService.fetchQuotations(),
        googleSheetsService.fetchInventory(),
        googleSheetsService.fetchCustomers()
      ]);
      setQuotations(quoteData);
      setInventory(invData);
      setCustomers(custData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQuoteNo = () => {
    const date = new Date();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `QT${date.getFullYear().toString().slice(-2)}${(date.getMonth()+1).toString().padStart(2,'0')}${random}`;
  };

  const addItemToQuote = () => {
    if (!selectedItem) return;
    const item = inventory.find(i => i.id.toString() === selectedItem);
    if (!item) return;

    const rate = Number(item.rate) || 0;
    const gst = Number(item.gst) || 18;
    const qty = parseInt(quantity) || 1;
    const disc = parseFloat(discount) || 0;
    const baseAmount = rate * qty;
    const discAmount = (baseAmount * disc) / 100;
    const taxable = baseAmount - discAmount;
    const gstAmount = (taxable * gst) / 100;
    const total = taxable + gstAmount;

    const newItem = { id: Date.now(), itemName: item.itemName, quantity: qty, rate, discount: disc, gstPercent: gst, taxable, gstAmount, total };
    const newItems = [...formData.items, newItem];
    setFormData({ ...formData, items: newItems, totalAmount: newItems.reduce((s, i) => s + i.total, 0) });
    setSelectedItem(''); setQuantity(1); setDiscount(0);
  };

  const removeItem = (id) => {
    const newItems = formData.items.filter(i => i.id !== id);
    setFormData({ ...formData, items: newItems, totalAmount: newItems.reduce((s, i) => s + i.total, 0) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) { alert('Add at least one item'); return; }
    try {
      await googleSheetsService.addQuotation({
        quoteNo: generateQuoteNo(),
        ...formData,
        items: JSON.stringify(formData.items),
        createdBy: user?.username
      });
      alert('Quotation created!');
      setShowAddModal(false);
      setFormData({ customerId: '', customerName: '', date: new Date().toISOString().split('T')[0], validUntil: '', items: [], totalAmount: 0, notes: '', status: 'pending' });
      loadData();
    } catch (error) {
      alert('Error saving quotation');
    }
  };

  const convertToInvoice = async (quote) => {
    if (window.confirm('Convert this quotation to invoice?')) {
      navigate('/billing/create', { state: { fromQuote: quote } });
    }
  };

  const updateStatus = async (quote, status) => {
    try {
      await googleSheetsService.updateQuotation(quote.id, { ...quote, status });
      loadData();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="quotations-page">
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
          <h1>📋 Quotations</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="page-main">
        <div className="toolbar">
          <input type="text" placeholder="Search quotations..." className="search-input" />
          <button onClick={() => setShowAddModal(true)} className="add-btn">➕ New Quotation</button>
        </div>

        {loading ? (
          <div className="loading">Loading quotations...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quote No.</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Valid Until</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No quotations found</td></tr>
                ) : (
                  quotations.map((quote, idx) => {
                    let items = []; try { items = JSON.parse(quote.items || '[]'); } catch(e) {}
                    return (
                      <tr key={idx}>
                        <td className="name-cell">{quote.quoteNo}</td>
                        <td>{quote.date}</td>
                        <td>{quote.customerName}</td>
                        <td>{items.length} items</td>
                        <td className="amount-cell">{formatCurrency(quote.totalAmount)}</td>
                        <td>{quote.validUntil || '-'}</td>
                        <td><span className={`status-badge ${quote.status}`}>{quote.status}</span></td>
                        <td className="actions">
                          {quote.status === 'pending' && (
                            <>
                              <button onClick={() => convertToInvoice(quote)} className="view-btn" title="Convert to Invoice">📄</button>
                              <button onClick={() => updateStatus(quote, 'approved')} className="edit-btn" title="Approve">✓</button>
                              <button onClick={() => updateStatus(quote, 'rejected')} className="delete-btn" title="Reject">✕</button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '800px'}}>
            <h2>Create Quotation</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Customer</label>
                  <select value={formData.customerId} onChange={e => {
                    const cust = customers.find(c => c.id?.toString() === e.target.value);
                    setFormData({...formData, customerId: e.target.value, customerName: cust?.name || ''});
                  }}>
                    <option value="">Select Customer</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Valid Until</label>
                  <input type="date" value={formData.validUntil} onChange={e => setFormData({...formData, validUntil: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                </div>
              </div>

              <h3 style={{marginTop: '1.5rem'}}>Add Items</h3>
              <div style={{display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
                <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} style={{flex: 2, padding: '0.5rem'}}>
                  <option value="">Select Item</option>
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.itemName} - {formatCurrency(i.rate)}</option>)}
                </select>
                <input type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" style={{width: '70px', padding: '0.5rem'}} />
                <input type="number" placeholder="Disc %" value={discount} onChange={e => setDiscount(e.target.value)} style={{width: '70px', padding: '0.5rem'}} />
                <button type="button" onClick={addItemToQuote} className="add-btn">Add</button>
              </div>

              {formData.items.length > 0 && (
                <table className="data-table" style={{marginBottom: '1rem'}}>
                  <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Disc%</th><th>Total</th><th></th></tr></thead>
                  <tbody>
                    {formData.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.itemName}</td><td>{item.quantity}</td><td>{formatCurrency(item.rate)}</td>
                        <td>{item.discount}%</td><td>{formatCurrency(item.total)}</td>
                        <td><button type="button" onClick={() => removeItem(item.id)} className="delete-btn">✕</button></td>
                      </tr>
                    ))}
                    <tr style={{fontWeight: 'bold', background: '#f5f5f5'}}>
                      <td colSpan="4">Total</td><td>{formatCurrency(formData.totalAmount)}</td><td></td>
                    </tr>
                  </tbody>
                </table>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Create Quotation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotations;
