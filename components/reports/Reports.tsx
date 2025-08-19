
import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../../App';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#dd84d8'];

const GeneralReport: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { sales, expenses, settings } = context;

    const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const profit = totalRevenue - totalExpenses;

    const dataByMonth = useMemo(() => {
        const monthlyData: { [key: string]: { month: string, Ingresos: number, Gastos: number } } = {};
        const processItems = (items: (typeof sales[0] | typeof expenses[0])[], type: 'Ingresos' | 'Gastos') => {
             items.forEach(item => {
                const month = new Date(item.date).toLocaleString('default', { month: 'short', year: '2-digit' });
                if (!monthlyData[month]) {
                    monthlyData[month] = { month, Ingresos: 0, Gastos: 0 };
                }
                const amount = 'total' in item ? item.total : item.amount;
                monthlyData[month][type] += amount;
            });
        };
        processItems(sales, 'Ingresos');
        processItems(expenses, 'Gastos');
        
        return Object.values(monthlyData).sort((a,b) => new Date(a.month).getTime() - new Date(b.month).getTime());
    }, [sales, expenses]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-100 dark:bg-green-900/50 p-6 rounded-lg shadow">
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Ingresos Totales</h4>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalRevenue, settings)}</p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/50 p-6 rounded-lg shadow">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">Gastos Totales</h4>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalExpenses, settings)}</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-lg shadow">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">Ganancia Neta</h4>
                    <p className={`text-3xl font-bold ${profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(profit, settings)}</p>
                </div>
            </div>
            <div>
                 <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Ingresos vs. Gastos</h3>
                 <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={dataByMonth}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis tickFormatter={(tick) => formatCurrency(tick, settings)} />
                            <Tooltip formatter={(value: number) => formatCurrency(value, settings)} />
                            <Legend />
                            <Line type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={2} />
                            <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

const SalesReport: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { sales, products, productCategories } = context;
    
    const salesByCategory = useMemo(() => {
        const categoryMap: { [key: string]: number } = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const categoryName = productCategories.find(c => c.id === product.categoryId)?.name || 'Sin Categoría';
                    categoryMap[categoryName] = (categoryMap[categoryName] || 0) + item.price * item.quantity;
                }
            });
        });
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [sales, products, productCategories]);

    const bestSellingProducts = useMemo(() => {
        const productMap: { [key: string]: { name: string, quantity: number } } = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                productMap[item.productId] = {
                    name: item.name,
                    quantity: (productMap[item.productId]?.quantity || 0) + item.quantity
                };
            });
        });
        return Object.values(productMap).sort((a, b) => b.quantity - a.quantity).slice(0, 10);
    }, [sales]);

    return (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Ventas por Categoría</h3>
                 <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                         <PieChart>
                            <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {salesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Productos Más Vendidos (Top 10)</h3>
                <div style={{ width: '100%', height: 300 }}>
                   <ResponsiveContainer>
                        <BarChart data={bestSellingProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }}/>
                            <Tooltip />
                            <Bar dataKey="quantity" name="Cantidad Vendida" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
};

const ExpensesReport: React.FC = () => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { expenses, expenseCategories } = context;

    const expensesByCategory = useMemo(() => {
        const categoryMap: { [key: string]: number } = {};
        expenses.forEach(expense => {
            const categoryName = expenseCategories.find(c => c.id === expense.categoryId)?.name || 'Sin Categoría';
            categoryMap[categoryName] = (categoryMap[categoryName] || 0) + expense.amount;
        });
        return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    }, [expenses, expenseCategories]);

     return (
        <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Gastos por Categoría</h3>
             <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                     <PieChart>
                        <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="#ff8042" label>
                            {expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

const Reports: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'Resumen General' },
        { id: 'sales', label: 'Ventas' },
        { id: 'expenses', label: 'Gastos' },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'general': return <GeneralReport />;
            case 'sales': return <SalesReport />;
            case 'expenses': return <ExpensesReport />;
            default: return null;
        }
    };

    return (
        <div>
            <div className="sm:flex sm:justify-between sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Reportes Financieros</h2>
            </div>
            
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default Reports;
