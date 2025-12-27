"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, User, Calendar, Package, DollarSign, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceItem {
    id: string;
    productName: string;
    productSku: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    discountAmount: number;
    lineTotal: number;
}

interface Invoice {
    id: string;
    invoiceNumber: string;
    customer: { name: string; phone: string; email: string | null } | null;
    customerName: string | null;
    customerPhone: string | null;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    paidAmount: number;
    dueAmount: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    items: InvoiceItem[];
    payments: Array<{
        id: string;
        amount: number;
        method: string;
        createdAt: string;
    }>;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
    }).format(amount);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await fetch(`/api/spareparts/invoices/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setInvoice(data.invoice);
                } else {
                    console.error('Invoice not found');
                }
            } catch (error) {
                console.error('Error fetching invoice:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [params.id]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        if (!invoice) return;

        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text('SALES INVOICE', 105, 15, { align: 'center' });

        // Add invoice details
        doc.setFontSize(12);
        doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, 30);
        doc.text(`Date: ${formatDate(invoice.createdAt)}`, 20, 38);
        doc.text(`Status: ${invoice.status}`, 20, 46);
        doc.text(`Payment: ${invoice.paymentStatus}`, 20, 54);

        // Add customer info
        doc.setFontSize(14);
        doc.text('Customer Information', 20, 68);
        doc.setFontSize(10);
        doc.text(`Name: ${invoice.customer?.name || invoice.customerName || 'Walk-in Customer'}`, 20, 76);
        if (invoice.customer?.phone || invoice.customerPhone) {
            doc.text(`Phone: ${invoice.customer?.phone || invoice.customerPhone}`, 20, 82);
        }
        if (invoice.customer?.email) {
            doc.text(`Email: ${invoice.customer.email}`, 20, 88);
        }

        // Add items table
        const tableData = invoice.items.map(item => [
            item.productName,
            item.productSku,
            item.quantity.toString(),
            formatCurrency(Number(item.unitPrice)),
            item.discountPercent > 0 ? `${item.discountPercent}%` : '-',
            formatCurrency(Number(item.lineTotal))
        ]);

        autoTable(doc, {
            startY: 100,
            head: [['Product', 'SKU', 'Qty', 'Unit Price', 'Discount', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [71, 85, 105] },
            styles: { fontSize: 9 }
        });

        // Add totals
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text(`Subtotal: ${formatCurrency(Number(invoice.subtotal))}`, 140, finalY);

        if (invoice.discountAmount > 0) {
            doc.text(`Discount: -${formatCurrency(Number(invoice.discountAmount))}`, 140, finalY + 6);
        }
        if (invoice.taxAmount > 0) {
            doc.text(`Tax: ${formatCurrency(Number(invoice.taxAmount))}`, 140, finalY + 12);
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${formatCurrency(Number(invoice.total))}`, 140, finalY + 20);
        doc.text(`Paid: ${formatCurrency(Number(invoice.paidAmount))}`, 140, finalY + 28);

        if (invoice.dueAmount > 0) {
            doc.text(`Due: ${formatCurrency(Number(invoice.dueAmount))}`, 140, finalY + 36);
        }

        // Save the PDF
        doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="text-center py-8">Loading...</div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-6">
                <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-500">Invoice not found</p>
                    <Link href="/spareparts/sales">
                        <Button className="mt-4">Back to Sales</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, string> = {
            DRAFT: 'secondary',
            CONFIRMED: 'default',
            COMPLETED: 'default',
            CANCELLED: 'destructive',
        };
        return <Badge variant={variants[status] as any}>{status}</Badge>;
    };

    const getPaymentStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            PAID: 'text-green-600 border-green-600',
            PARTIAL: 'text-orange-600 border-orange-600',
            UNPAID: 'text-red-600 border-red-600',
        };
        return <Badge variant="outline" className={colors[status]}>{status}</Badge>;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/spareparts/sales">
                        <Button variant="ghost" size="sm" className="mb-2">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sales
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {invoice.invoiceNumber}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {formatDate(invoice.createdAt)}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Customer Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-gray-500">Name</p>
                                <p className="font-medium">
                                    {invoice.customer?.name || invoice.customerName || 'Walk-in Customer'}
                                </p>
                            </div>
                            {invoice.customer?.phone || invoice.customerPhone ? (
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{invoice.customer?.phone || invoice.customerPhone}</p>
                                </div>
                            ) : null}
                            {invoice.customer?.email ? (
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{invoice.customer.email}</p>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Items ({invoice.items.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Discount</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoice.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{item.productName}</p>
                                                    <p className="text-sm text-gray-500">{item.productSku}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{Number(item.quantity)}</TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(Number(item.unitPrice))}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {item.discountPercent > 0
                                                    ? `${item.discountPercent}% (${formatCurrency(Number(item.discountAmount))})`
                                                    : '-'
                                                }
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(Number(item.lineTotal))}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    {invoice.payments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Payment History
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {invoice.payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{formatDate(payment.createdAt)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{payment.method}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(Number(payment.amount))}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Summary Sidebar */}
                <div>
                    <Card className="sticky top-6">
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Status</span>
                                    {getStatusBadge(invoice.status)}
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Payment</span>
                                    {getPaymentStatusBadge(invoice.paymentStatus)}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{formatCurrency(Number(invoice.subtotal))}</span>
                                </div>
                                {invoice.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Discount</span>
                                        <span className="text-red-600">
                                            -{formatCurrency(Number(invoice.discountAmount))}
                                        </span>
                                    </div>
                                )}
                                {invoice.taxAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Tax</span>
                                        <span>{formatCurrency(Number(invoice.taxAmount))}</span>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(Number(invoice.total))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Paid</span>
                                    <span className="text-green-600">
                                        {formatCurrency(Number(invoice.paidAmount))}
                                    </span>
                                </div>
                                {invoice.dueAmount > 0 && (
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-gray-500">Due</span>
                                        <span className="text-red-600">
                                            {formatCurrency(Number(invoice.dueAmount))}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
