'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, TrendingUp, DollarSign } from 'lucide-react';

interface Opportunity {
  id: string;
  name: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  stage: 'QUALIFICATION' | 'NEEDS_ANALYSIS' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
  probability: number;
  expectedRevenue: number;
  expectedCloseDate: Date;
  description?: string;
  createdAt: Date;
}

interface OpportunityListProps {
  opportunities: Opportunity[];
  onCreateNew: () => void;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (opportunityId: string) => void;
  onView: (opportunity: Opportunity) => void;
}

const STAGES = [
  { value: 'QUALIFICATION', label: 'Qualification', color: 'bg-gray-100' },
  { value: 'NEEDS_ANALYSIS', label: 'Needs Analysis', color: 'bg-blue-100' },
  { value: 'PROPOSAL', label: 'Proposal', color: 'bg-purple-100' },
  { value: 'NEGOTIATION', label: 'Negotiation', color: 'bg-yellow-100' },
  { value: 'CLOSED_WON', label: 'Closed Won', color: 'bg-green-100' },
  { value: 'CLOSED_LOST', label: 'Closed Lost', color: 'bg-red-100' },
];

export function OpportunityList({
  opportunities,
  onCreateNew,
  onEdit,
  onDelete,
  onView,
}: OpportunityListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline');

  const filteredOpportunities = opportunities.filter((opportunity) => {
    return (
      opportunity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const totalPipeline = filteredOpportunities
    .filter((o) => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage))
    .reduce((sum, o) => sum + o.expectedRevenue, 0);

  const weightedPipeline = filteredOpportunities
    .filter((o) => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage))
    .reduce((sum, o) => sum + (o.expectedRevenue * o.probability) / 100, 0);

  const wonValue = filteredOpportunities
    .filter((o) => o.stage === 'CLOSED_WON')
    .reduce((sum, o) => sum + o.expectedRevenue, 0);

  const getOpportunitiesByStage = (stage: string) => {
    return filteredOpportunities.filter((opp) => opp.stage === stage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Opportunities</h2>
          <p className="text-gray-600">{filteredOpportunities.length} opportunities</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'pipeline' ? 'default' : 'outline'}
            onClick={() => setViewMode('pipeline')}
          >
            Pipeline View
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
          >
            List View
          </Button>
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            New Opportunity
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Pipeline</p>
                <p className="text-2xl font-bold text-blue-600">${totalPipeline.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Weighted Pipeline</p>
                <p className="text-2xl font-bold text-purple-600">${weightedPipeline.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Won Revenue</p>
                <p className="text-2xl font-bold text-green-600">${wonValue.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search opportunities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pipeline View */}
      {viewMode === 'pipeline' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {STAGES.filter((s) => s.value !== 'CLOSED_LOST').map((stage) => {
            const stageOpportunities = getOpportunitiesByStage(stage.value);
            const stageValue = stageOpportunities.reduce((sum, o) => sum + o.expectedRevenue, 0);

            return (
              <Card key={stage.value} className={stage.color}>
                <CardHeader>
                  <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <span>{stage.label}</span>
                    <span className="text-xs">
                      {stageOpportunities.length} • ${stageValue.toFixed(0)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stageOpportunities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No opportunities
                    </div>
                  ) : (
                    stageOpportunities.map((opportunity) => (
                      <Card
                        key={opportunity.id}
                        className="bg-white hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onView(opportunity)}
                      >
                        <CardContent className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <h4 className="font-medium text-sm">{opportunity.name}</h4>
                          </div>
                          <p className="text-xs text-gray-600">
                            {opportunity.customer?.name || 'No customer'}
                          </p>
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="text-xs text-gray-500">
                              {opportunity.probability}% • Close:{' '}
                              {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                            </span>
                            <span className="font-bold text-sm">
                              ${opportunity.expectedRevenue.toFixed(0)}
                            </span>
                          </div>
                          <div className="flex justify-end gap-1 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(opportunity);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Delete opportunity "${opportunity.name}"?`))
                                  onDelete(opportunity.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Opportunity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Close Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOpportunities.map((opportunity) => (
                    <tr
                      key={opportunity.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onView(opportunity)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{opportunity.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {opportunity.customer?.name || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-1 rounded bg-gray-100">
                          {STAGES.find((s) => s.value === opportunity.stage)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {new Date(opportunity.expectedCloseDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${opportunity.expectedRevenue.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-gray-900">{opportunity.probability}%</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(opportunity);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete opportunity "${opportunity.name}"?`))
                                onDelete(opportunity.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
