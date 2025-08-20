
import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../App';
import { BellIcon, UserCircleIcon, ExclamationTriangleIcon, XMarkIcon, Bars3Icon } from '../Icons';
import { Product, Branch } from '../../types';

const isProductExpiringSoon = (expiryDate: string | undefined) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
};

const AlertsDropdown: React.FC<{alerts: (Product & { type: 'low-stock' | 'expiry', stock: number })[], onDismiss: (alertId: string) => void}> = ({ alerts, onDismiss }) => {
    if (alerts.length === 0) {
        return (
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                <p className="text-center text-gray-500">No hay alertas nuevas.</p>
            </div>
        );
    }

    return (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50">
            <div className="p-3 font-bold border-b dark:border-gray-700">Notificaciones</div>
            <ul className="divide-y dark:divide-gray-700">
                {alerts.map(alert => (
                    <li key={`${alert.type}-${alert.id}`} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-start">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${alert.type === 'low-stock' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                           <ExclamationTriangleIcon className="w-5 h-5"/>
                        </div>
                        <div className="flex-grow min-w-0">
                            <p className="text-sm font-semibold truncate">{alert.name}</p>
                            <p className="text-xs text-gray-500 truncate">
                                {alert.type === 'low-stock' ? `Stock bajo: ${alert.stock}/${alert.lowStockAlert}` : `Vence pronto: ${alert.expiryDate}`}
                            </p>
                        </div>
                        <button onClick={() => onDismiss(`${alert.type}-${alert.id}`)} className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="w-4 h-4" title="Descartar alerta"/>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const Header: React.FC<{currentView: string, onMenuClick: () => void}> = ({currentView, onMenuClick}) => {
    const context = useContext(AppContext);
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);

    const alerts = useMemo(() => {
        if (!context) return [];
        const { products, dismissedAlerts, inventoryStock, currentBranchId } = context;

        const getStock = (productId: string) => {
            return inventoryStock.find(s => s.productId === productId && s.branchId === currentBranchId)?.stock || 0;
        };

        const lowStock = products
            .filter(p => {
                const stock = getStock(p.id);
                return stock > 0 && stock <= p.lowStockAlert && !dismissedAlerts.includes(`low-stock-${p.id}`);
            })
            .map(p => ({ ...p, type: 'low-stock' as const, stock: getStock(p.id) }));

        const expiring = products
            .filter(p => isProductExpiringSoon(p.expiryDate) && !dismissedAlerts.includes(`expiry-${p.id}`) && getStock(p.id) > 0)
            .map(p => ({ ...p, type: 'expiry' as const, stock: getStock(p.id) }));
            
        return [...lowStock, ...expiring];
    }, [context]);

    if (!context) return null;
    const { users, currentUser, setCurrentUser, setDismissedAlerts, branches, currentBranchId, setCurrentBranchId } = context;
    
    const handleDismissAlert = (alertId: string) => {
        setDismissedAlerts(prev => [...prev, alertId]);
    };

    const userCanChangeBranch = currentUser.assignments.length > 1;

    return (
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-900 shadow-md flex-shrink-0">
            <div className="flex items-center min-w-0">
                 <button onClick={onMenuClick} className="md:hidden mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                    <Bars3Icon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white truncate">{currentView}</h1>
            </div>
            <div className="flex items-center gap-4">
                {userCanChangeBranch && (
                    <div className="hidden sm:block">
                        <label htmlFor="branch-selector" className="sr-only">Seleccionar Sucursal</label>
                        <select
                            id="branch-selector"
                            value={currentBranchId}
                            onChange={(e) => setCurrentBranchId(e.target.value)}
                            className="text-sm font-medium bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        >
                            {currentUser.assignments.map(assignment => {
                                const branch = branches.find(b => b.id === assignment.branchId);
                                return branch ? <option key={branch.id} value={branch.id}>{branch.name}</option> : null;
                            })}
                        </select>
                    </div>
                )}
                <div className="relative">
                    <button onClick={() => setIsAlertsOpen(!isAlertsOpen)} className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none">
                        <BellIcon className="w-6 h-6" />
                        {alerts.length > 0 && <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{alerts.length}</span>}
                    </button>
                    {isAlertsOpen && <AlertsDropdown alerts={alerts} onDismiss={handleDismissAlert} />}
                </div>

                 <div className="flex items-center">
                     <UserCircleIcon className="w-8 h-8 text-gray-500 hidden sm:block" />
                     <select 
                        value={currentUser.id} 
                        onChange={e => setCurrentUser(users.find(u => u.id === e.target.value) || users[0])}
                        className="ml-2 text-sm font-medium bg-transparent border-none dark:bg-gray-900 focus:ring-0 w-24 sm:w-auto sm:max-w-xs truncate"
                        aria-label="Seleccionar usuario"
                     >
                        {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                     </select>
                </div>
            </div>
        </header>
    );
};

export default Header;