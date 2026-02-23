import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Inventory.css';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [searchTerm, startDate, endDate, inventory]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.fetchInventory();
      setInventory(data);
      setFilteredInventory(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = inventory;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.s1?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Date filters
    if (startDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const filterDate = new Date(startDate);
        return itemDate >= filterDate;
      });
    }
    
    if (endDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const filterDate = new Date(endDate);
        filterDate.setHours(23, 59, 59, 999);
        return itemDate <= filterDate;
      });
    }
    
    setFilteredInventory(filtered);
  };

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleDelete = async (item) => {
    if (!isAdmin()) {
      alert('Only administrators can delete items');
      return;
    }
    try {
      await googleSheetsService.deleteItem(item.id);
      setInventory(prev => prev.filter(i => i.id !== item.id));
      setShowDeleteConfirm(null);
      alert('Item deleted successfully');
    } catch (error) {
      alert('Error deleting item');
    }
  };

  const handleEdit = (item) => {
    if (!isAdmin()) {
      alert('Only administrators can edit items');
      return;
    }
    setEditingItem(item);
    navigate('/inventory/edit', { state: { item } });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDownloadCSV = () => {
    const headers = ['Item Name', 'Category', 'Total Qty', 'Balance', 'Rate', 'GST %', 'GST Amount', 'Sales Rate', 'Total', 'Date', 'Entered By'];
    const csvData = filteredInventory.map(item => [
      item.itemName || '',
      item.s1 || '',
      item.totalQty || 0,
      item.balance || 0,
      item.rate || 0,
      item.gst || 0,
      item.gstAmount || 0,
      item.salesRate || 0,
      item.total || 0,
      item.date || '',
      item.enteredBy || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
          <h1>📋 Inventory List</h1>
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

      <main className="inventory-main">
        <div className="inventory-toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search items by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="date-filters">
            <div className="date-filter-group">
              <label>From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="date-filter-group">
              <label>To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <button onClick={clearDateFilters} className="clear-filter-btn">
                ✕ Clear
              </button>
            )}
          </div>
          <div className="toolbar-actions">
            <button onClick={() => navigate('/inventory/add')} className="add-btn">
              ➕ Add New Item
            </button>
            <button onClick={handleDownloadCSV} className="download-btn">
              ⬇️ Download
            </button>
            <button onClick={loadInventory} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading inventory...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="empty-state">
            <p>No items found</p>
            <button onClick={() => navigate('/inventory/add')}>Add your first item</button>
          </div>
        ) : (
          <div className="inventory-table-container">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Total Qty</th>
                  <th>Balance</th>
                  <th>Rate</th>
                  <th>GST %</th>
                  <th>GST Amount</th>
                  <th>Sales Rate</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Entered By</th>
                  {isAdmin() && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => (
                  <tr key={item.id}>
                    <td className="item-name">{item.itemName}</td>
                    <td>{item.s1}</td>
                    <td>{item.totalQty}</td>
                    <td className={Number(item.balance) < 10 ? 'low-stock' : ''}>
                      {item.balance}
                      {Number(item.balance) < 10 && <span className="warning">⚠️</span>}
                    </td>
                    <td>{formatCurrency(item.rate)}</td>
                    <td>{item.gst}%</td>
                    <td>{formatCurrency(item.gstAmount)}</td>
                    <td>{formatCurrency(item.salesRate)}</td>
                    <td className="total">{formatCurrency(item.total)}</td>
                    <td>{item.date}</td>
                    <td>{item.enteredBy}</td>
                    {isAdmin() && (
                      <td className="actions">
                        <button
                          onClick={() => handleEdit(item)}
                          className="edit-btn"
                          title="Edit item"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(item)}
                          className="delete-btn"
                          title="Delete item"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="inventory-summary">
          <div className="summary-item">
            <span className="label">Total Items:</span>
            <span className="value">{filteredInventory.length}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Value:</span>
            <span className="value">
              {formatCurrency(filteredInventory.reduce((sum, item) => sum + (Number(item.total) || 0), 0))}
            </span>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete "{showDeleteConfirm.itemName}"?</p>
            <div className="modal-actions">
              <button onClick={() => setShowDeleteConfirm(null)} className="cancel-btn">
                Cancel
              </button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="confirm-delete-btn">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
