// Sales & CRM Module Types
export interface SalesOrder {
  id: string;
  orderNumber: string;
  status: 'DRAFT' | 'CONFIRMED' | 'IN_PROGRESS' | 'DELIVERED' | 'CANCELLED';
  customerId: string;
  orderDate: Date;
  deliveryDate?: Date;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  lines: SalesOrderLine[];
}

export interface SalesOrderLine {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  subtotal: number;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: 'NEW' | 'QUALIFIED' | 'PROPOSITION' | 'WON' | 'LOST';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expectedRevenue?: number;
  probability?: number;
  customerId?: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  taxId?: string;
  website?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  customerId: string;
  validUntil: Date;
  subtotal: number;
  tax: number;
  total: number;
}
