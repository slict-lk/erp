
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    TrendingUp,
    Users,
    Package,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock
} from 'lucide-react';

interface FunctionResultRendererProps {
    functionName: string;
    result: any;
}

export function FunctionResultRenderer({ functionName, result }: FunctionResultRendererProps) {
    if (!result || result.error) {
        return (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs border border-red-100 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{result?.error || 'Error executing function'}</span>
            </div>
        );
    }

    switch (functionName) {
        case 'get_sales_summary':
            return <SalesSummaryResult result={result} />;
        case 'get_customer_info':
            return <CustomerInfoResult result={result} />;
        case 'search_customers':
            return <CustomerSearchResult result={result} />;
        case 'get_recent_invoices':
            return <InvoicesResult result={result} />;
        case 'get_inventory_status':
            return <InventoryStatusResult result={result} />;
        default:
            return (
                <div className="p-2 bg-gray-50 rounded text-xs font-mono text-gray-500 overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                </div>
            );
    }
}

function SalesSummaryResult({ result }: { result: any }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR'
        }).format(amount);
    };

    return (
        <Card className="p-4 bg-gradient-to-br from-white to-violet-50/50 border-violet-100">
            <div className="flex items-center gap-2 mb-3 text-violet-700 font-medium text-sm">
                <TrendingUp className="h-4 w-4" />
                Sales Summary ({result.period})
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(result.totalRevenue)}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Orders</div>
                    <div className="text-lg font-bold text-gray-900">{result.totalOrders}</div>
                </div>
                <div className="col-span-2 p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                    <div className="text-xs text-gray-500 mb-1">Avg. Order Value</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(result.averageOrderValue)}</div>
                </div>
            </div>
        </Card>
    );
}

function CustomerInfoResult({ result }: { result: any }) {
    return (
        <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-2 mb-3 text-blue-700 font-medium text-sm">
                <Users className="h-4 w-4" />
                Customer Details
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium">{result.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-50">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{result.email}</span>
                </div>
                {result.phone && (
                    <div className="flex justify-between py-1 border-b border-gray-50">
                        <span className="text-gray-500">Phone</span>
                        <span className="font-medium">{result.phone}</span>
                    </div>
                )}
            </div>
        </Card>
    );
}

function CustomerSearchResult({ result }: { result: any[] }) {
    return (
        <Card className="p-3">
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium text-xs uppercase tracking-wider">
                <Users className="h-3 w-3" />
                Found {result.length} Customers
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {result.map((customer: any) => (
                    <div key={customer.id} className="p-2 hover:bg-gray-50 rounded border border-transparent hover:border-gray-100 transition-colors cursor-pointer">
                        <div className="font-medium text-sm text-violet-700">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.email}</div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function InvoicesResult({ result }: { result: any[] }) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR'
        }).format(amount);
    };

    return (
        <Card className="p-3">
            <div className="flex items-center gap-2 mb-2 text-gray-700 font-medium text-xs uppercase tracking-wider">
                <FileText className="h-3 w-3" />
                Recent Invoices
            </div>
            <div className="space-y-2">
                {result.map((invoice: any) => (
                    <div key={invoice.id} className="flex items-center justify-between p-2 bg-gray-50/50 rounded border border-gray-100">
                        <div>
                            <div className="font-medium text-sm">{invoice.number || 'INV-#'}</div>
                            <div className="text-xs text-gray-500">{invoice.customer?.name}</div>
                        </div>
                        <div className="text-right">
                            <div className="font-bold text-sm">{formatCurrency(invoice.total || 0)}</div>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                {invoice.status}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function InventoryStatusResult({ result }: { result: any }) {
    return (
        <Card className="p-4 bg-gradient-to-br from-white to-orange-50/50 border-orange-100">
            <div className="flex items-center gap-2 mb-3 text-orange-700 font-medium text-sm">
                <Package className="h-4 w-4" />
                Inventory Status
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 mb-1">Total Products</div>
                    <div className="text-xl font-bold text-gray-900">{result.totalProducts}</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm text-center">
                    <div className="text-xs text-gray-500 mb-1">Low Stock</div>
                    <div className={`text-xl font-bold ${result.lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {result.lowStockCount}
                    </div>
                </div>
            </div>
            {result.message && (
                <div className="mt-3 text-xs text-gray-500 italic text-center">
                    {result.message}
                </div>
            )}
        </Card>
    );
}
