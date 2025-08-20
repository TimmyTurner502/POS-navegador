
import React, { useState, createContext, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { View, initialData, AppContextType, Product, Sale, Customer, User, Settings as SettingsType, AuditLog, Supplier, Expense, Category, Role, ExpenseCategory, Purchase, CashDrawerSession, Branch, InventoryStock, SubscriptionPlan, SubscriptionCapabilities, SubscriptionContextType } from './types';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './components/Dashboard';
import Inventory from './components/inventory/Inventory';
import PointOfSale from './components/pos/PointOfSale';
import SalesHistory from './components/sales/SalesHistory';
import Customers from './components/customers/Customers';
import Settings from './components/settings/Settings';
import Reports from './components/reports/Reports';
import Users from './components/users/Users';
import Suppliers from './components/suppliers/Suppliers';
import Expenses from './components/expenses/Expenses';
import Purchases from './components/purchases/Purchases';
import MobileMenu from './components/common/MobileMenu';
import AuditLogComponent from './components/audit/AuditLog';
import CashDrawer from './components/cash-drawer/CashDrawer';
import { Toaster } from 'react-hot-toast';

export const AppContext = createContext<AppContextType | null>(null);
export const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [products, setProducts] = useLocalStorage<Product[]>('products', initialData.products);
    const [inventoryStock, setInventoryStock] = useLocalStorage<InventoryStock[]>('inventoryStock', initialData.inventoryStock);
    const [sales, setSales] = useLocalStorage<Sale[]>('sales', initialData.sales);
    const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', initialData.purchases);
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', initialData.customers);
    const [users, setUsers] = useLocalStorage<User[]>('users', initialData.users);
    const [roles, setRoles] = useLocalStorage<Role[]>('roles', initialData.roles);
    const [branches, setBranches] = useLocalStorage<Branch[]>('branches', initialData.branches);
    const [settings, setSettings] = useLocalStorage<SettingsType>('settings', initialData.settings);
    const [auditLog, setAuditLog] = useLocalStorage<AuditLog[]>('auditLog', initialData.auditLog);
    const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', initialData.suppliers);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialData.expenses);
    const [productCategories, setProductCategories] = useLocalStorage<Category[]>('productCategories', initialData.productCategories);
    const [expenseCategories, setExpenseCategories] = useLocalStorage<ExpenseCategory[]>('expenseCategories', initialData.expenseCategories);
    const [activeCashDrawerSession, setActiveCashDrawerSession] = useLocalStorage<CashDrawerSession | null>('activeCashDrawerSession', null);
    const [cashDrawerHistory, setCashDrawerHistory] = useLocalStorage<CashDrawerSession[]>('cashDrawerHistory', initialData.cashDrawerHistory);
    const [dismissedAlerts, setDismissedAlerts] = useLocalStorage<string[]>('dismissedAlerts', []);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentUser, setCurrentUser] = useLocalStorage<User>('currentUser', initialData.users[0]);
    const [currentBranchId, setCurrentBranchId] = useState<string>(currentUser.assignments[0]?.branchId || initialData.branches[0].id);
    const [subscriptionPlans] = useLocalStorage<SubscriptionPlan[]>('subscriptionPlans', initialData.subscriptionPlans);

    useEffect(() => {
        const root = document.documentElement;
        root.className = settings.theme; // 'light' or 'dark'
        
        const existingPalette = Array.from(root.classList).find(c => c.startsWith('theme-'));
        if (existingPalette) {
            root.classList.remove(existingPalette);
        }
        root.classList.add(settings.themePalette);

    }, [settings.theme, settings.themePalette]);
    
    useEffect(() => {
        // When user changes, update the current branch to their first assigned branch.
        const firstAssignment = currentUser.assignments[0];
        if (firstAssignment) {
            setCurrentBranchId(firstAssignment.branchId);
        } else {
            // Fallback if user has no assignments (should not happen in normal operation)
            setCurrentBranchId(branches[0]?.id);
        }
    }, [currentUser, branches]);

    const subscriptionCapabilities = useMemo<SubscriptionCapabilities>(() => {
        const currentPlan = subscriptionPlans.find(p => p.id === settings.subscriptionPlanId) || subscriptionPlans[0];
        return {
            canCreateMoreBranches: branches.length < currentPlan.maxBranches,
            canCreateMoreUsers: users.length < currentPlan.maxUsers,
            currentPlan,
        };
    }, [settings.subscriptionPlanId, branches, users, subscriptionPlans]);

    const subscriptionContextValue = useMemo(() => ({
        capabilities: subscriptionCapabilities,
    }), [subscriptionCapabilities]);


    const contextValue = useMemo(() => {
        // Find the user's role for the currently selected branch
        const assignment = currentUser.assignments.find(a => a.branchId === currentBranchId);
        const currentUserRole = roles.find(r => r.name === assignment?.role);

        return {
            products, setProducts,
            inventoryStock, setInventoryStock,
            sales, setSales,
            purchases, setPurchases,
            customers, setCustomers,
            users, setUsers,
            roles, setRoles,
            branches, setBranches,
            settings, setSettings,
            auditLog, setAuditLog,
            suppliers, setSuppliers,
            expenses, setExpenses,
            productCategories, setProductCategories,
            expenseCategories, setExpenseCategories,
            dismissedAlerts, setDismissedAlerts,
            currentUser, setCurrentUser,
            currentUserRole,
            activeCashDrawerSession, setActiveCashDrawerSession,
            cashDrawerHistory, setCashDrawerHistory,
            currentBranchId, setCurrentBranchId,
            subscription: subscriptionCapabilities,
            logAction: (action: string, details?: AuditLog['details']) => {
                const newLog: AuditLog = {
                    id: Date.now().toString(),
                    user: currentUser.name,
                    action,
                    timestamp: new Date().toISOString(),
                    details
                };
                setAuditLog(prev => [newLog, ...prev]);
            }
        }
    }, [products, inventoryStock, sales, purchases, customers, users, roles, branches, settings, auditLog, suppliers, expenses, productCategories, expenseCategories, dismissedAlerts, currentUser, activeCashDrawerSession, cashDrawerHistory, currentBranchId, subscriptionCapabilities, setProducts, setInventoryStock, setSales, setPurchases, setCustomers, setUsers, setRoles, setBranches, setSettings, setAuditLog, setSuppliers, setExpenses, setProductCategories, setExpenseCategories, setDismissedAlerts, setCurrentUser, setActiveCashDrawerSession, setCashDrawerHistory, setCurrentBranchId]);

    const renderView = () => {
        const userPermissions = contextValue.currentUserRole?.permissions || [];
        const enabledModules = settings.enabledModules || Object.values(View);
        
        const hasAccess = (view: View) => userPermissions.includes(view);
        const isModuleEnabled = (view: View) => enabledModules.includes(view);

        const canView = (view: View) => hasAccess(view) && isModuleEnabled(view);

        if (!canView(currentView) && currentView !== View.DASHBOARD) {
            if (canView(View.DASHBOARD)) {
                 setCurrentView(View.DASHBOARD);
                 return <Dashboard />;
            } else {
                 return <div className="p-6">No tienes permiso para acceder a este módulo o está deshabilitado.</div>;
            }
        }

        switch (currentView) {
            case View.DASHBOARD: return <Dashboard />;
            case View.INVENTORY: return <Inventory />;
            case View.POS: return <PointOfSale />;
            case View.SALES: return <SalesHistory />;
            case View.PURCHASES: return <Purchases />;
            case View.CUSTOMERS: return <Customers />;
            case View.SUPPLIERS: return <Suppliers />;
            case View.EXPENSES: return <Expenses />;
            case View.REPORTS: return <Reports />;
            case View.AUDIT_LOG: return <AuditLogComponent />;
            case View.USERS: return <Users />;
            case View.SETTINGS: return <Settings />;
            case View.CASH_DRAWER: return <CashDrawer />;
            default:
                const fallbackView = userPermissions.find(p => isModuleEnabled(p)) || View.DASHBOARD;
                if (currentView !== fallbackView) {
                    setCurrentView(fallbackView);
                }
                return <Dashboard />;
        }
    };
    
    const handleSetView = (view: View) => {
      setCurrentView(view);
      setIsMobileMenuOpen(false);
    }

    return (
        <AppContext.Provider value={contextValue}>
            <SubscriptionContext.Provider value={subscriptionContextValue}>
                <Toaster position="bottom-right" reverseOrder={false} />
                <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                    <Sidebar currentView={currentView} setCurrentView={handleSetView} />
                    <MobileMenu isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} currentView={currentView} setCurrentView={handleSetView} />
                    
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <Header currentView={currentView} onMenuClick={() => setIsMobileMenuOpen(true)} />
                        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 sm:p-6">
                            {renderView()}
                        </main>
                    </div>
                </div>
            </SubscriptionContext.Provider>
        </AppContext.Provider>
    );
};

export default App;
