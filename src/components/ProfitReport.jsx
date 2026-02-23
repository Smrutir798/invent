import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Customers.css';

const ProfitReport = () => {
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inv, invoiceData] = await Promise.all([
        googleSheetsService.fetchInventory(),
        googleSheetsService.fetchInvoices()
      ]);
      setInventory(inv);
      setInvoices(invoiceData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices by date
  const filteredInvoices = invoices.filter(inv => {
    if (startDate && new Date(inv.date) < new Date(startDate)) return false;
    if (endDate && new Date(inv.date) > new Date(endDate)) return false;
    return true;
  });

  // Calculate profit/loss per item sold
  const calculateProfitData = () => {
    const profitByItem = {};
    
    filteredInvoices.forEach(invoice => {
      let items = [];
      try { items = typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items || []; } catch(e) {}
      
      items.forEach(item => {
        const inventoryItem = inventory.find(i => i.itemName === item.itemName);
        const purchaseRate = Number(inventoryItem?.pRate) || 0;
        const saleRate = Number(item.rate) || 0;
        const qty = Number(item.quantity) || 0;
        const profit = (saleRate - purchaseRate) * qty;

        if (!profitByItem[item.itemName]) {
          profitByItem[item.itemName] = { itemName: item.itemName, qtySold: 0, purchaseValue: 0, saleValue: 0, profit: 0, purchaseRate, saleRate };
        }
        profitByItem[item.itemName].qtySold += qty;
        profitByItem[item.itemName].purchaseValue += purchaseRate * qty;
        profitByItem[item.itemName].saleValue += saleRate * qty;
        profitByItem[item.itemName].profit += profit;
      });
    });

    return Object.values(profitByItem);
  };

  const profitData = calculateProfitData();
  const totalPurchaseValue = profitData.reduce((sum, p) => sum + p.purchaseValue, 0);
  const totalSaleValue = profitData.reduce((sum, p) => sum + p.saleValue, 0);
  const totalProfit = profitData.reduce((sum, p) => sum + p.profit, 0);
  const profitMargin = totalSaleValue > 0 ? ((totalProfit / totalSaleValue) * 100).toFixed(1) : 0;

  const formatCurrency = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value) || 0);
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="profit-report-page">
      <header className="page-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
          <h1>📊 Profit / Loss Report</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.name}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="page-main">
        <div className="toolbar">
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <label>From:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{padding: '0.5rem'}} />
            <label>To:</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{padding: '0.5rem'}} />
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="cancel-btn">Clear</button>
          </div>
          <button onClick={() => window.print()} className="add-btn">🖨️ Print Report</button>
        </div>

        <div className="stats-row" style={{marginBottom: '1.5rem'}}>
          <div className="stat-card">
            <span className="stat-value">{formatCurrency(totalPurchaseValue)}</span>
            <span className="stat-label">Total Cost (Purchase)</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{formatCurrency(totalSaleValue)}</span>
            <span className="stat-label">Total Sales</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{color: totalProfit >= 0 ? '#28a745' : '#dc3545'}}>{formatCurrency(totalProfit)}</span>
            <span className="stat-label">{totalProfit >= 0 ? 'Profit' : 'Loss'}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value" style={{color: totalProfit >= 0 ? '#28a745' : '#dc3545'}}>{profitMargin}%</span>
            <span className="stat-label">Profit Margin</span>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading report...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Qty Sold</th>
                  <th>Purchase Rate</th>
                  <th>Sale Rate</th>
                  <th>Cost Value</th>
                  <th>Sale Value</th>
                  <th>Profit/Loss</th>
                  <th>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {profitData.length === 0 ? (
                  <tr><td colSpan="8" className="no-data">No sales data available</td></tr>
                ) : (
                  profitData.map((item, idx) => {
                    const margin = item.saleValue > 0 ? ((item.profit / item.saleValue) * 100).toFixed(1) : 0;
                    return (
                      <tr key={idx}>
                        <td className="name-cell">{item.itemName}</td>
                        <td>{item.qtySold}</td>
                        <td>{formatCurrency(item.purchaseRate)}</td>
                        <td>{formatCurrency(item.saleRate)}</td>
                        <td>{formatCurrency(item.purchaseValue)}</td>
                        <td>{formatCurrency(item.saleValue)}</td>
                        <td className={`amount-cell ${item.profit < 0 ? 'negative' : ''}`}>{formatCurrency(item.profit)}</td>
                        <td style={{color: item.profit >= 0 ? '#28a745' : '#dc3545'}}>{margin}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {profitData.length > 0 && (
                <tfoot>
                  <tr style={{fontWeight: 'bold', background: '#f5f5f5'}}>
                    <td>TOTALS</td>
                    <td>{profitData.reduce((sum, p) => sum + p.qtySold, 0)}</td>
                    <td>-</td>
                    <td>-</td>
                    <td>{formatCurrency(totalPurchaseValue)}</td>
                    <td>{formatCurrency(totalSaleValue)}</td>
                    <td className={`amount-cell ${totalProfit < 0 ? 'negative' : ''}`}>{formatCurrency(totalProfit)}</td>
                    <td style={{color: totalProfit >= 0 ? '#28a745' : '#dc3545'}}>{profitMargin}%</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfitReport;
