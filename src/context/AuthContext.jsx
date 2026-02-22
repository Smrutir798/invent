import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for saved user session
    const savedUser = localStorage.getItem('inventoryUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (username, password, role) => {
    // In production, validate against Google Sheets users data
    // For demo, using hardcoded credentials
    const users = {
      admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
      employee1: { password: 'emp123', role: 'employee', name: 'Employee One' },
      employee2: { password: 'emp456', role: 'employee', name: 'Employee Two' },
    };

    const userInfo = users[username];
    if (userInfo && userInfo.password === password) {
      const userData = {
        username,
        role: userInfo.role,
        name: userInfo.name,
        loginTime: new Date().toISOString(),
      };
      setUser(userData);
      localStorage.setItem('inventoryUser', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, error: 'Invalid credentials' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('inventoryUser');
  };

  const isAdmin = () => user?.role === 'admin';
  const isEmployee = () => user?.role === 'employee';

  const value = {
    user,
    login,
    logout,
    isAdmin,
    isEmployee,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
