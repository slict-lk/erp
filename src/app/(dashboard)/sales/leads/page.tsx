'use client';

import { useState, useEffect } from 'react';
import { LeadList } from '@/components/sales/LeadList';
import { LeadForm } from '@/components/sales/LeadForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: 'NEW' | 'QUALIFIED' | 'PROPOSITION' | 'WON' | 'LOST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expectedRevenue?: number;
  probability?: number;
  createdAt: Date;
}

type ViewMode = 'list' | 'create' | 'edit';

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/sales/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async (data: any) => {
    try {
      const response = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadLeads();
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead');
    }
  };

  const handleUpdateLead = async (data: any) => {
    if (!selectedLead) return;

    try {
      const response = await fetch(`/api/sales/leads/${selectedLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadLeads();
        setViewMode('list');
        setSelectedLead(null);
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead');
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const response = await fetch(`/api/sales/leads/${leadId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadLeads();
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Failed to delete lead');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading leads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {viewMode === 'list' ? (
        <LeadList
          leads={leads}
          onCreateNew={() => setViewMode('create')}
          onEdit={(lead) => {
            setSelectedLead(lead);
            setViewMode('edit');
          }}
          onDelete={handleDeleteLead}
          onView={(lead) => {
            setSelectedLead(lead);
            setViewMode('edit');
          }}
        />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Leads
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Create New Lead' : 'Edit Lead'}
          </h1>
          <LeadForm
            initialData={selectedLead || undefined}
            onSubmit={viewMode === 'create' ? handleCreateLead : handleUpdateLead}
            onCancel={() => setViewMode('list')}
          />
        </div>
      )}
    </div>
  );
}
