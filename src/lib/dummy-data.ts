/**
 * Dummy medicine products for seeding the test account.
 */
export const DUMMY_MEDICINES = [
  { productName: "Paracetamol 500mg", sku: "PARA-001", category: "Analgesic", purchasePrice: 12.5, sellingPrice: 25.0, gstRate: 5, currentQuantity: 150 },
  { productName: "Amoxicillin 250mg", sku: "AMOX-002", category: "Antibiotic", purchasePrice: 45.0, sellingPrice: 85.0, gstRate: 12, currentQuantity: 80 },
  { productName: "Ibuprofen 400mg", sku: "IBU-003", category: "NSAID", purchasePrice: 18.0, sellingPrice: 35.0, gstRate: 5, currentQuantity: 120 },
  { productName: "Cetirizine 10mg", sku: "CET-004", category: "Antihistamine", purchasePrice: 8.0, sellingPrice: 15.0, gstRate: 5, currentQuantity: 200 },
  { productName: "Metformin 500mg", sku: "MET-005", category: "Anti-Diabetic", purchasePrice: 22.0, sellingPrice: 40.0, gstRate: 5, currentQuantity: 300 },
  { productName: "Atorvastatin 20mg", sku: "ATOR-006", category: "Statin", purchasePrice: 55.0, sellingPrice: 110.0, gstRate: 12, currentQuantity: 45 },
  { productName: "Omeprazole 20mg", sku: "OME-007", category: "Antacid", purchasePrice: 15.0, sellingPrice: 30.0, gstRate: 5, currentQuantity: 180 },
  { productName: "Amlodipine 5mg", sku: "AMLO-008", category: "Blood Pressure", purchasePrice: 10.0, sellingPrice: 20.0, gstRate: 5, currentQuantity: 250 },
  { productName: "Azithromycin 500mg", sku: "AZI-009", category: "Antibiotic", purchasePrice: 65.0, sellingPrice: 125.0, gstRate: 12, currentQuantity: 30 },
  { productName: "Pantoprazole 40mg", sku: "PAN-010", category: "Antacid", purchasePrice: 14.0, sellingPrice: 28.0, gstRate: 5, currentQuantity: 140 },
  { productName: "Ciprofloxacin 500mg", sku: "CIP-011", category: "Antibiotic", purchasePrice: 40.0, sellingPrice: 75.0, gstRate: 12, currentQuantity: 60 },
  { productName: "Losartan 50mg", sku: "LOS-012", category: "Blood Pressure", purchasePrice: 28.0, sellingPrice: 55.0, gstRate: 5, currentQuantity: 90 },
  { productName: "Vitamin D3 60k", sku: "VIT-013", category: "Supplements", purchasePrice: 120.0, sellingPrice: 220.0, gstRate: 18, currentQuantity: 50 },
  { productName: "Multivitamin Gold", sku: "VIT-014", category: "Supplements", purchasePrice: 180.0, sellingPrice: 350.0, gstRate: 18, currentQuantity: 25 },
  { productName: "Insulin Glargine", sku: "INS-015", category: "Anti-Diabetic", purchasePrice: 450.0, sellingPrice: 600.0, gstRate: 5, currentQuantity: 12 },
];

/**
 * Dummy expenses for seeding the test account.
 */
export const DUMMY_EXPENSES = [
  { expenseName: "Shop Rent - January", category: "Rent", amount: 15000, date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString() },
  { expenseName: "Electricity Bill", category: "Utilities", amount: 2450, date: new Date(new Date().getFullYear(), new Date().getMonth(), 5).toISOString() },
  { expenseName: "Water & Maintenance", category: "Utilities", amount: 800, date: new Date(new Date().getFullYear(), new Date().getMonth(), 10).toISOString() },
  { expenseName: "Pharmacist Assistant Salary", category: "Other", amount: 12000, date: new Date(new Date().getFullYear(), new Date().getMonth(), 3).toISOString() },
  { expenseName: "Marketing Flyers", category: "Marketing", amount: 1500, date: new Date(new Date().getFullYear(), new Date().getMonth(), 12).toISOString() },
];

/**
 * Helper to generate a dummy purchase
 */
export const getDummyPurchases = (userId: string, products: any[]) => {
  return [
    {
      supplierName: "Apex Pharma Distributors",
      productId: products[0]?.id || "para-id",
      productName: "Paracetamol 500mg",
      quantity: 100,
      purchasePrice: 12.5,
      gstRate: 5,
      gstAmount: (100 * 12.5) * 0.05,
      date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
      voucherNumber: "PUR-100201"
    },
    {
      supplierName: "LifeCare Wholesale",
      productId: products[1]?.id || "amox-id",
      productName: "Amoxicillin 250mg",
      quantity: 50,
      purchasePrice: 45.0,
      gstRate: 12,
      gstAmount: (50 * 45.0) * 0.12,
      date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
      voucherNumber: "PUR-100202"
    }
  ];
};

/**
 * Helper to generate dummy sales
 */
export const getDummySales = (userId: string, products: any[]) => {
  const date1 = new Date();
  const date2 = new Date(new Date().setDate(new Date().getDate() - 2));

  return [
    {
      invoiceNumber: "INV-998821",
      date: date1.toISOString(),
      totalAmount: 157.5, // (5 * 25) + (5% GST) + (1 * 85) + (12% GST) roughly
      totalTax: 13.5,
      items: [
        { productId: products[0]?.id || "id1", name: "Paracetamol 500mg", quantity: 2, price: 25.0, gstRate: 5, gstAmount: 2.5 },
        { productId: products[1]?.id || "id2", name: "Amoxicillin 250mg", quantity: 1, price: 85.0, gstRate: 12, gstAmount: 10.2 }
      ]
    },
    {
      invoiceNumber: "INV-998822",
      date: date2.toISOString(),
      totalAmount: 420.0,
      totalTax: 70.0,
      items: [
        { productId: products[12]?.id || "id13", name: "Vitamin D3 60k", quantity: 2, price: 220.0, gstRate: 18, gstAmount: 79.2 }
      ]
    }
  ];
};
