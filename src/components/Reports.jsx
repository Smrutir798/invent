import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Reports.css';

const Reports = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, startDate, endDate]);

  const filterInventory = () => {
    let filtered = inventory;
    
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

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.fetchInventory();
      setInventory(data);
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
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  // Calculate statistics based on filtered data
  const totalItems = filteredInventory.length;
  const totalValue = filteredInventory.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const totalGST = filteredInventory.reduce((sum, item) => sum + (Number(item.gstAmount) || 0), 0);
  const lowStockItems = filteredInventory.filter(item => Number(item.balance) < 10).length;
  const categories = [...new Set(filteredInventory.map(item => item.s1).filter(Boolean))];

  // Group by category
  const categoryData = categories.map(cat => ({
    name: cat,
    count: filteredInventory.filter(item => item.s1 === cat).length,
    value: filteredInventory.filter(item => item.s1 === cat).reduce((sum, item) => sum + (Number(item.total) || 0), 0),
  }));

  // Recent entries from filtered data
  const recentEntries = [...filteredInventory].sort((a, b) => {
    const dateA = new Date(a.date + ' ' + a.time);
    const dateB = new Date(b.date + ' ' + b.time);
    return dateB - dateA;
  }).slice(0, 5);

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="reports-page">
      <header className="reports-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
          <h1>📊 Reports & Analytics</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span>{user?.name}</span>
            <span className="role-badge admin">👑 Admin</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="reports-main">
        {/* Date Filter Section */}
        <div className="reports-toolbar">
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
                ✕ Clear Filters
              </button>
            )}
          </div>
          <div className="filter-info">
            {(startDate || endDate) && (
              <span className="filter-badge">
                Showing data from {startDate || 'beginning'} to {endDate || 'now'}
              </span>
            )}
          </div>
        </div>
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading reports...</p>
          </div>
        ) : (
          <>
            <div className="stats-overview">
              <h2>Overview</h2>
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-info">
                    <span className="stat-value">{totalItems}</span>
                    <span className="stat-label">Total Items</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <span className="stat-value">{formatCurrency(totalValue)}</span>
                    <span className="stat-label">Total Inventory Value</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🧾</div>
                  <div className="stat-info">
                    <span className="stat-value">{formatCurrency(totalGST)}</span>
                    <span className="stat-label">Total GST Amount</span>
                  </div>
                </div>

                <div className="stat-card warning">
                  <div className="stat-icon">⚠️</div>
                  <div className="stat-info">
                    <span className="stat-value">{lowStockItems}</span>
                    <span className="stat-label">Low Stock Items</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📁</div>
                  <div className="stat-info">
                    <span className="stat-value">{categories.length}</span>
                    <span className="stat-label">Categories</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="reports-grid">
              <div className="report-section">
                <h3>Category Breakdown</h3>
                {categoryData.length > 0 ? (
                  <div className="category-list">
                    {categoryData.map((cat, idx) => (
                      <div key={idx} className="category-item">
                        <div className="category-info">
                          <span className="category-name">{cat.name}</span>
                          <span className="category-count">{cat.count} items</span>
                        </div>
                        <div className="category-value">{formatCurrency(cat.value)}</div>
                        <div className="category-bar">
                          <div
                            className="category-bar-fill"
                            style={{
                              width: `${(cat.value / totalValue) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No category data available</p>
                )}
              </div>

              <div className="report-section">
                <h3>Recent Entries</h3>
                {recentEntries.length > 0 ? (
                  <div className="recent-list">
                    {recentEntries.map((item, idx) => (
                      <div key={idx} className="recent-item">
                        <div className="recent-info">
                          <span className="recent-name">{item.itemName}</span>
                          <span className="recent-meta">
                            {item.date} • by {item.enteredBy}
                          </span>
                        </div>
                        <div className="recent-value">{formatCurrency(item.total)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No recent entries</p>
                )}
              </div>

              <div className="report-section">
                <h3>Low Stock Alert</h3>
                {filteredInventory.filter(item => item.balance < 10).length > 0 ? (
                  <div className="alert-list">
                    {filteredInventory
                      .filter(item => item.balance < 10)
                      .map((item, idx) => (
                        <div key={idx} className="alert-item">
                          <div className="alert-info">
                            <span className="alert-name">{item.itemName}</span>
                            <span className="alert-category">{item.s1}</span>
                          </div>
                          <div className="alert-stock">
                            <span className="stock-count">{item.balance}</span>
                            <span className="stock-label">in stock</span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="no-data all-good">✅ All items are well stocked</p>
                )}
              </div>
            </div>

            <div className="export-section">
              <h3>Export Data</h3>
              <p>All data is stored in your connected Google Sheet. You can export from there.</p>
              <div className="export-buttons">
                <button onClick={loadData} className="refresh-btn">
                  🔄 Refresh Data
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Reports;
