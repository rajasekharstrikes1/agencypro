import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { CompanySettings, ServiceOption, StatusOption, LeadStatus, UserRole } from '../types';
import { Save, Upload, Building, Plus, Trash2, ChevronRight, Briefcase, FileText } from 'lucide-react';

type SettingsTab = 'leads' | 'invoice';

const SettingsPage: React.FC = () => {
  const { currentUser, userProfile, isRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<CompanySettings>({
    name: '', address: '', phone: '', email: '', website: '', gst: '', pan: '',
    logoUrl: '', logoBase64: '', invoicePrefix: '',
    bankName: '', accountNumber: '', ifscCode: '', branchName: ''
  });

  // Dynamic options states
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [newStatusName, setNewStatusName] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#000000');

  const [activeTab, setActiveTab] = useState<SettingsTab>('leads');

  useEffect(() => {
    // Only show invoice settings for non-super admin users
    if (!isRole(UserRole.SUPER_ADMIN)) {
      fetchSettings();
    }
    
    if (currentUser?.uid) {
      fetchServiceOptions();
      fetchStatusOptions();
    }
  }, [currentUser, isRole]);

  const fetchSettings = async () => {
    try {
      const settingsRef = collection(db, `users/${currentUser?.uid}/settings`);
      const querySnapshot = await getDocs(settingsRef);
      if (!querySnapshot.empty) {
        const settings = querySnapshot.docs[0].data() as CompanySettings;
        setFormData(settings);
        setSettingsId(querySnapshot.docs[0].id);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleLogoUpload = async (file: File): Promise<{ url: string, base64: string }> => {
    const logoRef = ref(storage, `logos/${currentUser?.uid}/${file.name}`);
    await uploadBytes(logoRef, file);
    const url = await getDownloadURL(logoRef);
    const base64 = await fileToBase64(file);
    return { url, base64 };
  };

  const handleSubmitCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrl = formData.logoUrl;
      let logoBase64 = formData.logoBase64;

      if (logoFile) {
        const result = await handleLogoUpload(logoFile);
        logoUrl = result.url;
        logoBase64 = result.base64;
      }

      const settingsData = {
        ...formData,
        logoUrl,
        logoBase64
      };

      if (!currentUser?.uid) {
        console.error("Error saving settings: User not logged in (UID is null).");
        alert('Error saving settings: You must be logged in.');
        setLoading(false);
        return;
      }

      if (settingsId) {
        await updateDoc(doc(db, `users/${currentUser.uid}/settings`, settingsId), settingsData);
      } else {
        const docRef = await addDoc(collection(db, `users/${currentUser.uid}/settings`), settingsData);
        setSettingsId(docRef.id);
      }

      setFormData({ ...settingsData });
      setLogoFile(null);
      alert('Invoice Settings saved successfully!');
    } catch (error) {
      console.error('Detailed Error saving settings:', error);
      alert(`Error saving settings: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const fetchServiceOptions = async () => {
    if (!currentUser?.uid) return;
    try {
      const servicesRef = collection(db, `users/${currentUser.uid}/service_options`);
      const q = query(servicesRef, orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const servicesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ServiceOption[];
      setServices(servicesList);
    } catch (error) {
      console.error('Error fetching service options:', error);
    }
  };

  const handleAddService = async () => {
    if (!currentUser?.uid || !newServiceName.trim()) return;
    setLoading(true);
    try {
      await addDoc(collection(db, `users/${currentUser.uid}/service_options`), {
        name: newServiceName.trim(),
        createdAt: new Date().toISOString(),
      });
      setNewServiceName('');
      fetchServiceOptions();
    } catch (error) {
      console.error('Error adding service:', error);
      alert('Failed to add service.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!currentUser?.uid || !window.confirm('Are you sure you want to delete this service? This cannot be undone.')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/service_options`, serviceId));
      fetchServiceOptions();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusOptions = async () => {
    if (!currentUser?.uid) return;
    try {
      const statusesRef = collection(db, `users/${currentUser.uid}/status_options`);
      const q = query(statusesRef, orderBy('order', 'asc'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const statusesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StatusOption[];
      setStatuses(statusesList);
    } catch (error) {
      console.error('Error fetching status options:', error);
      setStatuses([
        { id: 'default_created', name: LeadStatus.CREATED, order: 1, isDefault: true, color: '#2563EB' },
        { id: 'default_followup', name: LeadStatus.FOLLOWUP, order: 2, color: '#FBBF24' },
        { id: 'default_client', name: LeadStatus.CLIENT, order: 3, color: '#10B981' },
        { id: 'default_rejected', name: LeadStatus.REJECTED, order: 4, color: '#EF4444' },
      ]);
    }
  };

  const handleAddStatus = async () => {
    if (!currentUser?.uid || !newStatusName.trim()) return;
    setLoading(true);
    try {
      const maxOrder = statuses.reduce((max, s) => Math.max(max, s.order || 0), 0);
      await addDoc(collection(db, `users/${currentUser.uid}/status_options`), {
        name: newStatusName.trim(),
        order: maxOrder + 1,
        color: newStatusColor,
        createdAt: new Date().toISOString(),
      });
      setNewStatusName('');
      setNewStatusColor('#000000');
      fetchStatusOptions();
    } catch (error) {
      console.error('Error adding status:', error);
      alert('Failed to add status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStatus = async (statusId: string) => {
    if (!currentUser?.uid || !window.confirm('Are you sure you want to delete this status?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/status_options`, statusId));
      fetchStatusOptions();
    } catch (error) {
      console.error('Error deleting status:', error);
      alert('Failed to delete status.');
    } finally {
      setLoading(false);
    }
  };

  // For super admin, only show leads settings
  if (isRole(UserRole.SUPER_ADMIN)) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Briefcase className="w-6 h-6 mr-2" />
              Lead Settings
            </h1>
            <p className="text-gray-600 mt-1">Configure options for leads management</p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-primary" /> Manage Services
              </h3>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="New service name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
                <button type="button" onClick={handleAddService} disabled={loading || !newServiceName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 disabled:opacity-50">
                  Add
                </button>
              </div>
              <ul className="divide-y divide-gray-200">
                {services.map(service => (
                  <li key={service.id} className="flex items-center justify-between py-2 text-sm text-gray-800">
                    <span>{service.name}</span>
                    <button type="button" onClick={() => handleDeleteService(service.id!)} disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {services.length === 0 && <li className="py-2 text-sm text-gray-500">No custom services.</li>}
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-primary" /> Manage Lead Statuses
              </h3>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="New status name"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
                <input
                  type="color"
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="w-10 h-9 border border-gray-300 rounded-md shadow-sm cursor-pointer"
                  title="Choose status color"
                />
                <button type="button" onClick={handleAddStatus} disabled={loading || !newStatusName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 disabled:opacity-50">
                  Add
                </button>
              </div>
              <ul className="divide-y divide-gray-200">
                {statuses.map(status => (
                  <li key={status.id} className="flex items-center justify-between py-2 text-sm text-gray-800">
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: status.color || '#9E9E9E' }}></span>
                      <span>{status.name} (Order: {status.order})</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteStatus(status.id!)} disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {statuses.length === 0 && <li className="py-2 text-sm text-gray-500">No custom statuses.</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row">
      {/* Sidebar for Settings Sections */}
      <div className="w-full md:w-56 bg-white shadow-lg rounded-lg p-4 mb-6 md:mb-0 md:mr-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
        <ul>
          <li className="mb-2">
            <button
              type="button"
              onClick={() => setActiveTab('leads')}
              className={`flex items-center w-full px-3 py-2 rounded-md text-left font-medium transition-colors ${
                activeTab === 'leads' ? 'bg-secondary text-primary' : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
              }`}
            >
              <Briefcase className="w-5 h-5 mr-3" />
              Lead Settings
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => setActiveTab('invoice')}
              className={`flex items-center w-full px-3 py-2 rounded-md text-left font-medium transition-colors ${
                activeTab === 'invoice' ? 'bg-secondary text-primary' : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
              }`}
            >
              <FileText className="w-5 h-5 mr-3" />
              Invoice Settings
            </button>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden">
        {activeTab === 'leads' && (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Briefcase className="w-6 h-6 mr-2" />
              Lead Settings
            </h1>
            <p className="text-gray-600 mt-1">Configure options for your leads management</p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-primary" /> Manage Services
              </h3>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="New service name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
                <button type="button" onClick={handleAddService} disabled={loading || !newServiceName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 disabled:opacity-50">
                  Add
                </button>
              </div>
              <ul className="divide-y divide-gray-200">
                {services.map(service => (
                  <li key={service.id} className="flex items-center justify-between py-2 text-sm text-gray-800">
                    <span>{service.name}</span>
                    <button type="button" onClick={() => handleDeleteService(service.id!)} disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {services.length === 0 && <li className="py-2 text-sm text-gray-500">No custom services.</li>}
              </ul>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-primary" /> Manage Lead Statuses
              </h3>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  placeholder="New status name"
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-accent focus:border-accent"
                />
                <input
                  type="color"
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="w-10 h-9 border border-gray-300 rounded-md shadow-sm cursor-pointer"
                  title="Choose status color"
                />
                <button type="button" onClick={handleAddStatus} disabled={loading || !newStatusName.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 disabled:opacity-50">
                  Add
                </button>
              </div>
              <ul className="divide-y divide-gray-200">
                {statuses.map(status => (
                  <li key={status.id} className="flex items-center justify-between py-2 text-sm text-gray-800">
                    <div className="flex items-center">
                      <span className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: status.color || '#9E9E9E' }}></span>
                      <span>{status.name} (Order: {status.order})</span>
                    </div>
                    <button type="button" onClick={() => handleDeleteStatus(status.id!)} disabled={loading}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {statuses.length === 0 && <li className="py-2 text-sm text-gray-500">No custom statuses.</li>}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <form onSubmit={handleSubmitCompanySettings} className="p-6 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Invoice Settings
            </h1>
            <p className="text-gray-600 mt-1">Configure your company information for invoices</p>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div className="flex items-center space-x-4">
                {(formData.logoUrl || formData.logoBase64) && (
                  <img src={formData.logoUrl || formData.logoBase64} alt="Company Logo" className="h-16 w-16 object-contain border border-gray-200 rounded" />
                )}
                <div>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" id="logo-upload" />
                  <label htmlFor="logo-upload" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4 mr-2" /> Upload Logo
                  </label>
                  {logoFile && (<p className="text-sm text-gray-500 mt-1">Selected: {logoFile.name}</p>)}
                </div>
              </div>
            </div>

            {/* Company Information Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="text" required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Number *</label>
                <input type="text" required value={formData.gst} onChange={(e) => setFormData({ ...formData, gst: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                <input type="text" required value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix (e.g., VRI)</label>
                <input type="text" value={formData.invoicePrefix || ''} onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" maxLength={5} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <textarea required rows={3} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
            </div>

            {/* Bank Account Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Account Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                  <input type="text" value={formData.bankName || ''} onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                  <input type="text" value={formData.accountNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input type="text" value={formData.ifscCode || ''} onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <input type="text" value={formData.branchName || ''} onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-accent focus:border-accent" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-gray-800 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent">
                <Save className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save Invoice Settings'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;