import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import AddItem from './components/AddItem';
import Users from './components/Users';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Billing from './components/Billing';
import CreateInvoice from './components/CreateInvoice';
import InvoiceView from './components/InvoiceView';
import SalesLedger from './components/SalesLedger';
import Customers from './components/Customers';
import Suppliers from './components/Suppliers';
import Purchases from './components/Purchases';
import Quotations from './components/Quotations';
import Returns from './components/Returns';
import Expenses from './components/Expenses';
import ProfitReport from './components/ProfitReport';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventory/add"
            element={
              <ProtectedRoute>
                <AddItem />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/inventory/edit"
            element={
              <ProtectedRoute adminOnly>
                <AddItem />
              </ProtectedRoute>
            }
          />
          
          {/* Billing Routes - Both Admin and Employee */}
          <Route
            path="/billing"
            element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/billing/create"
            element={
              <ProtectedRoute>
                <CreateInvoice />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/billing/view/:invoiceNo"
            element={
              <ProtectedRoute>
                <InvoiceView />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/ledger"
            element={
              <ProtectedRoute>
                <SalesLedger />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/suppliers"
            element={
              <ProtectedRoute>
                <Suppliers />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/purchases"
            element={
              <ProtectedRoute>
                <Purchases />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/quotations"
            element={
              <ProtectedRoute>
                <Quotations />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/returns"
            element={
              <ProtectedRoute>
                <Returns />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/expenses"
            element={
              <ProtectedRoute adminOnly>
                <Expenses />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/profit-report"
            element={
              <ProtectedRoute adminOnly>
                <ProfitReport />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Only Routes */}
          <Route
            path="/users"
            element={
              <ProtectedRoute adminOnly>
                <Users />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute adminOnly>
                <Settings />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reports"
            element={
              <ProtectedRoute adminOnly>
                <Reports />
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
