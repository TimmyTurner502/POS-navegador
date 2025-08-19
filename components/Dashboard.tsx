import React, { useContext } from 'react';
import { AppContext } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CurrencyDollarIcon, ArchiveBoxIcon, ShoppingCartIcon, ExclamationTriangleIcon } from './Icons';
import { formatCurrency } from '../utils/formatters';

const Dashboard: React.FC = () => {
    const context = useContext(AppContext);

    if (!context) return null;
    const { sales, products, settings } = context;

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalSales = sales.length;
    const uniqueProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock <= p.lowStockAlert).length;

    const salesData = sales.map(sale => ({
        name: new Date(sale.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        Ventas: sale.total,
    }));

    const kpiData = [
        { title: 'Ingresos Totales', value: formatCurrency(totalRevenue, settings), icon: <CurrencyDollarIcon className="w-8 h-8 text-white"/>, color: 'bg-green-500' },
        { title: 'Ventas Totales', value: totalSales, icon: <ShoppingCartIcon className="w-8 h-8 text-white"/>, color: 'bg-blue-500' },
        { title: 'Productos Únicos', value: uniqueProducts, icon: <ArchiveBoxIcon className="w-8 h-8 text-white"/>, color: 'bg-indigo-500' },
        { title: 'Alertas de Stock', value: lowStockProducts, icon: <ExclamationTriangleIcon className="w-8 h-8 text-white"/>, color: 'bg-red-500' },
    ];

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Dashboard</h2>
            
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
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Resumen de Ventas</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <BarChart data={salesData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(tick) => formatCurrency(tick, settings)} />
                                <Tooltip formatter={(value: number) => formatCurrency(value, settings)} contentStyle={{ backgroundColor: '#333', border: 'none' }} itemStyle={{ color: '#fff' }} />
                                <Legend />
                                <Bar dataKey="Ventas" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Actividad Reciente</h3>
                    <ul className="space-y-4">
                        {context.auditLog.slice(0, 5).map(log => (
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