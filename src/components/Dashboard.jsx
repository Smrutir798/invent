import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>📦 Inventory Management System</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className={`user-role ${user?.role}`}>
              {user?.role === 'admin' ? '👑 Admin' : '👤 Employee'}
            </span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-section">
          <h2>Welcome, {user?.name}!</h2>
          <p>
            {isAdmin()
              ? 'You have full administrative access to manage inventory, users, and settings.'
              : 'You can view and add inventory items. Contact admin for additional permissions.'}
          </p>
        </div>

        <div className="dashboard-cards">
          <div className="dashboard-card" onClick={() => navigate('/inventory')}>
            <div className="card-icon">📋</div>
            <h3>View Inventory</h3>
            <p>Browse and search all inventory items</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/inventory/add')}>
            <div className="card-icon">➕</div>
            <h3>Add New Item</h3>
            <p>Add a new item to inventory</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/billing')}>
            <div className="card-icon">🧾</div>
            <h3>Billing & Invoices</h3>
            <p>Create and manage invoices</p>
          </div>

          <div className="dashboard-card" onClick={() => navigate('/billing/create')}>
            <div className="card-icon">📝</div>
            <h3>Create Invoice</h3>
            <p>Generate a new tax invoice</p>
          </div>

          {isAdmin() && (
            <>
              <div className="dashboard-card" onClick={() => navigate('/inventory')}>
                <div className="card-icon">✏️</div>
                <h3>Edit Items</h3>
                <p>Modify existing inventory items</p>
              </div>

              <div className="dashboard-card" onClick={() => navigate('/users')}>
                <div className="card-icon">👥</div>
                <h3>Manage Users</h3>
                <p>View and manage user accounts</p>
              </div>

              <div className="dashboard-card" onClick={() => navigate('/settings')}>
                <div className="card-icon">⚙️</div>
                <h3>Settings</h3>
                <p>Configure system settings</p>
              </div>

              <div className="dashboard-card" onClick={() => navigate('/reports')}>
                <div className="card-icon">📊</div>
                <h3>Reports</h3>
                <p>View inventory reports and analytics</p>
              </div>
            </>
          )}
        </div>

        <div className="quick-stats">
          <h3>Quick Overview</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">--</span>
              <span className="stat-label">Total Items</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">--</span>
              <span className="stat-label">Low Stock</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">--</span>
              <span className="stat-label">Total Value</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">--</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
