import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './AddItem.css';

const AddItem = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const editItem = location.state?.item;
  const isEditing = !!editItem;

  const [formData, setFormData] = useState({
    itemName: '',
    totalQty: '',
    balance: '',
    rate: '',
    gst: '18',
    gstRate: '',
    pRate: '',
    s1: '',
    gstAmount: '',
    salesRate: '',
    round: '',
    total: '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editItem) {
      setFormData({
        itemName: editItem.itemName || '',
        totalQty: editItem.totalQty?.toString() || '',
        balance: editItem.balance?.toString() || '',
        rate: editItem.rate?.toString() || '',
        gst: editItem.gst?.toString() || '18',
        gstRate: editItem.gstRate?.toString() || '',
        pRate: editItem.pRate?.toString() || '',
        s1: editItem.s1 || '',
        gstAmount: editItem.gstAmount?.toString() || '',
        salesRate: editItem.salesRate?.toString() || '',
        round: editItem.round?.toString() || '',
        total: editItem.total?.toString() || '',
      });
    }
  }, [editItem]);

  // Auto-calculate GST and totals when rate or GST percentage changes
  useEffect(() => {
    calculateTotals();
  }, [formData.rate, formData.gst, formData.balance]);

  const calculateTotals = () => {
    const rate = parseFloat(formData.rate) || 0;
    const gstPercent = parseFloat(formData.gst) || 0;
    const quantity = parseFloat(formData.balance) || 1;

    if (rate > 0) {
      const calculated = googleSheetsService.calculateGST(rate, gstPercent, quantity);
      setFormData(prev => ({
        ...prev,
        gstRate: calculated.gstAmount.toString(),
        gstAmount: calculated.gstAmount.toString(),
        salesRate: calculated.salesRate.toString(),
        round: calculated.round.toString(),
        total: calculated.total.toString(),
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
    }
    if (!formData.totalQty || parseFloat(formData.totalQty) <= 0) {
      newErrors.totalQty = 'Total quantity must be greater than 0';
    }
    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      newErrors.rate = 'Rate must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const now = new Date();
      const itemData = {
        ...formData,
        totalQty: parseFloat(formData.totalQty),
        balance: parseFloat(formData.balance) || parseFloat(formData.totalQty),
        rate: parseFloat(formData.rate),
        gst: parseFloat(formData.gst),
        gstRate: parseFloat(formData.gstRate),
        pRate: parseFloat(formData.pRate) || parseFloat(formData.rate),
        gstAmount: parseFloat(formData.gstAmount),
        salesRate: parseFloat(formData.salesRate),
        round: parseFloat(formData.round),
        total: parseFloat(formData.total),
        date: now.toISOString().split('T')[0],
        time: now.toTimeString().split(' ')[0],
        enteredBy: user?.username || 'unknown',
      };

      if (isEditing) {
        await googleSheetsService.updateItem(editItem.id, itemData);
        alert('Item updated successfully!');
      } else {
        await googleSheetsService.addItem(itemData);
        alert('Item added successfully!');
      }
      navigate('/inventory');
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check permission for editing
  if (isEditing && !isAdmin()) {
    return (
      <div className="add-item-page">
        <header className="add-item-header">
          <div className="header-left">
            <button onClick={() => navigate('/inventory')} className="back-btn">
              ← Back
            </button>
            <h1>Access Denied</h1>
          </div>
        </header>
        <main className="add-item-main">
          <div className="access-denied">
            <h2>⚠️ Permission Denied</h2>
            <p>Only administrators can edit inventory items.</p>
            <button onClick={() => navigate('/inventory')}>Go Back to Inventory</button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="add-item-page">
      <header className="add-item-header">
        <div className="header-left">
          <button onClick={() => navigate('/inventory')} className="back-btn">
            ← Back
          </button>
          <h1>{isEditing ? '✏️ Edit Item' : '➕ Add New Item'}</h1>
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

      <main className="add-item-main">
        <form onSubmit={handleSubmit} className="item-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="itemName">Item Name *</label>
                <input
                  type="text"
                  id="itemName"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange}
                  placeholder="Enter item name"
                  className={errors.itemName ? 'error' : ''}
                />
                {errors.itemName && <span className="error-text">{errors.itemName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="s1">Category (S1)</label>
                <input
                  type="text"
                  id="s1"
                  name="s1"
                  value={formData.s1}
                  onChange={handleChange}
                  placeholder="e.g., Electronics, Furniture"
                />
              </div>

              <div className="form-group">
                <label htmlFor="totalQty">Total Quantity *</label>
                <input
                  type="number"
                  id="totalQty"
                  name="totalQty"
                  value={formData.totalQty}
                  onChange={handleChange}
                  placeholder="Enter total quantity"
                  min="0"
                  className={errors.totalQty ? 'error' : ''}
                />
                {errors.totalQty && <span className="error-text">{errors.totalQty}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="balance">Balance Quantity</label>
                <input
                  type="number"
                  id="balance"
                  name="balance"
                  value={formData.balance}
                  onChange={handleChange}
                  placeholder="Current stock balance"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Pricing Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="rate">Rate (₹) *</label>
                <input
                  type="number"
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  placeholder="Base rate"
                  min="0"
                  step="0.01"
                  className={errors.rate ? 'error' : ''}
                />
                {errors.rate && <span className="error-text">{errors.rate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="pRate">Purchase Rate (₹)</label>
                <input
                  type="number"
                  id="pRate"
                  name="pRate"
                  value={formData.pRate}
                  onChange={handleChange}
                  placeholder="P Rate"
                  min="0"
                  step="0.01"
                />
              </div>

              <div className="form-group">
                <label htmlFor="gst">GST Percentage (%)</label>
                <select
                  id="gst"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="gstRate">GST Rate (₹)</label>
                <input
                  type="number"
                  id="gstRate"
                  name="gstRate"
                  value={formData.gstRate}
                  onChange={handleChange}
                  placeholder="Auto-calculated"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Calculated Values</h3>
            <div className="form-grid calculated-values">
              <div className="form-group">
                <label>GST Amount (₹)</label>
                <input
                  type="text"
                  value={formData.gstAmount ? `₹${parseFloat(formData.gstAmount).toLocaleString('en-IN')}` : '-'}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label>Sales Rate (₹)</label>
                <input
                  type="text"
                  value={formData.salesRate ? `₹${parseFloat(formData.salesRate).toLocaleString('en-IN')}` : '-'}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group">
                <label>Round (₹)</label>
                <input
                  type="text"
                  value={formData.round ? `₹${parseFloat(formData.round).toLocaleString('en-IN')}` : '-'}
                  readOnly
                  className="readonly"
                />
              </div>

              <div className="form-group highlight">
                <label>Total (₹)</label>
                <input
                  type="text"
                  value={formData.total ? `₹${parseFloat(formData.total).toLocaleString('en-IN')}` : '-'}
                  readOnly
                  className="readonly total-value"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/inventory')} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Item' : 'Add Item')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddItem;
