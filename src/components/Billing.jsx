import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Billing.css';

const Billing = () => {
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, startDate, endDate, searchTerm]);

  const filterInvoices = () => {
    let filtered = invoices;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.buyerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Date filters
    if (startDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const filterDate = new Date(startDate);
        return invoiceDate >= filterDate;
      });
    }
    
    if (endDate) {
      filtered = filtered.filter(invoice => {
        const invoiceDate = new Date(invoice.date);
        const filterDate = new Date(endDate);
        filterDate.setHours(23, 59, 59, 999);
        return invoiceDate <= filterDate;
      });
    }
    
    setFilteredInvoices(filtered);
  };

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [inventoryData, invoiceData] = await Promise.all([
        googleSheetsService.fetchInventory(),
        googleSheetsService.fetchInvoices(),
      ]);
      setInventory(inventoryData);
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="billing-page">
      <header className="billing-header no-print">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
          <h1>🧾 Billing & Invoices</h1>
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

      <main className="billing-main">
        <div className="billing-toolbar no-print">
          <div className="toolbar-row">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search by invoice no. or buyer name..."
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
              {(startDate || endDate || searchTerm) && (
                <button onClick={clearDateFilters} className="clear-filter-btn">
                  ✕ Clear
                </button>
              )}
            </div>
          </div>
          <div className="toolbar-actions">
            <button onClick={() => navigate('/billing/create')} className="create-btn">
              ➕ Create New Invoice
            </button>
            <button onClick={loadData} className="refresh-btn">
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading invoices...</p>
          </div>
        ) : (
          <div className="invoices-section no-print">
            <h2>Recent Invoices</h2>
            {invoices.length === 0 ? (
              <div className="empty-state">
                <p>No invoices found</p>
                <button onClick={() => navigate('/billing/create')}>
                  Create your first invoice
                </button>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="empty-state">
                <p>No invoices match your filter criteria</p>
                <button onClick={clearDateFilters}>Clear Filters</button>
              </div>
            ) : (
              <div className="invoices-table-container">
                <table className="invoices-table">
                  <thead>
                    <tr>
                      <th>Invoice No.</th>
                      <th>Date</th>
                      <th>Buyer Name</th>
                      <th>Total Amount</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((invoice, idx) => (
                      <tr key={idx}>
                        <td className="invoice-no">{invoice.invoiceNo}</td>
                        <td>{invoice.date}</td>
                        <td>{invoice.buyerName}</td>
                        <td className="amount">{formatCurrency(invoice.totalAmount)}</td>
                        <td>{invoice.createdBy}</td>
                        <td className="actions">
                          <button
                            onClick={() => navigate(`/billing/view/${invoice.invoiceNo}`, { state: { invoice } })}
                            className="view-btn"
                          >
                            👁️ View
                          </button>
                          {isAdmin() && (
                            <button
                              onClick={() => {/* Delete logic */}}
                              className="delete-btn"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="billing-stats no-print">
          <div className="stat-card">
            <span className="stat-value">{filteredInvoices.length}</span>
            <span className="stat-label">Filtered Invoices</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0))}
            </span>
            <span className="stat-label">Filtered Sales</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {formatCurrency(filteredInvoices.reduce((sum, inv) => sum + (Number(inv.gstAmount) || 0), 0))}
            </span>
            <span className="stat-label">Filtered GST</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{invoices.length}</span>
            <span className="stat-label">Total Invoices</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Billing;
