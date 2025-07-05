// Path: digitalavenger/invoice/invoice-8778080b2e82e01b0e0b1db4cbffc77385999a44/src/components/Invoice/InvoiceForm.tsx

import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, orderBy, limit, runTransaction } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Invoice, InvoiceItem, Customer, CompanySettings } from '../../types';
import { format } from 'date-fns';
import { Plus, Trash2, Save, Download } from 'lucide-react';
import { generatePDF } from '../../utils/pdfGenerator';

interface InvoiceFormProps {
  invoice?: Invoice;
  onSave?: (invoice: Invoice) => void;
  onCancel?: () => void; // This prop will be used for the Cancel button
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, onSave, onCancel }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  
  const [formData, setFormData] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    customerId: '',
    customer: {
      name: '',
      address: '',
      phone: '',
      email: '',
      gst: ''
    },
    items: [
      {
        id: '1',
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
        gstRate: 18,
        gstAmount: 0
      }
    ],
    subtotal: 0,
    totalGst: 0,
    total: 0,
    notes: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchCustomers();
    fetchCompanySettings();
  }, []);

  useEffect(() => {
    if (invoice) {
      setFormData(invoice);
    } else {
      if (companySettings && currentUser?.uid) {
        generateNextInvoiceNumberForDisplay();
      }
    }
  }, [invoice, companySettings, currentUser]);

  const generateNextInvoiceNumberForDisplay = async () => {
    if (!currentUser?.uid || !companySettings?.invoicePrefix) {
      console.warn('Cannot generate invoice number for display: Company settings or user not loaded yet.');
      setFormData(prev => ({
        ...prev,
        invoiceNumber: `${companySettings?.invoicePrefix || 'INV'}INV${new Date().getFullYear()}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
      }));
      return;
    }

    try {
      const currentYear = new Date().getFullYear();
      const counterDocRef = doc(db, `users/${currentUser.uid}/invoice_counters`, String(currentYear));
      
      const counterDoc = await getDoc(counterDocRef);
      let currentCount = 0;

      if (counterDoc.exists()) {
        currentCount = counterDoc.data()?.currentCount || 0;
      }

      const nextSequenceNumber = currentCount + 1; 

      const paddedNumber = String(nextSequenceNumber).padStart(4, '0');
      const newInvoiceNumber = `${companySettings.invoicePrefix}INV${currentYear}${paddedNumber}`;
      
      setFormData(prev => ({
        ...prev,
        invoiceNumber: newInvoiceNumber
      }));
    } catch (error) {
      console.error('Error generating invoice number for display:', error);
      setFormData(prev => ({
        ...prev,
        invoiceNumber: `${companySettings.invoicePrefix || 'INV'}INV${new Date().getFullYear()}${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
      }));
    }
  };


  const fetchCustomers = async () => {
    try {
      const customersRef = collection(db, `users/${currentUser?.uid}/customers`);
      const querySnapshot = await getDocs(customersRef);
      const customersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customersList);
      console.log('Fetched customers:', customersList); // Debugging
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const settingsRef = collection(db, `users/${currentUser?.uid}/settings`);
      const querySnapshot = await getDocs(settingsRef);
      if (!querySnapshot.empty) {
        const settings = querySnapshot.docs[0].data() as CompanySettings;
        setCompanySettings(settings);
        console.log('Fetched company settings:', settings); // Debugging
      } else {
        setCompanySettings({ 
          invoicePrefix: 'INV',
          name: '', address: '', phone: '', email: '', website: '', gst: '', pan: '', logoUrl: '',
          bankName: '', accountNumber: '', ifscCode: '', branchName: ''
        } as CompanySettings);
      }
    } catch (error) {
      console.error('Error fetching company settings:', error);
      setCompanySettings({ 
        invoicePrefix: 'INV',
        name: '', address: '', phone: '', email: '', website: '', gst: '', pan: '', logoUrl: '',
        bankName: '', accountNumber: '', ifscCode: '', branchName: ''
      } as CompanySettings);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const selectedCustomer = customers.find(c => c.id === customerId);
    if (selectedCustomer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customer: selectedCustomer
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...(formData.items || [])];
    items[index] = {
      ...items[index],
      [field]: value
    };

    if (field === 'quantity' || field === 'rate' || field === 'gstRate') {
      const quantity = Number(items[index].quantity);
      const rate = Number(items[index].rate);
      const gstRate = Number(items[index].gstRate);
      
      const amount = quantity * rate;
      const gstAmount = (amount * gstRate) / 100;
      
      items[index].amount = amount;
      items[index].gstAmount = gstAmount;
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalGst = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const total = subtotal + totalGst;

    setFormData(prev => ({
      ...prev,
      items,
      subtotal,
      totalGst,
      total
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      gstRate: 18,
      gstAmount: 0
    };

    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), newItem]
    }));
  };

  const removeItem = (index: number) => {
    const items = [...(formData.items || [])];
    items.splice(index, 1);

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalGst = items.reduce((sum, item) => sum + item.gstAmount, 0);
    const total = subtotal + totalGst;

    setFormData(prev => ({
      ...prev,
      items,
      subtotal,
      totalGst,
      total
    }));
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      let invoiceDataToSave = {
        ...formData,
        updatedAt: new Date().toISOString(),
        createdAt: formData.createdAt || new Date().toISOString()
      };

      if (invoice?.id) {
        await updateDoc(doc(db, `users/${currentUser?.uid}/invoices`, invoice.id), invoiceDataToSave);
      } else {
        if (!currentUser?.uid || !companySettings?.invoicePrefix) {
          throw new Error('User or company settings not loaded for new invoice creation.');
        }

        const currentYear = new Date().getFullYear();
        const counterDocRef = doc(db, `users/${currentUser.uid}/invoice_counters`, String(currentYear));
        
        let finalInvoiceNumber: string = '';

        await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterDocRef);
          let nextSequenceNumber: number;

          if (!counterDoc.exists()) {
            nextSequenceNumber = 1;
            transaction.set(counterDocRef, { currentCount: nextSequenceNumber });
          } else {
            const data = counterDoc.data();
            nextSequenceNumber = (data?.currentCount || 0) + 1;
            transaction.update(counterDocRef, { currentCount: nextSequenceNumber });
          }
          
          const paddedNumber = String(nextSequenceNumber).padStart(4, '0');
          finalInvoiceNumber = `${companySettings.invoicePrefix}INV${currentYear}${paddedNumber}`;
        });

        invoiceDataToSave = {
          ...invoiceDataToSave,
          invoiceNumber: finalInvoiceNumber
        };

        await addDoc(collection(db, `users/${currentUser?.uid}/invoices`), invoiceDataToSave);
      }

      onSave?.(invoiceDataToSave as Invoice);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert(`Error saving invoice: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!companySettings) {
      alert('Please configure company settings first');
      return;
    }
    // Debugging: Check company settings before PDF generation
    console.log('Company Settings before PDF generation (handleDownloadPDF):', companySettings);
    
    try {
      await generatePDF(formData as Invoice, companySettings);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {invoice ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
            {onCancel && ( // Display Cancel button if onCancel prop is provided
              <button
                onClick={onCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Number
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a customer</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Details */}
        {formData.customer && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.customer.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, name: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.customer.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, email: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.customer.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, phone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  value={formData.customer.gst || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, gst: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.customer.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customer: { ...prev.customer!, address: e.target.value }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Invoice Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
            <button
              onClick={addItem}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items?.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Item description"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="1"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        value={item.gstRate}
                        onChange={(e) => handleItemChange(index, 'gstRate', Number(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formData.items && formData.items.length > 1 && (
                        <button
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">₹{formData.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total GST:</span>
              <span className="font-medium">₹{formData.totalGst?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>₹{formData.total?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Additional notes or terms..."
          />
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;