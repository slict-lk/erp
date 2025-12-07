'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, FileText, Clock } from 'lucide-react';

interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customer?: {
    id: string;
    name: string;
  };
  validUntil: Date;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  total: number;
  lines: any[];
  createdAt: Date;
}

interface QuotationListProps {
  quotations: Quotation[];
  onCreateNew: () => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotationId: string) => void;
  onView: (quotation: Quotation) => void;
}

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-orange-100 text-orange-800',
};

export function QuotationList({
  quotations,
  onCreateNew,
  onEdit,
  onDelete,
  onView,
}: QuotationListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredQuotations = quotations.filter((quotation) => {
    const matchesSearch =
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'ALL' || quotation.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalValue = filteredQuotations
    .filter((q) => q.status === 'SENT' || q.status === 'DRAFT')
    .reduce((sum, q) => sum + q.total, 0);

  const acceptedValue = filteredQuotations
    .filter((q) => q.status === 'ACCEPTED')
    .reduce((sum, q) => sum + q.total, 0);

  const draftCount = quotations.filter((q) => q.status === 'DRAFT').length;
  const sentCount = quotations.filter((q) => q.status === 'SENT').length;
  const acceptedCount = quotations.filter((q) => q.status === 'ACCEPTED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Quotations</h2>
          <p className="text-gray-600">{filteredQuotations.length} quotations</p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Quotation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Pending Value</p>
                <p className="text-2xl font-bold text-blue-600">${totalValue.toFixed(2)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Accepted Value</p>
                <p className="text-2xl font-bold text-green-600">${acceptedValue.toFixed(2)}</p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quotations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === 'ALL' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('ALL')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'DRAFT' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('DRAFT')}
                size="sm"
              >
                Draft ({draftCount})
              </Button>
              <Button
                variant={filterStatus === 'SENT' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('SENT')}
                size="sm"
              >
                Sent ({sentCount})
              </Button>
              <Button
                variant={filterStatus === 'ACCEPTED' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('ACCEPTED')}
                size="sm"
              >
                Accepted ({acceptedCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quotation Grid */}
      {filteredQuotations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No quotations found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'ALL'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first quotation'}
              </p>
              {!searchTerm && filterStatus === 'ALL' && (
                <Button onClick={onCreateNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quotation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotations.map((quotation) => (
            <Card
              key={quotation.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onView(quotation)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{quotation.quotationNumber}</CardTitle>
                      <span className="text-xs text-gray-500">
                        {quotation.customer?.name || 'No customer'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-1 rounded ${STATUS_COLORS[quotation.status]}`}>
                    {quotation.status}
                  </span>
                  <span className="text-xs text-gray-500">
                    Valid until: {new Date(quotation.validUntil).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="text-sm text-gray-600">
                    {quotation.lines.length} item{quotation.lines.length !== 1 ? 's' : ''}
                  </div>
                  <div className="text-lg font-bold">${quotation.total.toFixed(2)}</div>
                </div>

                <div className="text-xs text-gray-500">
                  Created: {new Date(quotation.createdAt).toLocaleDateString()}
                </div>

                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(quotation);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete quotation ${quotation.quotationNumber}?`))
                        onDelete(quotation.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
