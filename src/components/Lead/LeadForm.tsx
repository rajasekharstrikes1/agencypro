import React, { useState, useEffect } from 'react';
import { Lead, ServiceOption, StatusOption } from '../../types';
import { db } from '../../firebase/config';
import { collection, addDoc, updateDoc, doc, Timestamp, query, orderBy, getDocs, where } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Save, X } from 'lucide-react';

interface LeadFormProps {
  currentLead: Lead | null;
  onSave: () => void;
  onCancel: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ currentLead, onSave, onCancel }) => {
  const { currentUser, currentTenant } = useAuth();
  const [lead, setLead] = useState<Partial<Lead>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableServices, setAvailableServices] = useState<ServiceOption[]>([]);
  const [availableStatuses, setAvailableStatuses] = useState<StatusOption[]>([]);

  useEffect(() => {
    if (currentLead) {
      setLead(currentLead);
    } else {
      setLead({
        leadDate: new Date().toISOString().split('T')[0],
        name: '',
        mobileNumber: '',
        emailAddress: '',
        services: [],
        leadStatus: '',
        notes: '',
        lastFollowUpDate: '',
      });
    }
  }, [currentLead]);

  useEffect(() => {
    if (currentUser?.uid && currentTenant?.id) {
      fetchAvailableServices();
      fetchAvailableStatuses();
    }
  }, [currentUser, currentTenant]);

  const fetchAvailableServices = async () => {
    if (!currentTenant?.id) return;
    try {
      const servicesRef = collection(db, 'service_options');
      const q = query(servicesRef, where('tenantId', '==', currentTenant.id), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const servicesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ServiceOption[];
      setAvailableServices(servicesList);
    } catch (error) {
      console.error('Error fetching available services:', error);
      setError('Failed to load services.');
    }
  };

  const fetchAvailableStatuses = async () => {
    if (!currentTenant?.id) return;
    try {
      const statusesRef = collection(db, 'status_options');
      const q = query(statusesRef, where('tenantId', '==', currentTenant.id), orderBy('order', 'asc'), orderBy('createdAt', 'asc'));
      const querySnapshot = await getDocs(q);
      const statusesList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })) as StatusOption[];
      setAvailableStatuses(statusesList);
      
      if (!currentLead && statusesList.length > 0) {
        const defaultStatus = statusesList.find(s => s.isDefault) || statusesList[0];
        setLead(prev => ({ ...prev, leadStatus: defaultStatus.name }));
      }
    } catch (error) {
      console.error('Error fetching available statuses:', error);
      setError('Failed to load statuses.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLead(prev => ({ ...prev, [name]: value }));
  };
  
  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    const currentServices = lead.services || [];
    const newServices = checked 
      ? [...currentServices, value] 
      : currentServices.filter(service => service !== value);
    setLead(prev => ({ ...prev, services: newServices }));
  };

  const validateForm = () => {
    if (!lead.name || !lead.mobileNumber || !lead.emailAddress || !lead.services || lead.services.length === 0 || !lead.leadStatus) {
      setError('Please fill in all required fields.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.uid || !currentTenant?.id || !validateForm()) {
      return;
    }

    setLoading(true);
    const dataToSave = {
      ...lead,
      userId: currentUser.uid,
      tenantId: currentTenant.id,
      updatedAt: Timestamp.now(),
    };

    try {
      if (currentLead?.id) {
        await updateDoc(doc(db, 'leads', currentLead.id), dataToSave);
      } else {
        await addDoc(collection(db, 'leads'), {
          ...dataToSave,
          createdAt: Timestamp.now(),
        });
      }
      onSave();
    } catch (err) {
      console.error('Failed to save lead:', err);
      setError(`Failed to save lead.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {currentLead ? 'Edit Lead' : 'Create New Lead'}
      </h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="leadDate" className="block text-sm font-medium text-gray-700 mb-1">Lead Date</label>
            <input type="date" id="leadDate" name="leadDate" value={lead.leadDate || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" id="name" name="name" value={lead.name || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
          </div>
          <div>
            <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input type="tel" id="mobileNumber" name="mobileNumber" value={lead.mobileNumber || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
          </div>
          <div>
            <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" id="emailAddress" name="emailAddress" value={lead.emailAddress || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
          </div>
          <div>
            <label htmlFor="leadStatus" className="block text-sm font-medium text-gray-700 mb-1">Lead Status</label>
            <select id="leadStatus" name="leadStatus" value={lead.leadStatus || ''} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
              <option value="">Select Status</option>
              {availableStatuses.map(status => <option key={status.id} value={status.name}>{status.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="lastFollowUpDate" className="block text-sm font-medium text-gray-700 mb-1">Recent Follow-up</label>
            <input type="date" id="lastFollowUpDate" name="lastFollowUpDate" value={lead.lastFollowUpDate || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
          </div>
        </div>
        <div>
          <span className="block text-sm font-medium text-gray-700 mb-2">Services</span>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {availableServices.map(service => (
              <div key={service.id} className="flex items-center">
                <input type="checkbox" id={`service-${service.id}`} value={service.name} checked={lead.services?.includes(service.name) || false} onChange={handleServiceChange} className="h-4 w-4 text-blue-600 border-gray-300 rounded"/>
                <label htmlFor={`service-${service.id}`} className="ml-2 text-sm text-gray-700">{service.name}</label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="notes" name="notes" value={lead.notes || ''} onChange={handleChange} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"/>
        </div>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} disabled={loading} className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <X className="mr-2 h-5 w-5" /> Cancel
          </button>
          <button type="submit" disabled={loading} className="flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
            <Save className="mr-2 h-5 w-5" /> {loading ? 'Saving...' : (currentLead ? 'Update Lead' : 'Create Lead')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;