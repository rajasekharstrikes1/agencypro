import React, { useState } from 'react';
import { Invoice } from '../types';
import InvoiceList from '../components/Invoice/InvoiceList';
import InvoiceForm from '../components/Invoice/InvoiceForm';

const InvoicesPage: React.FC = () => {
  const [view, setView] = useState<'list' | 'form' | 'view'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | undefined>();

  const handleNew = () => {
    setSelectedInvoice(undefined);
    setView('form');
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setView('form');
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setView('view');
  };

  const handleSave = () => {
    setView('list');
    setSelectedInvoice(undefined);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedInvoice(undefined);
  };

  if (view === 'form') {
    return (
      <InvoiceForm
        invoice={selectedInvoice}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  if (view === 'view') {
    return (
      <InvoiceForm
        invoice={selectedInvoice}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <InvoiceList
      onNew={handleNew}
      onEdit={handleEdit}
      onView={handleView}
    />
  );
};

export default InvoicesPage;