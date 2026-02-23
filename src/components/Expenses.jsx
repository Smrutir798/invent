import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Customers.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '', paidTo: '', paymentMode: 'cash'
  });
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const categories = ['Rent', 'Utilities', 'Salary', 'Transport', 'Maintenance', 'Marketing', 'Office Supplies', 'Miscellaneous'];

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.fetchExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = expenses.filter(exp => {
    if (searchTerm && !exp.description?.toLowerCase().includes(searchTerm.toLowerCase()) && !exp.category?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (startDate && new Date(exp.date) < new Date(startDate)) return false;
    if (endDate && new Date(exp.date) > new Date(endDate)) return false;
    return true;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await googleSheetsService.addExpense({ ...formData, createdBy: user?.username });
      alert('Expense added!');
      setShowAddModal(false);
      setFormData({ date: new Date().toISOString().split('T')[0], category: '', description: '', amount: '', paidTo: '', paymentMode: 'cash' });
      loadExpenses();
    } catch (error) {
      alert('Error saving expense');
    }
  };

  const handleDelete = async (expense) => {
    if (window.confirm('Delete this expense?')) {
      await googleSheetsService.deleteExpense(expense.id);
      loadExpenses();
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const handleLogout = () => { logout(); navigate('/login'); };

  const totalExpenses = filtered.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const categoryTotals = filtered.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + (Number(e.amount) || 0); return acc; }, {});

  return (
    <div className="expenses-page">
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
          <h1>💰 Expense Tracker</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="page-main">
        <div className="toolbar">
          <input type="text" placeholder="Search expenses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" style={{flex: 1}} />
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{padding: '0.5rem'}} />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{padding: '0.5rem'}} />
          <button onClick={() => setShowAddModal(true)} className="add-btn">➕ Add Expense</button>
        </div>

        <div className="stats-row" style={{marginBottom: '1.5rem'}}>
          <div className="stat-card">
            <span className="stat-value" style={{color: '#dc3545'}}>{formatCurrency(totalExpenses)}</span>
            <span className="stat-label">Total Expenses</span>
          </div>
          {Object.entries(categoryTotals).slice(0, 3).map(([cat, amt]) => (
            <div key={cat} className="stat-card">
              <span className="stat-value">{formatCurrency(amt)}</span>
              <span className="stat-label">{cat}</span>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading expenses...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Paid To</th>
                  <th>Mode</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="no-data">No expenses found</td></tr>
                ) : (
                  filtered.map((exp, idx) => (
                    <tr key={idx}>
                      <td>{exp.date}</td>
                      <td><span className="status-badge pending">{exp.category}</span></td>
                      <td>{exp.description}</td>
                      <td>{exp.paidTo || '-'}</td>
                      <td>{exp.paymentMode}</td>
                      <td className="amount-cell negative">{formatCurrency(exp.amount)}</td>
                      <td className="actions">
                        {isAdmin() && <button onClick={() => handleDelete(exp)} className="delete-btn">🗑️</button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr style={{fontWeight: 'bold', background: '#f5f5f5'}}>
                    <td colSpan="5">TOTAL</td>
                    <td className="amount-cell negative">{formatCurrency(totalExpenses)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Expense</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Date *</label>
                  <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Payment Mode</label>
                  <select value={formData.paymentMode} onChange={e => setFormData({...formData, paymentMode: e.target.value})}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Paid To</label>
                  <input type="text" value={formData.paidTo} onChange={e => setFormData({...formData, paidTo: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">Add Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
