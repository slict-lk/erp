
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Calendar,
  Settings,
  Factory,
  CreditCard,
  Brain,
  Palette,
  Heart,
  Truck,
  MessageCircle,
  Link as LinkIcon,
  Headphones,
  Mail,
  UserCircle,
  ClipboardList,
  Globe,
  FileEdit,
  CalendarDays,
  CheckCircle,
  BarChart3,
  DollarSign,
  BookOpen,
  Home,
  Utensils,
  Hotel as HotelIcon,
  BookText,
  MessageSquare,
  Zap,
  ShoppingBag,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  HelpCircle,
  GraduationCap,
  Building2,
  ChefHat,
  LayoutGrid,
  Megaphone
} from 'lucide-react';
import { useModulePermissions } from '@/hooks/useModulePermissions';
import type { LucideIcon } from 'lucide-react';
import { signOut } from 'next-auth/react';

// Navigation item type
interface NavigationChild {
  name: string;
  href: string;
  moduleId?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  moduleId?: string;
  children?: NavigationChild[];
  requiresAdmin?: boolean;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    moduleId: 'dashboard'
  },

  // Core Business
  {
    name: 'Sales & CRM',
    href: '/sales',
    icon: ShoppingCart,
    children: [
      { name: 'Overview', href: '/sales', moduleId: 'sales' },
      { name: 'Customers', href: '/sales/customers', moduleId: 'contacts' },
      { name: 'Leads', href: '/sales/leads', moduleId: 'sales' },
      { name: 'Opportunities', href: '/sales/opportunities', moduleId: 'sales' },
      { name: 'Orders', href: '/sales/orders', moduleId: 'sales' },
      { name: 'Quotations', href: '/sales/quotations', moduleId: 'sales' },
    ],
  },
  {
    name: 'Accounting',
    href: '/accounting',
    icon: FileText,
    children: [
      { name: 'Overview', href: '/accounting', moduleId: 'accounting' },
      { name: 'Invoices', href: '/accounting/invoices', moduleId: 'accounting' },
      { name: 'Payments', href: '/accounting/payments', moduleId: 'accounting' },
      { name: 'Accounts', href: '/accounting/accounts', moduleId: 'accounting' },
      { name: 'Expenses', href: '/accounting/expenses', moduleId: 'accounting' },
    ],
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Package,
    children: [
      { name: 'Overview', href: '/inventory', moduleId: 'inventory' },
      { name: 'Products', href: '/inventory/products', moduleId: 'inventory' },
      { name: 'Categories', href: '/inventory/categories', moduleId: 'inventory' },
      { name: 'Warehouses', href: '/inventory/warehouses', moduleId: 'inventory' },
      { name: 'Movements', href: '/inventory/movements', moduleId: 'inventory' },
      { name: 'Purchase Orders', href: '/inventory/purchase-orders', moduleId: 'inventory' },
    ],
  },
  {
    name: 'Manufacturing',
    href: '/manufacturing',
    icon: Factory,
    children: [
      { name: 'Overview', href: '/manufacturing', moduleId: 'manufacturing' },
      { name: 'Bill of Materials', href: '/manufacturing/bom', moduleId: 'manufacturing' },
      { name: 'Work Orders', href: '/manufacturing/work-orders', moduleId: 'manufacturing' },
    ],
  },
  {
    name: 'Quality Control',
    href: '/quality',
    icon: CheckCircle,
    children: [
      { name: 'Overview', href: '/quality', moduleId: 'quality' },
      { name: 'Quality Checks', href: '/quality/checks', moduleId: 'quality' },
      { name: 'Inspections', href: '/quality/inspections', moduleId: 'quality' },
    ],
  },
  {
    name: 'Purchasing',
    href: '/purchasing',
    icon: Truck,
    children: [
      { name: 'Orders', href: '/purchasing/orders', moduleId: 'purchasing' },
      { name: 'Vendors', href: '/purchasing/vendors', moduleId: 'purchasing' },
    ],
  },

  // People & Support
  {
    name: 'HR & People',
    href: '/hr',
    icon: Users,
    children: [
      { name: 'Overview', href: '/hr', moduleId: 'hr' },
      { name: 'Employees', href: '/hr/employees', moduleId: 'hr' },
      { name: 'Departments', href: '/hr/departments', moduleId: 'hr' },
      { name: 'Attendance', href: '/hr/attendance', moduleId: 'hr' },
      { name: 'Leave Requests', href: '/hr/leave-requests', moduleId: 'hr' },
      { name: 'Timesheets', href: '/hr/timesheets', moduleId: 'hr' },
    ],
  },
  {
    name: 'Helpdesk',
    href: '/helpdesk',
    icon: Headphones,
    moduleId: 'helpdesk'
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: UserCircle,
    moduleId: 'contacts'
  },
  {
    name: 'Live Chat',
    href: '/livechat',
    icon: MessageCircle,
    moduleId: 'livechat'
  },
  {
    name: 'Knowledge Base',
    href: '/knowledge',
    icon: BookText,
    moduleId: 'knowledge'
  },
  {
    name: 'Community Forum',
    href: '/forum',
    icon: MessageSquare,
    moduleId: 'forum'
  },

  // Projects & Productivity
  {
    name: 'Projects',
    href: '/projects',
    icon: Calendar,
    children: [
      { name: 'Overview', href: '/projects', moduleId: 'projects' },
      { name: 'Tasks', href: '/projects/tasks', moduleId: 'projects' },
    ],
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: CalendarDays,
    moduleId: 'calendar'
  },

  // Website & Marketing
  {
    name: 'Marketing',
    href: '/marketing',
    icon: Megaphone,
    children: [
      { name: 'Website', href: '/website', moduleId: 'marketing' },
      { name: 'Campaigns', href: '/marketing/campaigns', moduleId: 'marketing' },
      { name: 'Email Marketing', href: '/email-marketing', moduleId: 'marketing' },
    ],
  },
  {
    name: 'Blog',
    href: '/blog',
    icon: FileEdit,
    moduleId: 'blog'
  },
  {
    name: 'eLearning',
    href: '/courses',
    icon: BookOpen,
    moduleId: 'courses'
  },
  {
    name: 'Events',
    href: '/events',
    icon: CalendarDays,
    moduleId: 'calendar'
  },
  {
    name: 'Surveys',
    href: '/surveys',
    icon: ClipboardList,
    moduleId: 'surveys'
  },

  // eCommerce
  {
    name: 'Shopping Cart',
    href: '/cart',
    icon: ShoppingBag,
    moduleId: 'cart'
  },

  // Sales Channels
  {
    name: 'Point of Sale',
    href: '/pos',
    icon: CreditCard,
    moduleId: 'pos'
  },
  {
    name: 'Subscriptions',
    href: '/subscriptions',
    icon: DollarSign,
    moduleId: 'subscriptions'
  },

  // Integration & Automation
  {
    name: 'Integrations',
    href: '/integrations',
    icon: LinkIcon,
    children: [
      { name: 'Overview', href: '/integrations', moduleId: 'integrations' },
      { name: 'Courier Tracking', href: '/integrations/tracking', moduleId: 'integrations' },
      { name: 'Messages', href: '/integrations/messages', moduleId: 'integrations' },
    ],
  },
  {
    name: 'AI & Automation',
    href: '/ai',
    icon: Brain,
    moduleId: 'ai'
  },
  {
    name: 'No-Code Studio',
    href: '/studio',
    icon: Palette,
    moduleId: 'studio'
  },
  {
    name: 'Automation Rules',
    href: '/automation',
    icon: Zap,
    moduleId: 'automation'
  },

  // Industry Verticals
  {
    name: 'Healthcare',
    href: '/healthcare',
    icon: Heart,
    moduleId: 'healthcare'
  },
  {
    name: 'Real Estate',
    href: '/real-estate',
    icon: Home,
    children: [
      { name: 'Home', href: '/real-estate', moduleId: 'properties' },
      { name: 'Enhanced Features', href: '/real-estate/enhanced', moduleId: 'properties' },
      { name: 'Dashboard', href: '/real-estate/dashboard', moduleId: 'properties' },
      { name: 'Properties', href: '/real-estate/properties', moduleId: 'properties' },
      { name: 'Search Properties', href: '/real-estate/search', moduleId: 'properties' },
    ],
  },
  {
    name: 'Restaurant',
    href: '/restaurant',
    icon: Utensils,
    moduleId: 'restaurant',
    children: [
      { name: 'Dashboard', href: '/restaurant', moduleId: 'restaurant' },
      { name: 'Floor Plan', href: '/restaurant/floor-plan', moduleId: 'restaurant' },
      { name: 'Kitchen', href: '/restaurant/kitchen', moduleId: 'restaurant' },
      { name: 'POS', href: '/restaurant/pos', moduleId: 'restaurant' },
      { name: 'Setup', href: '/restaurant/setup', moduleId: 'restaurant' },
    ],
  },
  {
    name: 'Hotel',
    href: '/hotel',
    icon: HotelIcon,
    moduleId: 'hotel',
    children: [
      { name: 'Dashboard', href: '/hotel', moduleId: 'hotel' },
      { name: 'Front Desk', href: '/hotel/front-desk', moduleId: 'hotel' },
      { name: 'Bookings', href: '/hotel/bookings', moduleId: 'hotel' },
      { name: 'Guests', href: '/hotel/guests', moduleId: 'hotel' },
      { name: 'Housekeeping', href: '/hotel/housekeeping', moduleId: 'hotel' },
      { name: 'Maintenance', href: '/hotel/maintenance', moduleId: 'hotel' },
      { name: 'Branches', href: '/hotel/branches', moduleId: 'hotel' },
      { name: 'Settings', href: '/hotel/settings', moduleId: 'hotel' },
    ],
  },

  // Education
  {
    name: 'Education',
    href: '/education',
    icon: GraduationCap,
    moduleId: 'education'
  },

  // Analytics & Admin
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    moduleId: 'audit'
  },
  {
    name: 'Help & Support',
    href: '/help',
    icon: HelpCircle,
    moduleId: 'help'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserCircle,
    moduleId: 'profile'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    requiresAdmin: true,
    children: [
      { name: 'Overview', href: '/settings', moduleId: 'settings' },
      { name: 'Company', href: '/settings/company', moduleId: 'settings' },
      { name: 'Users', href: '/settings/users', moduleId: 'users' },
      { name: 'Roles', href: '/settings/roles', moduleId: 'settings' },
      { name: 'Tenants', href: '/settings/tenants', moduleId: 'settings' },
      { name: 'Appearance', href: '/settings/appearance', moduleId: 'settings' },
      { name: 'Integrations', href: '/settings/integrations', moduleId: 'settings' },
      { name: 'Notifications', href: '/settings/notifications', moduleId: 'settings' },
      { name: 'AI Config', href: '/settings/ai-config', moduleId: 'settings' },
      { name: 'System', href: '/settings/system', moduleId: 'settings' },
    ],
  },
];

/**
 * Helper function to check if a navigation item is accessible
 */
function canAccessNavigationItem(
  item: NavigationItem | NavigationChild,
  modulePermissions: Record<string, { enabled: boolean; view: boolean }>,
  isAdmin: boolean,
  isSuperAdmin: boolean
): boolean {
  if (isSuperAdmin || isAdmin) return true;
  if ('icon' in item && item.name === 'Dashboard') return true;
  if (!item.moduleId) return true;
  const permission = modulePermissions[item.moduleId];
  if (!permission) return false;
  return permission.enabled && permission.view;
}

/**
 * Filter navigation children based on permissions
 */
function filterNavigationChildren(
  children: NavigationChild[] | undefined,
  modulePermissions: Record<string, { enabled: boolean; view: boolean }>,
  isAdmin: boolean,
  isSuperAdmin: boolean
): NavigationChild[] {
  if (!children) return [];
  return children.filter((child) =>
    canAccessNavigationItem(child, modulePermissions, isAdmin, isSuperAdmin)
  );
}

export function Sidebar({
  isMobileMenuOpen,
  onClose
}: {
  isMobileMenuOpen?: boolean;
  onClose?: (() => void) | undefined;
}) {
  const pathname = usePathname();
  const { modulePermissions, isAdmin, user } = useModulePermissions();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  // Filter navigation based on module permissions
  const filteredNavigation = useMemo(() => {
    return navigation.reduce<NavigationItem[]>((acc, item) => {
      if (item.children) {
        const filteredChildren = filterNavigationChildren(
          item.children,
          modulePermissions,
          isAdmin,
          isSuperAdmin
        );

        if (filteredChildren.length > 0) {
          acc.push({
            ...item,
            children: filteredChildren,
          });
        }
      } else {
        if (canAccessNavigationItem(item, modulePermissions, isAdmin, isSuperAdmin)) {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  }, [modulePermissions, isAdmin, isSuperAdmin]);

  // Auto-expand menu if child is active
  useEffect(() => {
    filteredNavigation.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'));
        if (isChildActive && !openMenus.includes(item.name)) {
          setOpenMenus(prev => [...prev, item.name]);
        }
      }
    });
  }, [pathname, filteredNavigation]);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev =>
      prev.includes(name) ? prev.filter(item => item !== name) : [...prev, name]
    );
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col
          transform transition-transform duration-300 ease-in-out shadow-2xl
          lg:relative lg:translate-x-0 border-r border-slate-800
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              S
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">SLICT ERP</h1>
              <p className="text-xs text-slate-400 font-medium">Enterprise Suite</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && !item.children);
            const hasChildren = item.children && item.children.length > 0;
            const isOpen = openMenus.includes(item.name);

            if (hasChildren) {
              return (
                <div key={item.name} className="mb-1">
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group
                      ${isOpen ? 'bg-slate-800/50 text-white' : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${isOpen ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                      <span className="font-medium text-sm">{item.name}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-500" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3 py-1">
                          {item.children!.map((child) => {
                            const isChildActive = pathname === child.href;
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                className={`
                                  flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-sm
                                  ${isChildActive
                                    ? 'bg-blue-600/10 text-blue-400 font-medium'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                  }
                                `}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${isChildActive ? 'bg-blue-400' : 'bg-slate-600'}`} />
                                <span>{child.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group mb-1
                  ${isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 group-hover:text-red-400" />
            <span className="font-medium text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
