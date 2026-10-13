# Royal Hires — Industrial Manpower Operations & Payroll System

Android application built with Kotlin and Jetpack Compose (Material Design 3) for industrial factory manpower operations, helper attendance tracking, overtime verification, client billing, and payroll generation in Sri Lanka.

## Core Features & Architecture

### 1. Operations & Domain Modules
- **Dashboard**: Real-time KPI cards (Active Helpers, Attendance %, Pending Overtime, Total Invoiced Revenue), attendance breakdown pill counters, client factory overview, and agency credentials.
- **Helper Shift Attendance**: Daily shift check-in/out, status logging (Present, Half Day, Absent, Leave), meal utilization tracking (Breakfast, Lunch, Dinner), and hostel quarters occupancy.
- **Overtime Verification & Sign-off**: Multi-step OT workflow comparing Worker pay rates (e.g. LKR 350–400/hr) vs Client factory billing rates (e.g. LKR 500–550/hr) with one-tap Admin approvals.
- **Factory Client Agreements**: Client factories (Kelani Textiles, Biyagama Packaging, Katunayake Garments) with strict billing policies:
  - `SAME_RATE_FOR_ALL`: Flat daily helper billing rate.
  - `SEPARATE_MALE_FEMALE_RATES`: Separate daily billing rates for male and female helpers.
- **Helper Workforce Directory**: Sri Lankan factory worker roster with NIC identification, designated as Helpers (clean 1-tier workforce), daily/weekly wage arrangements, and hostel allocations.
- **Hostels & Boarding Quarters**: Quarters management (Kelaniya Agency Quarters, Biyagama FTZ Hostel) with daily deduction rates automatically debited in payroll for resident helpers.
- **Payroll & Pay Slips**: Automated pay run calculation determining gross wages, approved overtime earnings, meal deductions, hostel deductions, advances, and net disbursement.
- **Customer Invoicing**: Generates factory customer invoices locking in attendance rate snapshots, billable days, and client OT billing totals.
- **Payment Receipts**: Records bank transfers (BOC, Commercial Bank) and cheques, allocating receipts across outstanding factory invoices.
- **Financial Analytics & Gross Margins**: Calculates agency revenue vs payroll costs, computing net operating margin.
- **Audit Logging**: Comprehensive, timestamped audit trail of rate changes, OT approvals, and invoice generations.

### 2. Android Native Architecture
- **Language**: Kotlin 2.0.21
- **UI Toolkit**: Jetpack Compose with Material 3 Design
- **State Management**: MVVM Architecture with Kotlin Coroutines `StateFlow`
- **Theme**: Custom Emerald & Forest Green brand palette (`#064B37`, `#087A51`, `#E9F6EF`)
- **Navigation**: Structured Compose navigation with system BackHandler integration

### 3. Build & CI
- Android Gradle Plugin 8.8.2 / SDK 35
- GitHub Actions CI workflow in `.github/workflows/build-android-apk.yml`
