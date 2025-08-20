
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CurrencyDollarIcon, ArchiveBoxIcon, ShoppingCartIcon, ExclamationTriangleIcon } from './Icons';
import { formatCurrency } from '../utils/formatters';
import { Sale } from '../types';

type FilterType = 'all' | 'today' | 'week' | 'month';

const Dashboard: React.FC = () => {
    const context = useContext(AppContext);
    const [filter, setFilter] = useState<FilterType>('all');

    if (!context) return null;
    const { sales, products, settings, auditLog, inventoryStock, currentBranchId } = context;

    const filteredSales = useMemo(() => {
        const branchSales = sales.filter(s => s.branchId === currentBranchId);
        if (filter === 'all') return branchSales;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return branchSales.filter(sale => {
            const saleDate = new Date(sale.date);
            if (filter === 'today') {
                return saleDate >= today;
            }
            if (filter === 'week') {
                const oneWeekAgo = new Date(today);
                oneWeekAgo.setDate(today.getDate() - 7);
                return saleDate >= oneWeekAgo;
            }
            if (filter === 'month') {
                return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
            }
            return true;
        });
    }, [sales, filter, currentBranchId]);

    const getStock = (productId: string) => {
        return inventoryStock.find(s => s.productId === productId && s.branchId === currentBranchId)?.stock || 0;
    };

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalSales = filteredSales.length;
    const uniqueProducts = products.length; // This is global
    const lowStockProducts = products.filter(p => {
        const stock = getStock(p.id);
        return stock > 0 && stock <= p.lowStockAlert;
    }).length;

    const salesData = useMemo(() => {
        const dataMap = new Map<string, number>();
        filteredSales.forEach(sale => {
            const dateKey = new Date(sale.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
            dataMap.set(dateKey, (dataMap.get(dateKey) || 0) + sale.total);
        });
        return Array.from(dataMap, ([name, Ventas]) => ({ name, Ventas }));
    }, [filteredSales]);
    

    const kpiData = [
        { title: 'Ingresos Totales (Sucursal)', value: formatCurrency(totalRevenue, settings), icon: <CurrencyDollarIcon className="w-8 h-8 text-white"/>, color: 'bg-green-500' },
        { title: 'Ventas Totales (Sucursal)', value: totalSales, icon: <ShoppingCartIcon className="w-8 h-8 text-white"/>, color: 'bg-blue-500' },
        { title: 'Productos Únicos (Global)', value: uniqueProducts, icon: <ArchiveBoxIcon className="w-8 h-8 text-white"/>, color: 'bg-indigo-500' },
        { title: 'Alertas de Stock (Sucursal)', value: lowStockProducts, icon: <ExclamationTriangleIcon className="w-8 h-8 text-white"/>, color: 'bg-red-500' },
    ];

    const FilterButtons = () => (
        <div className="flex space-x-2 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
            {(['all', 'today', 'week', 'month'] as FilterType[]).map(f => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
                        filter === f
                        ? 'bg-primary-500 text-white shadow'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/50'
                    }`}
                >
                    {{ all: 'Siempre', today: 'Hoy', week: 'Esta Semana', month: 'Este Mes'}[f]}
                </button>
            ))}
        </div>
    );

    return (
        <div>
            <div className="sm:flex sm:justify-between sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
                <FilterButtons />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {kpiData.map((kpi, index) => (
                    <div key={index} className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.title}</p>
                            <p className="text-3xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
                        </div>
                        <div className={`p-4 rounded-full ${kpi.color}`}>
                            {kpi.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resumen de Ventas (Sucursal)</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(tick) => formatCurrency(tick, settings)} />
                                <Tooltip formatter={(value: number) => formatCurrency(value, settings)} contentStyle={{ backgroundColor: 'rgb(var(--color-surface-dark))', border: 'none' }} itemStyle={{ color: 'rgb(var(--color-text-dark))' }} />
                                <Legend />
                                <Bar dataKey="Ventas" fill="rgb(var(--color-primary-500))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Actividad Reciente (Global)</h3>
                    <ul className="space-y-4">
                        {auditLog.slice(0, 5).map(log => (
                             <li key={log.id} className="flex items-start">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                                    <span className="text-primary-600 dark:text-primary-300 font-bold">{log.user.charAt(0)}</span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{log.action}</p>
                                    <p className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
