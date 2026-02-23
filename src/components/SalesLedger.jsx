import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './SalesLedger.css';

const SalesLedger = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, startDate, endDate, searchTerm]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.fetchInvoices();
      // Sort by date descending
      const sorted = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setInvoices(sorted);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(inv =>
        inv.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.buyerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(inv => new Date(inv.date) >= new Date(startDate));
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(inv => new Date(inv.date) <= end);
    }

    setFilteredInvoices(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
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

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate totals
  const totals = filteredInvoices.reduce((acc, inv) => {
    acc.subtotal += Number(inv.subtotal) || 0;
    acc.gst += Number(inv.gstAmount) || 0;
    acc.total += Number(inv.totalAmount) || Number(inv.total) || 0;
    return acc;
  }, { subtotal: 0, gst: 0, total: 0 });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="sales-ledger-page">
      <header className="ledger-header no-print">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
          <h1>📒 Sales Ledger</h1>
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

      <main className="ledger-main">
        <div className="ledger-toolbar no-print">
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
            <button onClick={clearFilters} className="clear-btn">Clear</button>
            <button onClick={handlePrint} className="print-btn">🖨️ Print</button>
          </div>
        </div>

        {/* Print Header */}
        <div className="print-header print-only">
          <h1>DURGA CYCLE STORE</h1>
          <p>ADANGA BAZAR, SORO, BALASORE, Odisha - 756046</p>
          <h2>Sales Ledger</h2>
          <p className="date-range">
            {startDate || endDate
              ? `Period: ${startDate || 'Start'} to ${endDate || 'Present'}`
              : `As of ${new Date().toLocaleDateString('en-IN')}`}
          </p>
        </div>

        {loading ? (
          <div className="loading">Loading sales data...</div>
        ) : (
          <>
            <div className="ledger-table-container">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Invoice No.</th>
                    <th>Buyer Name</th>
                    <th>Items</th>
                    <th className="right">Subtotal</th>
                    <th className="right">GST</th>
                    <th className="right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">No sales records found</td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv, index) => {
                      let items = [];
                      try {
                        items = typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items || [];
                      } catch (e) {}
                      const itemCount = items.length;
                      const itemNames = items.map(i => i.itemName).join(', ');

                      return (
                        <tr key={inv.id || index}>
                          <td>{index + 1}</td>
                          <td>{formatDate(inv.date)}</td>
                          <td className="invoice-no">{inv.invoiceNo}</td>
                          <td>{inv.buyerName}</td>
                          <td className="items-cell" title={itemNames}>
                            {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </td>
                          <td className="right">{formatCurrency(inv.subtotal)}</td>
                          <td className="right">{formatCurrency(inv.gstAmount)}</td>
                          <td className="right total">{formatCurrency(inv.totalAmount || inv.total)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredInvoices.length > 0 && (
                  <tfoot>
                    <tr className="totals-row">
                      <td colSpan="5" className="right"><strong>TOTALS:</strong></td>
                      <td className="right"><strong>{formatCurrency(totals.subtotal)}</strong></td>
                      <td className="right"><strong>{formatCurrency(totals.gst)}</strong></td>
                      <td className="right total"><strong>{formatCurrency(totals.total)}</strong></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="ledger-summary">
              <div className="summary-card">
                <span className="label">Total Invoices</span>
                <span className="value">{filteredInvoices.length}</span>
              </div>
              <div className="summary-card">
                <span className="label">Total Sales</span>
                <span className="value">{formatCurrency(totals.total)}</span>
              </div>
              <div className="summary-card">
                <span className="label">Total GST Collected</span>
                <span className="value">{formatCurrency(totals.gst)}</span>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default SalesLedger;
