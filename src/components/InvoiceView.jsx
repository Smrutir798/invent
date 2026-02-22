import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './InvoiceView.css';

const InvoiceView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { invoiceNo } = useParams();
  const { user, logout } = useAuth();
  const [invoice, setInvoice] = useState(location.state?.invoice || null);

  const companyDetails = {
    name: 'DURGA CYCLE STORE',
    address: 'ADANGA BAZAR, SORO, BALASORE',
    city: 'Odisha - 756046, India',
    gstin: '21AAGFD1091E1Z2',
    state: 'Odisha',
    stateCode: '21',
    email: 'durgacycle.soro@gmail.com',
    phone: '9876543210',
    pan: 'AAGFD1091E',
    bankName: 'STATE BANK OF INDIA',
    accountNo: '30747838665',
    ifsc: 'SBIN0007980',
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value) || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const parseItems = () => {
    if (!invoice?.items) return [];
    try {
      return typeof invoice.items === 'string' ? JSON.parse(invoice.items) : invoice.items;
    } catch {
      return [];
    }
  };

  const items = parseItems();

  if (!invoice) {
    return (
      <div className="invoice-view-page">
        <div className="not-found">
          <h2>Invoice not found</h2>
          <button onClick={() => navigate('/billing')}>Back to Billing</button>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-view-page">
      <header className="view-header no-print">
        <div className="header-left">
          <button onClick={() => navigate('/billing')} className="back-btn">
            ← Back
          </button>
          <h1>Invoice #{invoice.invoiceNo}</h1>
        </div>
        <div className="header-right">
          <button onClick={handlePrint} className="print-btn">
            🖨️ Print
          </button>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <main className="view-main">
        <div className="invoice-paper">
          {/* Header */}
          <div className="invoice-title">TAX INVOICE</div>
          
          <div className="print-date no-print">
            Printed on: {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}
          </div>
          
          <div className="invoice-top">
            <div className="company-info">
              <h2>{companyDetails.name}</h2>
              <p>{companyDetails.address}</p>
              <p>{companyDetails.city}</p>
              <p>GSTIN/UIN: {companyDetails.gstin}</p>
              <p>State: {companyDetails.state}, Code: {companyDetails.stateCode}</p>
              <p>E-Mail: {companyDetails.email}</p>
            </div>
            <div className="invoice-info">
              <table className="info-table">
                <tbody>
                  <tr>
                    <td>Invoice No.</td>
                    <td><strong>{invoice.invoiceNo}</strong></td>
                  </tr>
                  <tr>
                    <td>Dated</td>
                    <td><strong>{invoice.date}</strong></td>
                  </tr>
                  <tr>
                    <td>Time</td>
                    <td>{invoice.time}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="invoice-parties">
            <div className="buyer-info">
              <h4>Buyer (Bill to):</h4>
              <p><strong>{invoice.buyerName}</strong></p>
              <p>{invoice.buyerAddress || '-'}</p>
              <p>GSTIN/UIN: {invoice.buyerGSTIN || '-'}</p>
              <p>Contact: {invoice.buyerPhone || '-'}</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="items-table">
            <thead>
              <tr>
                <th>Sr</th>
                <th>Description of Goods</th>
                <th>HSN/SAC</th>
                <th>GST %</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Rate (incl Tax)</th>
                <th>Dis %</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td className="item-desc">{item.itemName}</td>
                  <td>{item.hsn}</td>
                  <td>{item.gstPercent}%</td>
                  <td>{item.quantity} PCS</td>
                  <td>₹{formatCurrency(item.rate)}</td>
                  <td>₹{formatCurrency(item.rateWithTax)}</td>
                  <td>{item.discount}%</td>
                  <td className="amount-cell">₹{formatCurrency(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="subtotal-row">
                <td colSpan="8" className="text-right">Subtotal:</td>
                <td className="amount-cell">₹{formatCurrency(invoice.subtotal)}</td>
              </tr>
              <tr className="gst-row">
                <td colSpan="8" className="text-right">SGST:</td>
                <td className="amount-cell">₹{formatCurrency(invoice.sgst)}</td>
              </tr>
              <tr className="gst-row">
                <td colSpan="8" className="text-right">CGST:</td>
                <td className="amount-cell">₹{formatCurrency(invoice.cgst)}</td>
              </tr>
              <tr className="total-row">
                <td colSpan="8" className="text-right"><strong>Total:</strong></td>
                <td className="amount-cell total-amount">₹{formatCurrency(invoice.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Amount in Words */}
          <div className="amount-words">
            <strong>{invoice.amountInWords}</strong>
          </div>

          {/* GST Breakdown */}
          <div className="gst-breakdown">
            <h4>GST Breakdown:</h4>
            <table className="gst-table">
              <thead>
                <tr>
                  <th>HSN/SAC</th>
                  <th>Taxable Value</th>
                  <th>CGST Rate</th>
                  <th>CGST Amt</th>
                  <th>SGST Rate</th>
                  <th>SGST Amt</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.hsn}</td>
                    <td>₹{formatCurrency(item.taxableAmount)}</td>
                    <td>{item.gstPercent / 2}%</td>
                    <td>₹{formatCurrency(item.cgst)}</td>
                    <td>{item.gstPercent / 2}%</td>
                    <td>₹{formatCurrency(item.sgst)}</td>
                    <td>₹{formatCurrency(item.cgst + item.sgst)}</td>
                  </tr>
                ))}
                <tr className="gst-total">
                  <td><strong>Total</strong></td>
                  <td><strong>₹{formatCurrency(invoice.subtotal)}</strong></td>
                  <td></td>
                  <td><strong>₹{formatCurrency(invoice.cgst)}</strong></td>
                  <td></td>
                  <td><strong>₹{formatCurrency(invoice.sgst)}</strong></td>
                  <td><strong>₹{formatCurrency(invoice.gstAmount)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="invoice-footer">
            <div className="company-bank">
              <h4>Company's Bank Details:</h4>
              <p>Bank Name: {companyDetails.bankName}</p>
              <p>A/c No.: {companyDetails.accountNo}</p>
              <p>IFSC: {companyDetails.ifsc}</p>
              <p>PAN: {companyDetails.pan}</p>
            </div>
            <div className="signature">
              <p>for {companyDetails.name}</p>
              <div className="signature-line"></div>
              <p>Authorised Signatory</p>
            </div>
          </div>

          <div className="invoice-note">
            <p>This is a Computer Generated Invoice</p>
            <p className="created-by">Created by: {invoice.createdBy}</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoiceView;
