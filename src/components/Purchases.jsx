import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Customers.css';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: '', supplierName: '', invoiceNo: '', date: new Date().toISOString().split('T')[0],
    items: [], totalAmount: 0, paidAmount: 0, notes: ''
  });
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [purchaseRate, setPurchaseRate] = useState(0);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchaseData, supplierData, inventoryData] = await Promise.all([
        googleSheetsService.fetchPurchases(),
        googleSheetsService.fetchSuppliers(),
        googleSheetsService.fetchInventory()
      ]);
      setPurchases(purchaseData);
      setSuppliers(supplierData);
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItemToPurchase = () => {
    if (!selectedItem || quantity <= 0) return;
    const item = inventory.find(i => i.id.toString() === selectedItem);
    if (!item) return;
    
    const newItem = {
      id: Date.now(),
      inventoryId: item.id,
      itemName: item.itemName,
      quantity: parseInt(quantity),
      purchaseRate: parseFloat(purchaseRate) || parseFloat(item.pRate) || 0,
      total: parseInt(quantity) * (parseFloat(purchaseRate) || parseFloat(item.pRate) || 0)
    };

    const newItems = [...formData.items, newItem];
    const totalAmount = newItems.reduce((sum, i) => sum + i.total, 0);
    setFormData({ ...formData, items: newItems, totalAmount });
    setSelectedItem('');
    setQuantity(1);
    setPurchaseRate(0);
  };

  const removeItem = (itemId) => {
    const newItems = formData.items.filter(i => i.id !== itemId);
    const totalAmount = newItems.reduce((sum, i) => sum + i.total, 0);
    setFormData({ ...formData, items: newItems, totalAmount });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    try {
      await googleSheetsService.addPurchase({
        ...formData,
        items: JSON.stringify(formData.items),
        createdBy: user?.username
      });
      
      // Update inventory balance for each item
      for (const item of formData.items) {
        await googleSheetsService.increaseInventoryBalance([{ rowIndex: item.inventoryId, quantity: item.quantity }]);
      }
      
      alert('Purchase recorded successfully!');
      setShowAddModal(false);
      setFormData({ supplierId: '', supplierName: '', invoiceNo: '', date: new Date().toISOString().split('T')[0], items: [], totalAmount: 0, paidAmount: 0, notes: '' });
      loadData();
    } catch (error) {
      alert('Error saving purchase');
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const handleLogout = () => { logout(); navigate('/login'); };

  const totalPurchases = purchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  const totalPaid = purchases.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  const totalDue = totalPurchases - totalPaid;

  return (
    <div className="purchases-page">
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
          <h1>📦 Purchase / Stock Entry</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="page-main">
        <div className="toolbar">
          <input type="text" placeholder="Search purchases..." className="search-input" />
          <button onClick={() => setShowAddModal(true)} className="add-btn">➕ New Purchase</button>
        </div>

        {loading ? (
          <div className="loading">Loading purchases...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice No.</th>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No purchases recorded</td></tr>
                ) : (
                  purchases.map((purchase, idx) => {
                    const due = (Number(purchase.totalAmount) || 0) - (Number(purchase.paidAmount) || 0);
                    let items = [];
                    try { items = JSON.parse(purchase.items || '[]'); } catch(e) {}
                    return (
                      <tr key={idx}>
                        <td>{purchase.date}</td>
                        <td>{purchase.invoiceNo}</td>
                        <td>{purchase.supplierName}</td>
                        <td>{items.length} items</td>
                        <td className="amount-cell">{formatCurrency(purchase.totalAmount)}</td>
                        <td className="amount-cell">{formatCurrency(purchase.paidAmount)}</td>
                        <td className="amount-cell negative">{formatCurrency(due)}</td>
                        <td>
                          <span className={`status-badge ${due <= 0 ? 'paid' : due < purchase.totalAmount ? 'partial' : 'unpaid'}`}>
                            {due <= 0 ? 'Paid' : due < purchase.totalAmount ? 'Partial' : 'Unpaid'}
                          </span>
                        </td>
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
            <span className="stat-value">{purchases.length}</span>
            <span className="stat-label">Total Purchases</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatCurrency(totalPurchases)}</span>
            <span className="stat-label">Total Amount</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatCurrency(totalPaid)}</span>
            <span className="stat-label">Paid Amount</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{color: '#dc3545'}}>{formatCurrency(totalDue)}</span>
            <span className="stat-label">Due Amount</span>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth: '800px'}}>
            <h2>New Purchase Entry</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Supplier</label>
                  <select value={formData.supplierId} onChange={e => {
                    const supplier = suppliers.find(s => s.id.toString() === e.target.value);
                    setFormData({...formData, supplierId: e.target.value, supplierName: supplier?.name || ''});
                  }}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Invoice No.</label>
                  <input type="text" value={formData.invoiceNo} onChange={e => setFormData({...formData, invoiceNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Paid Amount</label>
                  <input type="number" value={formData.paidAmount} onChange={e => setFormData({...formData, paidAmount: e.target.value})} />
                </div>
              </div>

              <h3 style={{marginTop: '1.5rem'}}>Add Items</h3>
              <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap'}}>
                <select value={selectedItem} onChange={e => setSelectedItem(e.target.value)} style={{flex: 2, padding: '0.5rem'}}>
                  <option value="">Select Item</option>
                  {inventory.map(item => <option key={item.id} value={item.id}>{item.itemName}</option>)}
                </select>
                <input type="number" placeholder="Qty" value={quantity} onChange={e => setQuantity(e.target.value)} min="1" style={{width: '80px', padding: '0.5rem'}} />
                <input type="number" placeholder="Rate" value={purchaseRate} onChange={e => setPurchaseRate(e.target.value)} style={{width: '100px', padding: '0.5rem'}} />
                <button type="button" onClick={addItemToPurchase} className="add-btn">Add</button>
              </div>

              {formData.items.length > 0 && (
                <table className="data-table" style={{marginBottom: '1rem'}}>
                  <thead>
                    <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th><th></th></tr>
                  </thead>
                  <tbody>
                    {formData.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.itemName}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.purchaseRate)}</td>
                        <td>{formatCurrency(item.total)}</td>
                        <td><button type="button" onClick={() => removeItem(item.id)} className="delete-btn">✕</button></td>
                      </tr>
                    ))}
                    <tr style={{fontWeight: 'bold', background: '#f5f5f5'}}>
                      <td colSpan="3">Total</td>
                      <td>{formatCurrency(formData.totalAmount)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              )}

              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Save Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Purchases;
