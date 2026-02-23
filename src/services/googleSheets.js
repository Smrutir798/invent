// Google Sheets API Integration Service

// Use local server in development, Vercel serverless in production
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocal ? 'http://localhost:3001' : '/api/sheets';

class GoogleSheetsService {
  constructor() {
    this.apiUrl = API_BASE_URL;
  }

  setScriptUrl(url) {
    // Keep for backward compatibility (not used with Vercel)
  }

  async fetchInventory() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getInventory`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      return data.length > 0 ? data : this.getMockData();
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return this.getMockData();
    }
  }

  async addItem(itemData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=addItem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding item:', error);
      throw error;
    }
  }

  async updateItem(rowIndex, itemData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=updateItem&rowIndex=${rowIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating item:', error);
      throw error;
    }
  }

  async deleteItem(rowIndex) {
    try {
      const response = await fetch(`${this.apiUrl}?action=deleteItem&rowIndex=${rowIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting item:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getUsers`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return this.getMockUsers();
    }
  }

  async validateUser(username, password) {
    try {
      const response = await fetch(`${this.apiUrl}?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error validating user:', error);
      return this.mockValidateUser(username, password);
    }
  }

  mockValidateUser(username, password) {
    const users = {
      admin: { password: 'admin123', role: 'admin', name: 'Administrator' },
      employee1: { password: 'emp123', role: 'employee', name: 'Employee One' },
      employee2: { password: 'emp456', role: 'employee', name: 'Employee Two' },
    };
    const user = users[username];
    if (user && user.password === password) {
      return { success: true, user: { username, role: user.role, name: user.name } };
    }
    return { success: false, error: 'Invalid credentials' };
  }

  getMockData() {
    return [
      {
        id: 2,
        itemName: 'Hero Ranger DTB 26T',
        totalQty: 20,
        balance: 18,
        rate: 8500,
        gst: 12,
        gstRate: 1020,
        pRate: 7800,
        s1: 'Bicycle',
        gstAmount: 1020,
        salesRate: 9520,
        round: 9520,
        total: 9520,
        date: '2026-02-20',
        time: '10:30:00',
        enteredBy: 'admin',
      },
      {
        id: 3,
        itemName: 'Atlas Goldline 26T',
        totalQty: 15,
        balance: 12,
        rate: 6500,
        gst: 12,
        gstRate: 780,
        pRate: 5900,
        s1: 'Bicycle',
        gstAmount: 780,
        salesRate: 7280,
        round: 7280,
        total: 7280,
        date: '2026-02-21',
        time: '14:15:00',
        enteredBy: 'employee1',
      },
      {
        id: 4,
        itemName: 'Hercules Roadsters',
        totalQty: 25,
        balance: 22,
        rate: 5500,
        gst: 12,
        gstRate: 660,
        pRate: 5000,
        s1: 'Bicycle',
        gstAmount: 660,
        salesRate: 6160,
        round: 6160,
        total: 6160,
        date: '2026-02-22',
        time: '09:00:00',
        enteredBy: 'admin',
      },
      {
        id: 5,
        itemName: 'Cycle Tube 26x1.5',
        totalQty: 100,
        balance: 85,
        rate: 150,
        gst: 18,
        gstRate: 27,
        pRate: 120,
        s1: 'Spare Parts',
        gstAmount: 27,
        salesRate: 177,
        round: 177,
        total: 177,
        date: '2026-02-22',
        time: '11:00:00',
        enteredBy: 'admin',
      },
    ];
  }

  getMockUsers() {
    return [
      { username: 'admin', role: 'admin', name: 'Administrator' },
      { username: 'employee1', role: 'employee', name: 'Employee One' },
      { username: 'employee2', role: 'employee', name: 'Employee Two' },
    ];
  }

  // Invoice Functions
  async fetchInvoices() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getInvoices`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      return data.length > 0 ? data : this.getMockInvoices();
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return this.getMockInvoices();
    }
  }

  async addInvoice(invoiceData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=addInvoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding invoice:', error);
      // Save to localStorage as backup
      const invoices = JSON.parse(localStorage.getItem('demoInvoices') || '[]');
      invoices.unshift({ ...invoiceData, id: Date.now() });
      localStorage.setItem('demoInvoices', JSON.stringify(invoices));
      return { success: true, message: 'Saved locally' };
    }
  }

  async deleteInvoice(rowIndex) {
    try {
      const response = await fetch(`${this.apiUrl}?action=deleteInvoice&rowIndex=${rowIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  async reduceInventoryBalance(items) {
    // items is an array of { rowIndex, quantity }
    try {
      const response = await fetch(`${this.apiUrl}?action=reduceInventoryBalance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error reducing inventory balance:', error);
      // In demo mode, just return success
      return { success: true, message: 'Demo mode - inventory not updated' };
    }
  }

  async increaseInventoryBalance(items) {
    try {
      const response = await fetch(`${this.apiUrl}?action=increaseInventoryBalance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error increasing inventory balance:', error);
      return { success: true, message: 'Demo mode - inventory not updated' };
    }
  }

  // Customer Functions
  async fetchCustomers() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getCustomers`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching customers:', error);
      return [];
    }
  }

  async addCustomer(customerData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=addCustomer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  }

  async updateCustomer(rowIndex, customerData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=updateCustomer&rowIndex=${rowIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(rowIndex) {
    try {
      const response = await fetch(`${this.apiUrl}?action=deleteCustomer&rowIndex=${rowIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }

  // Supplier Functions
  async fetchSuppliers() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getSuppliers`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return [];
    }
  }

  async addSupplier(supplierData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=addSupplier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  }

  async deleteSupplier(rowIndex) {
    try {
      const response = await fetch(`${this.apiUrl}?action=deleteSupplier&rowIndex=${rowIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // Purchase Functions
  async fetchPurchases() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getPurchases`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }
  }

  async addPurchase(purchaseData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=addPurchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding purchase:', error);
      throw error;
    }
  }

  // Quotation Functions
  async fetchQuotations() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getQuotations`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching quotations:', error);
      return [];
    }
  }

  async addQuotation(quotationData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=addQuotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding quotation:', error);
      throw error;
    }
  }

  async updateQuotation(rowIndex, quotationData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=updateQuotation&rowIndex=${rowIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  }

  // Returns Functions
  async fetchReturns() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getReturns`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching returns:', error);
      return [];
    }
  }

  async addReturn(returnData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=addReturn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding return:', error);
      throw error;
    }
  }

  // Expense Functions
  async fetchExpenses() {
    try {
      const response = await fetch(`${this.apiUrl}?action=getExpenses`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return [];
    }
  }

  async addExpense(expenseData) {
    try {
      const response = await fetch(`${this.apiUrl}?action=addExpense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });
      return await response.json();
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  }

  async deleteExpense(rowIndex) {
    try {
      const response = await fetch(`${this.apiUrl}?action=deleteExpense&rowIndex=${rowIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await response.json();
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  }

  getMockInvoices() {
    // Check localStorage first for demo invoices
    const localInvoices = JSON.parse(localStorage.getItem('demoInvoices') || '[]');
    if (localInvoices.length > 0) {
      return localInvoices;
    }

    return [
      {
        id: 1,
        invoiceNo: 'INV260201',
        date: '2026-02-20',
        time: '10:30:00',
        buyerName: 'BISWAL CYCLE STORE',
        buyerAddress: 'KHAIRIA - 756048, India',
        buyerGSTIN: '21CZQPB0189L1Z8',
        buyerPhone: '9855168339',
        items: JSON.stringify([
          { itemName: 'CYCLE AVON WAKA WAKA IBC FS/DD 26T', hsn: '87120010', gstPercent: 5, quantity: 2, rate: 4880, rateWithTax: 5124, discount: 0, taxableAmount: 9760, sgst: 244, cgst: 244, totalAmount: 10248 },
          { itemName: 'CYCLE AVON RAVO IBC 26T', hsn: '87120010', gstPercent: 5, quantity: 2, rate: 3760, rateWithTax: 3948, discount: 0, taxableAmount: 7520, sgst: 188, cgst: 188, totalAmount: 7896 }
        ]),
        subtotal: 17280,
        sgst: 432,
        cgst: 432,
        gstAmount: 864,
        totalAmount: 18144,
        amountInWords: 'Indian Rupees Eighteen Thousand One Hundred Forty Four Only',
        createdBy: 'admin'
      },
      {
        id: 2,
        invoiceNo: 'INV260202',
        date: '2026-02-21',
        time: '14:45:00',
        buyerName: 'RAJ CYCLE MART',
        buyerAddress: 'Balasore - 756001',
        buyerGSTIN: '',
        buyerPhone: '9876543210',
        items: JSON.stringify([
          { itemName: 'CYCLE HERO VIPER 26T IC RS', hsn: '87120010', gstPercent: 5, quantity: 4, rate: 4170, rateWithTax: 4378.5, discount: 0, taxableAmount: 16680, sgst: 417, cgst: 417, totalAmount: 17514 }
        ]),
        subtotal: 16680,
        sgst: 417,
        cgst: 417,
        gstAmount: 834,
        totalAmount: 17514,
        amountInWords: 'Indian Rupees Seventeen Thousand Five Hundred Fourteen Only',
        createdBy: 'employee1'
      }
    ];
  }

  // Calculate GST and totals
  calculateGST(rate, gstPercentage, quantity = 1) {
    const gstAmount = (rate * gstPercentage) / 100;
    const salesRate = rate + gstAmount;
    const total = salesRate * quantity;
    return {
      gstAmount: Math.round(gstAmount * 100) / 100,
      salesRate: Math.round(salesRate * 100) / 100,
      round: Math.round(salesRate),
      total: Math.round(total * 100) / 100,
    };
  }
}

export const googleSheetsService = new GoogleSheetsService();
export default googleSheetsService;
