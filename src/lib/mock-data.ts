
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  quantity: number;
}

export interface Sale {
  id: string;
  date: string;
  invoiceNumber: string;
  items: { productId: string; name: string; quantity: number; price: number }[];
  totalAmount: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierName: string;
  productId: string;
  productName: string;
  quantity: number;
  purchasePrice: number;
}

export interface Expense {
  id: string;
  name: string;
  category: string;
  amount: number;
  date: string;
}

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'Premium Coffee Beans', sku: 'COF-001', category: 'Beverages', purchasePrice: 12.50, sellingPrice: 24.99, quantity: 45 },
  { id: '2', name: 'Organic Green Tea', sku: 'TEA-002', category: 'Beverages', purchasePrice: 8.00, sellingPrice: 15.50, quantity: 8 },
  { id: '3', name: 'Stainless Steel Kettle', sku: 'KIT-003', category: 'Kitchenware', purchasePrice: 25.00, sellingPrice: 49.99, quantity: 15 },
  { id: '4', name: 'Ceramic Mug Set', sku: 'KIT-004', category: 'Kitchenware', purchasePrice: 15.00, sellingPrice: 29.99, quantity: 3 },
  { id: '5', name: 'French Press', sku: 'KIT-005', category: 'Kitchenware', purchasePrice: 20.00, sellingPrice: 39.99, quantity: 22 },
];

export const MOCK_SALES: Sale[] = [
  { id: 's1', date: '2023-11-20', invoiceNumber: 'INV-1001', totalAmount: 74.98, items: [{ productId: '1', name: 'Premium Coffee Beans', quantity: 3, price: 24.99 }] },
  { id: 's2', date: '2023-11-21', invoiceNumber: 'INV-1002', totalAmount: 49.99, items: [{ productId: '3', name: 'Stainless Steel Kettle', quantity: 1, price: 49.99 }] },
  { id: 's3', date: '2023-11-22', invoiceNumber: 'INV-1003', totalAmount: 31.00, items: [{ productId: '2', name: 'Organic Green Tea', quantity: 2, price: 15.50 }] },
];

export const MOCK_PURCHASES: Purchase[] = [
  { id: 'p1', date: '2023-11-15', supplierName: 'Global Beans Inc.', productId: '1', productName: 'Premium Coffee Beans', quantity: 50, purchasePrice: 12.50 },
  { id: 'p2', date: '2023-11-16', supplierName: 'Tea Leaf Distro', productId: '2', productName: 'Organic Green Tea', quantity: 20, purchasePrice: 8.00 },
];

export const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', name: 'Monthly Rent', category: 'Rent', amount: 1200, date: '2023-11-01' },
  { id: 'e2', name: 'Electricity Bill', category: 'Utilities', amount: 150, date: '2023-11-05' },
  { id: 'e3', name: 'Internet Subscription', category: 'Utilities', amount: 60, date: '2023-11-05' },
  { id: 'e4', name: 'Office Supplies', category: 'Supplies', amount: 45, date: '2023-11-12' },
];
