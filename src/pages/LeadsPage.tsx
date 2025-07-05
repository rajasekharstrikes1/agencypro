import React, { useState } from 'react';
import LeadList from '../components/Lead/LeadList';
import LeadForm from '../components/Lead/LeadForm';
import LeadUpload from '../components/Lead/LeadUpload'; // Import the new component
import { Lead } from '../types';
import { Upload } from 'lucide-react'; // Import icon for the button

const LeadsPage: React.FC = () => {
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isUploadVisible, setIsUploadVisible] = useState(false); // State for upload modal
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); 

  const handleNewLead = () => {
    setCurrentLead(null);
    setIsFormVisible(true);
  };

  const handleEditLead = (lead: Lead) => {
    setCurrentLead(lead);
    setIsFormVisible(true);
  };

  const handleFormClose = () => {
    setIsFormVisible(false);
    setCurrentLead(null);
  };
  
  const refreshList = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleFormSave = () => {
    setIsFormVisible(false);
    setCurrentLead(null);
    refreshList();
  };

  const handleUploadComplete = () => {
    setIsUploadVisible(false);
    refreshList(); // Refresh the list after upload
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Manage Leads</h1>
        <button
          onClick={() => setIsUploadVisible(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none"
        >
          <Upload className="mr-2 h-5 w-5" />
          Upload CSV
        </button>
      </div>

      {isFormVisible && (
        <LeadForm
          currentLead={currentLead}
          onSave={handleFormSave}
          onCancel={handleFormClose}
        />
      )}
      
      {isUploadVisible && (
        <LeadUpload
          onClose={() => setIsUploadVisible(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Hide the list when a full-page form is open if desired */}
      <div className={isFormVisible ? 'hidden' : ''}>
        <LeadList
          key={refreshKey}
          onEdit={handleEditLead}
          onNew={handleNewLead}
        />
      </div>
    </div>
  );
};

export default LeadsPage;