import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Customers.css';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', gstin: '', bankName: '', accountNo: '', ifsc: ''
  });
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.fetchSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = suppliers.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone?.includes(searchTerm)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await googleSheetsService.updateSupplier(editingSupplier.id, formData);
      } else {
        await googleSheetsService.addSupplier(formData);
      }
      setShowAddModal(false);
      setEditingSupplier(null);
      setFormData({ name: '', phone: '', email: '', address: '', gstin: '', bankName: '', accountNo: '', ifsc: '' });
      loadSuppliers();
    } catch (error) {
      alert('Error saving supplier');
    }
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData(supplier);
    setShowAddModal(true);
  };

  const handleDelete = async (supplier) => {
    if (window.confirm(`Delete supplier "${supplier.name}"?`)) {
      await googleSheetsService.deleteSupplier(supplier.id);
      loadSuppliers();
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="suppliers-page">
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
          <h1>🏭 Supplier Management</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="page-main">
        <div className="toolbar">
          <input type="text" placeholder="Search suppliers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
          <button onClick={() => { setEditingSupplier(null); setFormData({ name: '', phone: '', email: '', address: '', gstin: '', bankName: '', accountNo: '', ifsc: '' }); setShowAddModal(true); }} className="add-btn">
            ➕ Add Supplier
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading suppliers...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>GSTIN</th>
                  <th>Address</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan="6" className="no-data">No suppliers found</td></tr>
                ) : (
                  filtered.map((supplier, idx) => (
                    <tr key={idx}>
                      <td className="name-cell">{supplier.name}</td>
                      <td>{supplier.phone}</td>
                      <td>{supplier.email || '-'}</td>
                      <td>{supplier.gstin || '-'}</td>
                      <td>{supplier.address || '-'}</td>
                      <td className="actions">
                        <button onClick={() => handleEdit(supplier)} className="edit-btn">✏️</button>
                        {isAdmin() && <button onClick={() => handleDelete(supplier)} className="delete-btn">🗑️</button>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}</h2>
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
                <div className="form-group">
                  <label>Bank Name</label>
                  <input type="text" value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Account No.</label>
                  <input type="text" value={formData.accountNo} onChange={e => setFormData({...formData, accountNo: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>IFSC</label>
                  <input type="text" value={formData.ifsc} onChange={e => setFormData({...formData, ifsc: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="cancel-btn">Cancel</button>
                <button type="submit" className="save-btn">{editingSupplier ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
