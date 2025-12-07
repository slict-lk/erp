
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard, ShoppingCart, Package, Users, FileText, Calendar, BarChart3, Settings,
  Zap, Globe, Factory, Building2, Mail, MessageSquare, BookOpen, GraduationCap, Home,
  CreditCard, Phone, Store, Hotel, UtensilsCrossed, Heart, Wrench, CheckSquare, ArrowRight,
  ShieldCheck, Sparkles, CloudCog, Menu, X, ChevronRight, Play
} from 'lucide-react';

// --- Data & Constants ---

const HERO_HIGHLIGHTS = [
  {
    icon: ShieldCheck,
    title: 'Enterprise Security',
    description: 'Tenant isolation & audit trails',
  },
  {
    icon: Sparkles,
    title: 'AI Copilots',
    description: 'Smart assistants everywhere',
  },
  {
    icon: CloudCog,
    title: 'Automation First',
    description: 'Self-healing workflows',
  },
];

const STAT_HIGHLIGHTS = [
  { value: '50+', label: 'Business Apps', accent: 'text-blue-600 bg-blue-50', icon: LayoutDashboard },
  { value: '20+', label: 'AI Agents', accent: 'text-purple-600 bg-purple-50', icon: Sparkles },
  { value: '∞', label: 'Multi-Tenancy', accent: 'text-orange-600 bg-orange-50', icon: Globe },
  { value: '99.9%', label: 'Uptime SLA', accent: 'text-green-600 bg-green-50', icon: ShieldCheck },
];

const APP_CATEGORIES = [
  { id: "sales", label: "Sales & CRM", icon: ShoppingCart, color: "blue" },
  { id: "accounting", label: "Finance", icon: FileText, color: "emerald" },
  { id: "inventory", label: "Inventory", icon: Package, color: "violet" },
  { id: "hr", label: "HR & People", icon: Users, color: "orange" },
  { id: "manufacturing", label: "Manufacturing", icon: Factory, color: "amber" },
  { id: "projects", label: "Projects", icon: LayoutDashboard, color: "indigo" },
  { id: "website", label: "Website", icon: Globe, color: "sky" },
  { id: "pos", label: "POS", icon: Store, color: "pink" },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard, color: "cyan" },
  { id: "purchasing", label: "Purchasing", icon: ShoppingCart, color: "teal" },
  { id: "quality", label: "Quality", icon: ShieldCheck, color: "lime" },
  { id: "healthcare", label: "Healthcare", icon: Heart, color: "rose" },
  { id: "education", label: "Education", icon: GraduationCap, color: "yellow" },
  { id: "restaurant", label: "Restaurant", icon: UtensilsCrossed, color: "red" },
  { id: "hotel", label: "Hotel", icon: Hotel, color: "slate" },
  { id: "realestate", label: "Real Estate", icon: Home, color: "zinc" },
  { id: "helpdesk", label: "Helpdesk", icon: MessageSquare, color: "blue" },
  { id: "automation", label: "Automation", icon: Zap, color: "purple" },
  { id: "integrations", label: "Integrations", icon: CloudCog, color: "gray" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, color: "green" },
  { id: "ai", label: "AI & Studio", icon: Sparkles, color: "fuchsia" },
  { id: "contacts", label: "Contacts", icon: Users, color: "blue" },
  { id: "calendar", label: "Calendar", icon: Calendar, color: "red" },
  { id: "livechat", label: "Live Chat", icon: MessageSquare, color: "green" },
  { id: "surveys", label: "Surveys", icon: FileText, color: "orange" },
  { id: "reports", label: "Reports", icon: BarChart3, color: "indigo" },
  { id: "blog", label: "Blog", icon: FileText, color: "pink" },
  { id: "email", label: "Email Mkt", icon: Mail, color: "purple" },
  { id: "events", label: "Events", icon: Calendar, color: "yellow" },
];

const APP_DATA: Record<string, { title: string; apps: { name: string; functions: string[] }[] }> = {
  sales: {
    title: "Sales & CRM",
    apps: [
      { name: "Customer Management", functions: ["Customer database", "Contact management", "Communication history", "Segmentation"] },
      { name: "Lead Management", functions: ["Lead capture", "Scoring", "Conversion", "Kanban pipeline"] },
      { name: "Opportunity Management", functions: ["Sales pipeline", "Forecasting", "Revenue tracking"] },
      { name: "Sales Orders", functions: ["Order creation", "Pricing & discounts", "Workflow"] },
      { name: "Quotations", functions: ["Quote generation", "PDF export", "Email sending"] },
    ]
  },
  accounting: {
    title: "Accounting & Finance",
    apps: [
      { name: "Invoice Management", functions: ["Multi-line invoicing", "Tax calculations", "Payment tracking"] },
      { name: "Payment Processing", functions: ["Reconciliation", "Cash flow tracking", "Bank deposits"] },
      { name: "Account Reports", functions: ["P&L statements", "Balance sheet", "General ledger"] },
      { name: "Expense Management", functions: ["Receipt upload", "Approval workflow", "Reimbursement"] },
    ]
  },
  inventory: {
    title: "Inventory & Operations",
    apps: [
      { name: "Product Management", functions: ["SKU management", "Variants", "Barcode support"] },
      { name: "Warehouse Management", functions: ["Multi-warehouse", "Location tracking", "Stock levels"] },
      { name: "Stock Movements", functions: ["Receipts", "Issues", "Transfers", "Adjustments"] },
    ]
  },
  hr: {
    title: "HR & People",
    apps: [
      { name: "Employee Management", functions: ["Profiles", "Org chart", "History", "Documents"] },
      { name: "Attendance", functions: ["Time clock", "Leave balance", "Overtime", "Shifts"] },
      { name: "Recruitment", functions: ["Job postings", "Applicant tracking", "Interviews"] },
      { name: "Payroll", functions: ["Salary management", "Payslips", "Tax deductions"] },
    ]
  },
  manufacturing: {
    title: "Manufacturing",
    apps: [
      { name: "Bill of Materials", functions: ["BOM creation", "Versioning", "Cost calculation"] },
      { name: "Work Orders", functions: ["Production scheduling", "Material allocation", "Tracking"] },
      { name: "Planning", functions: ["Capacity planning", "Resource allocation", "Optimization"] },
    ]
  },
  projects: {
    title: "Projects",
    apps: [
      { name: "Project Management", functions: ["Planning", "Resource allocation", "Progress tracking"] },
      { name: "Task Tracking", functions: ["Kanban board", "Assignments", "Dependencies"] },
      { name: "Timesheets", functions: ["Time logging", "Billable hours", "Approvals"] },
    ]
  },
  website: {
    title: "Website & Marketing",
    apps: [
      { name: "Website Builder", functions: ["Drag-and-drop", "Templates", "SEO", "CMS"] },
      { name: "eCommerce", functions: ["Product catalog", "Cart", "Checkout", "Payments"] },
    ]
  },
  // ... (Mapping other categories to generic data for brevity in this view, but ensuring all keys exist)
};

// Fill in missing keys with generic data to ensure no crashes, 
// in a real scenario we would populate all.
APP_CATEGORIES.forEach(cat => {
  if (!APP_DATA[cat.id]) {
    APP_DATA[cat.id] = {
      title: cat.label,
      apps: [{ name: `${cat.label} Core`, functions: ["Core functionality", "Management", "Reporting", "Settings"] }]
    };
  }
});


// --- Components ---

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
          <span className="text-xl font-bold text-gray-900 tracking-tight">SLICT<span className="text-blue-600">ERP</span></span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          {['Features', 'Solutions', 'Pricing', 'Resources'].map((item) => (
            <Link key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
              {item}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-700 hover:text-blue-600 hover:bg-blue-50">Sign In</Button>
          </Link>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200">Get Started</Button>
          </Link>
        </div>

        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {['Features', 'Solutions', 'Pricing', 'Resources'].map((item) => (
                <Link key={item} href="#" className="text-base font-medium text-gray-600">
                  {item}
                </Link>
              ))}
              <div className="h-px bg-gray-100 my-2" />
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full justify-center">Sign In</Button>
              </Link>
              <Link href="/login" className="w-full">
                <Button className="w-full justify-center bg-blue-600">Get Started</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-white to-white" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 px-4 py-1.5 rounded-full border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium">
              🚀 New: AI-First Multi-Tenant Architecture
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8"
          >
            The Operating System for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Modern Business</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed"
          >
            Unify your entire organization with SLICT ERP. From CRM to Manufacturing,
            experience a seamless, AI-powered suite designed for scale.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link href="/login">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200/50 transition-all hover:scale-105">
                Start Free Trial <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-all">
                <Play className="mr-2 h-4 w-4 fill-current" /> Live Demo
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left"
          >
            {HERO_HIGHLIGHTS.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/60 backdrop-blur border border-white/20 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="py-20 bg-white border-y border-gray-100">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STAT_HIGHLIGHTS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${stat.accent}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AppExplorer() {
  const [activeTab, setActiveTab] = useState("sales");

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything You Need to Run Your Business</h2>
          <p className="text-lg text-gray-600">
            A complete suite of applications, fully integrated and ready to use.
            Switch between modules to see the power of SLICT ERP.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="flex flex-col md:flex-row min-h-[600px]">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-80 bg-gray-50/50 border-r border-gray-200 p-4 overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-gray-200">
              <div className="space-y-1">
                {APP_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === cat.id
                      ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                  >
                    <cat.icon className={`h-5 w-5 ${activeTab === cat.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 md:p-12 bg-white">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-blue-100 rounded-2xl">
                      {(() => {
                        const Icon = APP_CATEGORIES.find(c => c.id === activeTab)?.icon || LayoutDashboard;
                        return <Icon className="h-8 w-8 text-blue-600" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{APP_DATA[activeTab]?.title}</h3>
                      <p className="text-gray-500">Comprehensive tools for your team</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {APP_DATA[activeTab]?.apps.map((app, idx) => (
                      <Card key={idx} className="border border-gray-100 hover:border-blue-100 hover:shadow-lg transition-all group">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2 group-hover:text-blue-600 transition-colors">
                            <CheckSquare className="h-5 w-5 text-blue-500" />
                            {app.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {app.functions.map((func, fIdx) => (
                              <li key={fIdx} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 group-hover:bg-blue-400 transition-colors" />
                                {func}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Pricing Calculator Component ---

function PricingCalculator() {
  const [numUsers, setNumUsers] = useState(5);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedApps, setSelectedApps] = useState<string[]>([]);

  const baseUserPrice = 12; // $12 per user
  const appPrice = 4; // $4 per app

  // Odoo-style: First app is often free, or bundled. Let's do a simple calculation.
  // If > 10 apps, cap the app cost (Enterprise bundle logic)
  const isEnterprise = selectedApps.length > 10;

  const totalAppCost = isEnterprise ? 40 : selectedApps.length * appPrice;
  const userCost = numUsers * baseUserPrice;

  const monthlyTotal = userCost + totalAppCost;
  const finalPrice = billingCycle === 'yearly' ? monthlyTotal * 0.8 : monthlyTotal; // 20% discount for yearly

  const toggleApp = (appId: string) => {
    setSelectedApps(prev =>
      prev.includes(appId) ? prev.filter(id => id !== appId) : [...prev, appId]
    );
  };

  const selectAllApps = () => {
    if (selectedApps.length === APP_CATEGORIES.length) {
      setSelectedApps([]);
    } else {
      setSelectedApps(APP_CATEGORIES.map(c => c.id));
    }
  };

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 rounded-full border-green-200 bg-green-50 text-green-700 text-sm font-medium">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Build Your Perfect Plan</h2>
          <p className="text-lg text-gray-600">
            Pay only for what you use. Add apps as you grow.
            <span className="font-medium text-blue-600"> No hidden fees.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* App Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-xl">Select Apps</CardTitle>
                  <CardDescription>Choose the modules you need</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={selectAllApps}>
                  {selectedApps.length === APP_CATEGORIES.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {APP_CATEGORIES.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => toggleApp(app.id)}
                      className={`cursor-pointer p-3 rounded-lg border flex items-center gap-3 transition-all ${selectedApps.includes(app.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`p-1.5 rounded-md ${selectedApps.includes(app.id) ? 'bg-blue-200' : 'bg-gray-100'}`}>
                        <app.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{app.label}</span>
                      {selectedApps.includes(app.id) && <CheckSquare className="h-4 w-4 ml-auto" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Number of Users</CardTitle>
                <CardDescription>How many people will use the system?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">{numUsers} Users</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => setNumUsers(Math.max(1, numUsers - 1))}>-</Button>
                      <Button variant="outline" size="icon" onClick={() => setNumUsers(numUsers + 1)}>+</Button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={numUsers}
                    onChange={(e) => setNumUsers(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>1 User</span>
                    <span>50 Users</span>
                    <span>100+ Users</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="bg-gray-900 text-white border-none shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

                <CardHeader>
                  <CardTitle className="text-2xl">Estimated Cost</CardTitle>
                  <CardDescription className="text-gray-400">Billed {billingCycle}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 relative z-10">
                  <div className="flex bg-gray-800 p-1 rounded-lg mb-6">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${billingCycle === 'monthly' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${billingCycle === 'yearly' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      Yearly (-20%)
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>{numUsers} Users x ${baseUserPrice}</span>
                      <span>${userCost}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>{selectedApps.length} Apps {isEnterprise && '(Capped)'}</span>
                      <span>${totalAppCost}</span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="flex justify-between text-green-400">
                        <span>Yearly Discount</span>
                        <span>-20%</span>
                      </div>
                    )}
                    <div className="h-px bg-gray-700 my-2" />
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-medium">Total / Month</span>
                      <span className="text-4xl font-bold">${finalPrice.toFixed(0)}</span>
                    </div>
                  </div>

                  <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 mt-4">
                    Start Free Trial
                  </Button>
                  <p className="text-xs text-center text-gray-500 mt-4">
                    14-day free trial. No credit card required.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 bg-gray-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Ready to transform your business?</h2>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Join thousands of companies using SLICT ERP to streamline operations and drive growth.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/login">
            <Button size="lg" className="h-14 px-8 text-lg bg-white text-gray-900 hover:bg-gray-100 rounded-full">
              Get Started Now
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-gray-700 text-white hover:bg-gray-800 rounded-full">
              Contact Sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-50 pt-20 pb-10 border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
              <span className="text-xl font-bold text-gray-900">SLICT<span className="text-blue-600">ERP</span></span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              The most complete multi-tenant ERP solution for modern enterprises.
              Built with Next.js, Prisma, and Tailwind.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-600" />
                <a href="mailto:team@slict.lk" className="hover:text-blue-600">team@slict.lk</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-600" />
                <a href="https://wa.me/94752539988" className="hover:text-blue-600">WhatsApp: +94 75 253 8899</a>
              </div>
            </div>
          </div>

          {[
            { title: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
            { title: "Company", links: ["About Us", "Careers", "Blog", "Contact"] },
            { title: "Resources", links: ["Documentation", "Help Center", "Community", "API Reference"] },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold text-gray-900 mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map(link => (
                  <li key={link}>
                    <Link href={link === 'Contact' ? '/contact' : link === 'Pricing' ? '#pricing' : '#'} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2025 SLICT ERP. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-400 hover:text-gray-600"><Globe className="h-5 w-5" /></Link>
            <Link href="#" className="text-gray-400 hover:text-gray-600"><MessageSquare className="h-5 w-5" /></Link>
            <Link href="#" className="text-gray-400 hover:text-gray-600"><Mail className="h-5 w-5" /></Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white font-sans selection:bg-blue-100">
      <Navbar />
      <Hero />
      <Stats />
      <AppExplorer />
      <PricingCalculator />
      <CTA />
      <Footer />
    </main>
  );
}
