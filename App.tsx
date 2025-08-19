



import React, { useState, createContext, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { View, initialData, AppContextType, Product, Sale, Customer, User, Settings as SettingsType, AuditLog, Supplier, Expense, Category, Role, ExpenseCategory, Purchase } from './types';
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
import { Toaster } from 'react-hot-toast';

export const AppContext = createContext<AppContextType | null>(null);

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
    const [products, setProducts] = useLocalStorage<Product[]>('products', initialData.products);
    const [sales, setSales] = useLocalStorage<Sale[]>('sales', initialData.sales);
    const [purchases, setPurchases] = useLocalStorage<Purchase[]>('purchases', initialData.purchases);
    const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', initialData.customers);
    const [users, setUsers] = useLocalStorage<User[]>('users', initialData.users);
    const [roles, setRoles] = useLocalStorage<Role[]>('roles', initialData.roles);
    const [settings, setSettings] = useLocalStorage<SettingsType>('settings', initialData.settings);
    const [auditLog, setAuditLog] = useLocalStorage<AuditLog[]>('auditLog', initialData.auditLog);
    const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', initialData.suppliers);
    const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', initialData.expenses);
    const [productCategories, setProductCategories] = useLocalStorage<Category[]>('productCategories', initialData.productCategories);
    const [expenseCategories, setExpenseCategories] = useLocalStorage<ExpenseCategory[]>('expenseCategories', initialData.expenseCategories);
    const [dismissedAlerts, setDismissedAlerts] = useLocalStorage<string[]>('dismissedAlerts', []);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Simple simulation of a logged-in user. In a real app, this would come from an auth context.
    const [currentUser, setCurrentUser] = useLocalStorage<User>('currentUser', initialData.users[0]);

    useEffect(() => {
        const root = document.documentElement;
        root.className = settings.theme; // 'light' or 'dark'
        
        const existingPalette = Array.from(root.classList).find(c => c.startsWith('theme-'));
        if (existingPalette) {
            root.classList.remove(existingPalette);
        }
        root.classList.add(settings.themePalette);

    }, [settings.theme, settings.themePalette]);


    const contextValue = useMemo(() => {
        const currentUserRole = roles.find(r => r.name === currentUser.role);
        return {
            products, setProducts,
            sales, setSales,
            purchases, setPurchases,
            customers, setCustomers,
            users, setUsers,
            roles, setRoles,
            settings, setSettings,
            auditLog, setAuditLog,
            suppliers, setSuppliers,
            expenses, setExpenses,
            productCategories, setProductCategories,
            expenseCategories, setExpenseCategories,
            dismissedAlerts, setDismissedAlerts,
            currentUser, setCurrentUser,
            currentUserRole,
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
    }, [products, sales, purchases, customers, users, roles, settings, auditLog, suppliers, expenses, productCategories, expenseCategories, dismissedAlerts, currentUser, setProducts, setSales, setPurchases, setCustomers, setUsers, setRoles, setSettings, setAuditLog, setSuppliers, setExpenses, setProductCategories, setExpenseCategories, setDismissedAlerts, setCurrentUser]);

    const renderView = () => {
        const userPermissions = contextValue.currentUserRole?.permissions || [];
        
        const hasAccess = (view: View) => userPermissions.includes(view);

        if (!hasAccess(currentView) && currentView !== View.DASHBOARD) {
            if (hasAccess(View.DASHBOARD)) {
                 setCurrentView(View.DASHBOARD);
            } else {
                 return <div className="p-6">No tienes permiso para acceder a este módulo.</div>;
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
            default:
                // Fallback to the first available permission if the current view is somehow invalid
                const fallbackView = userPermissions[0] || View.DASHBOARD;
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
        </AppContext.Provider>
    );
};

export default App;