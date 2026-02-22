import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import googleSheetsService from '../services/googleSheets';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="users-page">
      <header className="users-header">
        <div className="header-left">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ← Back
          </button>
          <h1>👥 User Management</h1>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span>{user?.name}</span>
            <span className="role-badge admin">👑 Admin</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="users-main">
        <div className="users-toolbar">
          <h2>Registered Users</h2>
          <p className="info-text">
            User credentials are stored in Google Sheets. To add new users, add them directly to the Users sheet.
          </p>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Permissions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr key={idx}>
                    <td className="username">{u.username}</td>
                    <td>{u.name}</td>
                    <td>
                      <span className={`role-tag ${u.role}`}>
                        {u.role === 'admin' ? '👑 Admin' : '👤 Employee'}
                      </span>
                    </td>
                    <td>
                      {u.role === 'admin' ? (
                        <span className="permissions full">Full Access</span>
                      ) : (
                        <span className="permissions limited">
                          View, Add Items Only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="permissions-info">
          <h3>Role Permissions</h3>
          <div className="permissions-grid">
            <div className="permission-card admin-card">
              <h4>👑 Administrator</h4>
              <ul>
                <li>✅ View all inventory items</li>
                <li>✅ Add new items</li>
                <li>✅ Edit existing items</li>
                <li>✅ Delete items</li>
                <li>✅ Manage users</li>
                <li>✅ Access settings</li>
                <li>✅ View reports</li>
              </ul>
            </div>
            <div className="permission-card employee-card">
              <h4>👤 Employee</h4>
              <ul>
                <li>✅ View all inventory items</li>
                <li>✅ Add new items</li>
                <li>❌ Edit existing items</li>
                <li>❌ Delete items</li>
                <li>❌ Manage users</li>
                <li>❌ Access settings</li>
                <li>❌ View reports</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Users;
