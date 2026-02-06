# BizManager - Pharmaceutical Business & GST Management System

BizManager is a specialized ERP solution designed for small-scale pharmaceutical retailers and distributors. It simplifies inventory management, automates GST-compliant billing, and provides real-time financial insights into business profitability and tax liabilities.

## 🚀 Key Features

### 1. Dashboard Overview
- **Real-time Metrics**: Track Total Sales, Expenses, Stock Value, and Low Stock alerts on a single screen.
- **Activity Feed**: Quick view of recent transactions and inventory alerts.

### 2. Inventory Management
- **Product Registry**: Manage pharmaceutical products with SKU/Batch tracking.
- **Dynamic GST Assignment**: Assign tax categories (0%, 5%, 12%, 18%) per product.
- **Low Stock Alerts**: Automatic visual indicators when stock falls below safety thresholds.
- **CRUD Operations**: Full ability to add, edit, and delete products with automatic audit logging.

### 3. Sales & GST Billing
- **Point of Sale (POS)**: Intuitive catalog-based cart system for fast checkouts.
- **Automated Tax Calculation**: GST is calculated per item based on its specific rate at the moment of sale.
- **Professional Tax Invoices**: Generates printable, government-compliant tax invoices with detailed CGST/SGST breakdowns.

### 4. Purchase & Procurement
- **Stock replenishment**: Record purchases from suppliers to automatically increase inventory levels.
- **Voucher Generation**: Produces formal procurement vouchers for every incoming batch.
- **Input Tax Credit (ITC) Tracking**: Records GST paid to suppliers to offset future tax liabilities.

### 5. Financial Reports & Analytics
- **GST Liability Computation**: Calculates `GST Collected (Output)` - `GST Paid (Input Credit)` to determine the net payable amount.
- **Profit & Loss (P&L)**: Real-time income statements excluding tax components for accurate margin analysis.
- **Timeframe Filtering**: View reports for "This Month", "This Year", or "All Time".
- **Inventory Valuation**: Current asset value based on purchase costs.

### 6. Activity Auditing (Security)
- **Comprehensive Logging**: Every login, logout, sale, purchase, expense, and inventory change is recorded in a secure audit log.
- **Traceability**: Audit logs include metadata such as associated invoice numbers or product names.

---

## ⚖️ GST Tax Structure (Pharmaceutical)

The system is pre-configured with the standard pharmaceutical GST slabs:

| Slab | Category | Description |
| :--- | :--- | :--- |
| **0%** | Exempt | Life-saving drugs (e.g., cancer, TB, HIV/AIDS) and essential medicines. |
| **5%** | General | Most prescription medicines, allopathic, ayurvedic, and standard formulations. |
| **12%** | Bulk/Specific | Certain bulk drugs, APIs, and non-essential formulations. |
| **18%** | Supplements | Nutraceuticals, dietary supplements, protein powders, etc. |

---

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & ShadCN UI
- **Backend**: Firebase (Firestore, Authentication)
- **Real-time**: Firebase SDK for live data synchronization
- **Icons**: Lucide React
- **Date Handling**: date-fns

---

## 📊 Data Architecture

The application uses a flat, high-performance Firestore structure:

- `products`: Master product list with current stock levels.
- `sales`: Historical transaction records with itemized snapshots.
- `purchases`: Procurement history and supplier records.
- `expenses`: Operational cost tracking.
- `logs`: Immutable audit trails.

## 🔐 Security

- **Multi-Tenant Isolation**: Users only see data where `ownerId` matches their UID.
- **Permission Errors**: Integrated error emitter that catches and displays Firestore security rule violations during development.
- **Audit Integrity**: Activity logs are write-only for users to prevent tampering with business history.
