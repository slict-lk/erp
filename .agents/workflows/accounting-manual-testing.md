---
description: Manual QA verification and real-world testing guide for the Accounting Module
---

# Accounting Module — Manual Testing Workflow

> This guide walks you through **every tab** in the Accounting module with **real-world mock data** so you can verify functionality end-to-end — even if you've never used accounting software before.

---

## Prerequisites

1. The app is running locally (`pnpm dev`) or on a deployed URL.
2. You are logged in as **SLICT Team / ADMIN**.
3. Navigate to **Accounting** in the sidebar.

---

## 🗺️ Module Overview (7 Tabs)

| # | Tab | What It Does |
|---|-----|-------------|
| 1 | **Overview** | Dashboard with KPI cards, recent invoices & payments |
| 2 | **Invoices** | Create and manage Sales & Purchase invoices |
| 3 | **Payments** | Record payments against invoices |
| 4 | **Chart of Accounts** | Define your ledger structure (Assets, Liabilities, etc.) |
| 5 | **Journal Entries** | Manual double-entry bookkeeping entries |
| 6 | **Bank Rec.** | Upload bank statements and match with ledger |
| 7 | **Reports** | Financial reports: P&L, Balance Sheet, Trial Balance, AR Aging |

---

## 📋 Test Scenario: "SLICT Auto Parts — First Month of Operations"

You are the accountant for **SLICT Auto Parts**, a Sri Lankan spare parts company. It's your first month. You need to:
1. Set up accounts
2. Record a sale and a purchase
3. Record payments
4. Make a journal entry for rent
5. Upload a bank statement
6. Generate financial reports

---

## Step 1: Chart of Accounts — Set Up Your Ledger

**Navigate to:** Sidebar → Accounting → **Chart of Accounts**

Click **"Add Account"** and create these accounts one by one:

| Code | Account Name | Type | Normal Balance | Currency | Description |
|------|-------------|------|----------------|----------|------------|
| `1000` | Cash in Hand | ASSET | DEBIT | LKR | Petty cash & register |
| `1010` | Commercial Bank | ASSET | DEBIT | LKR | Main business bank account |
| `1200` | Accounts Receivable | ASSET | DEBIT | LKR | Money owed by customers |
| `2000` | Accounts Payable | LIABILITY | CREDIT | LKR | Money owed to suppliers |
| `2100` | VAT Payable | LIABILITY | CREDIT | LKR | Tax collected on sales |
| `3000` | Owner's Equity | EQUITY | CREDIT | LKR | Owner capital investment |
| `4000` | Sales Revenue | REVENUE | CREDIT | LKR | Income from spare parts |
| `5000` | Cost of Goods Sold | EXPENSE | DEBIT | LKR | Parts purchased for resale |
| `5100` | Rent Expense | EXPENSE | DEBIT | LKR | Monthly shop rent |
| `5200` | Utilities Expense | EXPENSE | DEBIT | LKR | Electricity, water, internet |

**✅ Expected:** All 10 accounts appear in the table. You can search by code or name.

---

## Step 2: Invoices — Create a Sales Invoice

**Navigate to:** Sidebar → Accounting → **Invoices**

Click **"Create Invoice"** and fill in:

| Field | Value |
|-------|-------|
| Type | **SALES** |
| Period | *(select the current open period, or any available)* |
| Customer | **Walk-in Customer** (or any available customer) |
| Issue Date | `2026-02-01` |
| Due Date | `2026-03-01` |
| Invoice Lines | |
| → Description | `Brake pads — Toyota Corolla` |
| → Quantity | `4` |
| → Unit Price | `2500` |
| → Tax % | `0` |

**Total should be:** LKR 10,000.00

Click **Save**. You should see the invoice in the table with status **DRAFT** or **OPEN**.

### Test 2b: Create a Purchase Invoice

Click **"Create Invoice"** again:

| Field | Value |
|-------|-------|
| Type | **PURCHASE** |
| Period | *(select current period)* |
| Vendor | **General Supplier** (or any available vendor) |
| Issue Date | `2026-02-01` |
| Due Date | `2026-02-28` |
| Invoice Lines | |
| → Description | `Bulk brake pads order — 50 units` |
| → Quantity | `50` |
| → Unit Price | `1500` |
| → Tax % | `0` |

**Total should be:** LKR 75,000.00

**✅ Expected:** Two invoices visible in the list. You can search by number or filter by type.

---

## Step 3: Payments — Record Customer Payment

**Navigate to:** Sidebar → Accounting → **Payments**

Click **"Record Payment"** and fill in:

### Payment 1: Customer pays for the sales invoice

| Field | Value |
|-------|-------|
| Type | **Received** |
| Amount | `10000` |
| Method | **Bank Transfer** |
| Payment Date | `2026-02-05` |
| Reference | `TT-20260205-001` |
| Customer | Walk-in Customer |
| Invoice | *(select the sales invoice you created)* |

### Payment 2: You pay the supplier

Click **"Record Payment"** again:

| Field | Value |
|-------|-------|
| Type | **Sent** |
| Amount | `75000` |
| Method | **Cheque** |
| Payment Date | `2026-02-10` |
| Reference | `CHQ-4521` |
| Vendor | General Supplier |

**✅ Expected:** Two payments visible. The invoices should update their status (OPEN → PAID) if the amounts match.

---

## Step 4: Journal Entries — Record Rent Payment

**Navigate to:** Sidebar → Accounting → **Journal Entries**

This is double-entry bookkeeping. Every entry must have **Debits = Credits**.

Click **"New Journal Entry"** and fill in:

| Field | Value |
|-------|-------|
| Period | *(current open period)* |
| Date | `2026-02-15` |
| Reference | `JE-RENT-FEB` |
| Memo | `Monthly rent payment for shop premises` |

**Journal Lines:**

| # | Account | Description | Debit (LKR) | Credit (LKR) |
|---|---------|-------------|-------------|--------------|
| 1 | `5100 - Rent Expense` | Feb 2026 shop rent | `45000` | `0` |
| 2 | `1010 - Commercial Bank` | Bank payment for rent | `0` | `45000` |

The totals bar at the bottom should show:
- **Total Debits:** 45,000
- **Total Credits:** 45,000
- **Status:** ✅ Balanced

Click **"Post Entry"**.

### Test 4b: Another Journal Entry — Utilities

| Field | Value |
|-------|-------|
| Period | *(current)* |
| Date | `2026-02-20` |
| Reference | `JE-UTIL-FEB` |
| Memo | `Electricity and internet for February` |

| # | Account | Description | Debit | Credit |
|---|---------|-------------|-------|--------|
| 1 | `5200 - Utilities Expense` | CEB electricity bill | `8500` | `0` |
| 2 | `5200 - Utilities Expense` | Dialog internet | `3500` | `0` |
| 3 | `1010 - Commercial Bank` | Bank payment | `0` | `12000` |

**✅ Expected:** Both entries appear in the list. Entries show "POSTED" status. The balanced indicator is green.

---

## Step 5: Bank Reconciliation — Upload a Statement

**Navigate to:** Sidebar → Accounting → **Bank Rec.**

Click **"Upload Statement"** and select a file from your computer.

> **Accepted formats:** CSV, PDF, XLS, XLSX, or image files.  
> For testing, you can use any small CSV or image file — the system uploads it to Cloudinary.

**✅ Expected:** 
- A toast notification appears: "Statement uploaded successfully"
- After ~1.5 seconds, a second toast: "Parsed 12 transactions from statement"
- The upload button resets and is ready for another file

> **Note:** The Auto-Match button is a placeholder for future AI-powered matching.

---

## Step 6: Reports — Generate Financial Reports

**Navigate to:** Sidebar → Accounting → **Reports**

### Tab 1: Profit & Loss

| Setting | Value |
|---------|-------|
| Start Date | `2026-02-01` |
| End Date | `2026-02-28` |

**✅ Expected:** 
- **Revenue** section shows Sales Revenue
- **Expenses** section shows Rent + Utilities
- **Net Income** = Revenue − Expenses (highlighted in green/red)

### Tab 2: Balance Sheet

| Setting | Value |
|---------|-------|
| End Date (As Of) | `2026-02-28` |

**✅ Expected:** Shows Assets, Liabilities, and Equity sections.

### Tab 3: Trial Balance

| Setting | Value |
|---------|-------|
| End Date (As Of) | `2026-02-28` |

**✅ Expected:** Lists all accounts with their debit/credit totals. Total Debits should equal Total Credits.

### Tab 4: AR Aging

| Setting | Value |
|---------|-------|
| End Date (As Of) | `2026-02-28` |

**✅ Expected:** Shows outstanding invoices grouped by aging buckets (Current, 30, 60, 90+ days).

### Export

Click the **"Export"** button → Your browser's print dialog should open. You can save as PDF.

### More Filters

Click **"More Filters"** → A toast should appear explaining that filtering is managed via the date pickers.

**✅ Expected:** Both buttons respond with visible feedback.

---

## Step 7: Overview Dashboard — Final Verification

**Navigate to:** Sidebar → Accounting → **Overview**

**✅ Expected:**
- KPI cards show updated totals (Revenue, Expenses, Receivables, Payables)
- Recent Invoices table shows your 2 invoices
- Recent Payments table shows your 2 payments
- Quick action links work (Create Invoice, Record Payment, etc.)

---

## 🧪 Edge Case Tests

| Test | Steps | Expected |
|------|-------|----------|
| **Empty state** | Visit Chart of Accounts with no data | "No accounts found" or empty table displays cleanly |
| **Unbalanced JE** | Create a Journal Entry where Debits ≠ Credits | The "Post" button should be disabled; a red "unbalanced" indicator appears |
| **Duplicate account code** | Try adding two accounts with code `1000` | Server should return an error toast |
| **Search** | Type "brake" in the Invoices search bar | Only the brake pads invoice should appear |
| **Large numbers** | Create an invoice for LKR 999,999,999 | Numbers should format correctly with commas |
| **Empty upload** | Click Upload Statement without selecting a file | Nothing should happen (no crash) |

---

## 📊 Complete Mock Data Reference

### Customers (if you need to add via Sales module)
| Name | Email | Phone |
|------|-------|-------|
| Kamal Perera | kamal@example.com | +94 77 123 4567 |
| Nimal Fernando | nimal@example.com | +94 76 234 5678 |
| Chamari Silva | chamari@example.com | +94 71 345 6789 |

### Vendors (if you need to add via Purchasing module)
| Name | Email | Phone |
|------|-------|-------|
| Toyota Lanka Parts | parts@toyotalanka.lk | +94 11 234 5678 |
| ABC Auto Supplies | sales@abcauto.lk | +94 11 345 6789 |
| Nippon Parts International | info@nipponparts.jp | +81 3 1234 5678 |

### Sample Invoice Lines (for variety)
| Description | Qty | Unit Price (LKR) |
|-------------|-----|------------------|
| Brake pads — Toyota Corolla | 4 | 2,500 |
| Oil filter — Honda Civic | 10 | 450 |
| Timing belt kit — Suzuki Swift | 2 | 8,750 |
| Spark plugs (set of 4) — Universal | 20 | 320 |
| Air filter — Mitsubishi Lancer | 6 | 1,200 |
| Clutch plate — Nissan Sunny | 1 | 15,500 |

### Sample Journal Entry Scenarios
| Scenario | Debit Account | Credit Account | Amount (LKR) |
|----------|---------------|----------------|-------------|
| Pay rent | 5100 Rent Expense | 1010 Commercial Bank | 45,000 |
| Pay utilities | 5200 Utilities | 1010 Commercial Bank | 12,000 |
| Owner invests capital | 1010 Commercial Bank | 3000 Owner's Equity | 500,000 |
| Record sale on credit | 1200 Accounts Receivable | 4000 Sales Revenue | 25,000 |
| Record COGS | 5000 Cost of Goods Sold | 1000 Cash in Hand | 15,000 |
