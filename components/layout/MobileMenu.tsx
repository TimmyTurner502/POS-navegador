import React, { useContext } from 'react';
import { View } from '../../types';
import { ChartPieIcon, ShoppingCartIcon, ArchiveBoxIcon, DocumentTextIcon, KycIcon, Cog6ToothIcon, UserGroupIcon, ChartBarSquareIcon, TruckIcon, ReceiptOutlineIcon, BookOpenIcon, XMarkIcon, ShoppingBagIcon, KeyIcon } from '../Icons';
import { AppContext } from '../../App';

interface MobileMenuProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    currentView: View;
    setCurrentView: (view: View) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, setIsOpen, currentView, setCurrentView }) => {
    const context = useContext(AppContext);

    const allNavItems = [
        { view: View.DASHBOARD, icon: <ChartPieIcon className="w-6 h-6" />, label: 'Dashboard' },
        { view: View.POS, icon: <ShoppingCartIcon className="w-6 h-6" />, label: 'Punto de Venta' },
        { view: View.CASH_DRAWER, icon: <KeyIcon className="w-6 h-6" />, label: 'Módulo de Caja' },
        { view: View.INVENTORY, icon: <ArchiveBoxIcon className="w-6 h-6" />, label: 'Inventario' },
        { view: View.SALES, icon: <DocumentTextIcon className="w-6 h-6" />, label: 'Ventas' },
        { view: View.PURCHASES, icon: <ShoppingBagIcon className="w-6 h-6" />, label: 'Compras' },
        { view: View.CUSTOMERS, icon: <KycIcon className="w-6 h-6" />, label: 'Clientes' },
        { view: View.SUPPLIERS, icon: <TruckIcon className="w-6 h-6" />, label: 'Proveedores' },
        { view: View.EXPENSES, icon: <ReceiptOutlineIcon className="w-6 h-6" />, label: 'Gastos' },
        { view: View.REPORTS, icon: <ChartBarSquareIcon className="w-6 h-6" />, label: 'Reportes' },
        { view: View.AUDIT_LOG, icon: <BookOpenIcon className="w-6 h-6" />, label: 'Historial' },
        { view: View.USERS, icon: <UserGroupIcon className="w-6 h-6" />, label: 'Usuarios' },
        { view: View.SETTINGS, icon: <Cog6ToothIcon className="w-6 h-6" />, label: 'Configuración' },
    ];
    
    const userPermissions = context?.currentUserRole?.permissions || [];
    const enabledModules = context?.settings.enabledModules || [];
    const navItems = allNavItems.filter(item => userPermissions.includes(item.view) && enabledModules.includes(item.view));

    if (!isOpen) return null;

    return (
        <>
            <div id="mobile-menu-backdrop" className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsOpen(false)}></div>
            <aside className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg z-40 transform transition-transform md:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-20 px-4 shadow-md">
                     <div className="flex items-center">
                        <img src={context?.settings.logoUrl} alt="Logo" className="h-10 w-auto" />
                        <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400 ml-2">Zenith</h1>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <nav className="flex-1 px-2 py-4 space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.view}
                            onClick={() => setCurrentView(item.view)}
                            className={`flex items-center px-4 py-2 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200 w-full text-left ${
                                currentView === item.view
                                    ? 'bg-primary-500 text-white dark:bg-primary-600'
                                    : 'hover:bg-primary-100 dark:hover:bg-gray-700'
                            }`}
                        >
                            {item.icon}
                            <span className="ml-3">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default MobileMenu;