'use client';

import { useState, useEffect } from 'react';
import { OpportunityList } from '@/components/sales/OpportunityList';
import { OpportunityForm } from '@/components/sales/OpportunityForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  leadId?: string;
  stage: 'QUALIFICATION' | 'NEEDS_ANALYSIS' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  probability: number;
  expectedRevenue: number;
  expectedCloseDate: Date;
  description?: string;
  notes?: string;
  createdAt: Date;
}

interface Customer {
  id: string;
  name: string;
}

interface Lead {
  id: string;
  title: string;
}

type ViewMode = 'list' | 'create' | 'edit';

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOpportunities();
    loadCustomers();
    loadLeads();
  }, []);

  const loadOpportunities = async () => {
    try {
      const response = await fetch('/api/sales/opportunities');
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data);
      }
    } catch (error) {
      console.error('Failed to load opportunities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/sales/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/sales/leads');
      if (response.ok) {
        const data = await response.json();
        setLeads(data);
      }
    } catch (error) {
      console.error('Failed to load leads:', error);
    }
  };

  const handleCreateOpportunity = async (data: any) => {
    try {
      const response = await fetch('/api/sales/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadOpportunities();
        setViewMode('list');
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      alert('Failed to create opportunity');
    }
  };

  const handleUpdateOpportunity = async (data: any) => {
    if (!selectedOpportunity) return;

    try {
      const response = await fetch(`/api/sales/opportunities/${selectedOpportunity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadOpportunities();
        setViewMode('list');
        setSelectedOpportunity(null);
      }
    } catch (error) {
      console.error('Error updating opportunity:', error);
      alert('Failed to update opportunity');
    }
  };

  const handleDeleteOpportunity = async (opportunityId: string) => {
    try {
      const response = await fetch(`/api/sales/opportunities/${opportunityId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadOpportunities();
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      alert('Failed to delete opportunity');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading opportunities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {viewMode === 'list' ? (
        <OpportunityList
          opportunities={opportunities}
          onCreateNew={() => setViewMode('create')}
          onEdit={(opportunity) => {
            setSelectedOpportunity(opportunity);
            setViewMode('edit');
          }}
          onDelete={handleDeleteOpportunity}
          onView={(opportunity) => {
            setSelectedOpportunity(opportunity);
            setViewMode('edit');
          }}
        />
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button variant="outline" onClick={() => setViewMode('list')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Opportunities
            </Button>
          </div>
          <h1 className="text-3xl font-bold mb-6">
            {viewMode === 'create' ? 'Create New Opportunity' : 'Edit Opportunity'}
          </h1>
          <OpportunityForm
            initialData={selectedOpportunity ? {
              ...selectedOpportunity,
              expectedCloseDate: selectedOpportunity.expectedCloseDate.toISOString().split('T')[0]
            } : undefined}
            customers={customers}
            leads={leads}
            onSubmit={viewMode === 'create' ? handleCreateOpportunity : handleUpdateOpportunity}
            onCancel={() => setViewMode('list')}
          />
        </div>
      )}
    </div>
  );
}
