import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Customers.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', gstin: '', state: 'Odisha', stateCode: '21'
  });
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.fetchCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredCustomers(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await googleSheetsService.updateCustomer(editingCustomer.id, formData);
        alert('Customer updated successfully!');
      } else {
        await googleSheetsService.addCustomer(formData);
        alert('Customer added successfully!');
      }
      setShowAddModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', email: '', address: '', gstin: '', state: 'Odisha', stateCode: '21' });
      loadCustomers();
    } catch (error) {
      alert('Error saving customer');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setShowAddModal(true);
  };

  const handleDelete = async (customer) => {
    if (window.confirm(`Delete customer "${customer.name}"?`)) {
      try {
        await googleSheetsService.deleteCustomer(customer.id);
        loadCustomers();
      } catch (error) {
        alert('Error deleting customer');
      }
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="customers-page">
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
          <h1>👥 Customer Database</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="page-main">
        <div className="toolbar">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button onClick={() => { setEditingCustomer(null); setFormData({ name: '', phone: '', email: '', address: '', gstin: '', state: 'Odisha', stateCode: '21' }); setShowAddModal(true); }} className="add-btn">
            ➕ Add Customer
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading customers...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>GSTIN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr><td colSpan="6" className="no-data">No customers found</td></tr>
                ) : (
                  filteredCustomers.map((customer, idx) => (
                    <tr key={idx}>
                      <td className="name-cell">{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.email}</td>
                      <td>{customer.address}</td>
                      <td>{customer.gstin || '-'}</td>
                      <td className="actions">
                        <button onClick={() => handleEdit(customer)} className="edit-btn">✏️</button>
                        {isAdmin() && <button onClick={() => handleDelete(customer)} className="delete-btn">🗑️</button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{customers.length}</span>
            <span className="stat-label">Total Customers</span>
          </div>
        </div>
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>GSTIN</label>
                  <input type="text" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">{editingCustomer ? 'Update' : 'Add'} Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
