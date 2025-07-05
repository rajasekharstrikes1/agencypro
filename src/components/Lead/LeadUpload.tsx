import React, { useState } from 'react';
import Papa from 'papaparse';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { collection, doc, Timestamp, writeBatch } from 'firebase/firestore';
import { Lead } from '../../types';
import { Upload, X } from 'lucide-react';

interface LeadUploadProps {
  onClose: () => void;
  onUploadComplete: () => void;
}

const LeadUpload: React.FC<LeadUploadProps> = ({ onClose, onUploadComplete }) => {
  const { currentUser, currentTenant } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file || !currentUser || !currentTenant?.id) {
      setError('Please select a file and ensure you are logged in.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const leads = results.data as any[];
        if (leads.length === 0) {
          setError('CSV file is empty or does not contain valid data.');
          setUploading(false);
          return;
        }

        const BATCH_SIZE = 500;
        const totalBatches = Math.ceil(leads.length / BATCH_SIZE);
        const leadsCollectionRef = collection(db, 'leads');

        try {
          for (let i = 0; i < totalBatches; i++) {
            const batch = writeBatch(db);
            const chunk = leads.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);

            chunk.forEach((row) => {
              if (!row.name || !row.mobileNumber || !row.emailAddress) {
                console.warn("Skipping row due to missing data:", row);
                return; 
              }

              const leadData: Omit<Lead, 'id'> = {
                name: row.name,
                mobileNumber: row.mobileNumber,
                emailAddress: row.emailAddress,
                leadDate: row.leadDate || new Date().toISOString().split('T')[0],
                services: row.services ? row.services.split(';').map((s: string) => s.trim()) : [],
                leadStatus: row.leadStatus || 'Created',
                notes: row.notes || '',
                lastFollowUpDate: row.lastFollowUpDate || '',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                userId: currentUser.uid,
                tenantId: currentTenant.id,
              };
              
              const leadDocRef = doc(leadsCollectionRef);
              batch.set(leadDocRef, leadData);
            });

            await batch.commit();
            setProgress(((i + 1) / totalBatches) * 100);
          }
          
          onUploadComplete();
        } catch (err) {
          console.error('Error uploading leads in batches:', err);
          setError('An error occurred during the upload. Some leads may not have been saved.');
        } finally {
          setUploading(false);
        }
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
        setUploading(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">Upload Leads from CSV</h3>
          <button onClick={onClose} disabled={uploading} className="text-gray-500 hover:text-gray-800 disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

        <div className="mb-4">
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            CSV File
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
          />
        </div>
        
        <p className="text-xs text-gray-500 mb-4">
          Required headers: `name, mobileNumber, emailAddress, leadDate, services, leadStatus, notes, lastFollowUpDate`.
        </p>

        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="flex items-center justify-center w-28 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {uploading ? 'Uploading...' : <><Upload className="mr-2" size={18} /> Upload</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadUpload;