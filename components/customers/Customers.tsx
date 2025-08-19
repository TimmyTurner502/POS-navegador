



import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import { Customer, Sale, Payment } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, CreditCardIcon, MagnifyingGlassIcon, EyeIcon } from '../Icons';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';

const CustomerFormModal: React.FC<{ customer: Partial<Customer> | null, onClose: () => void, onSave: (customer: Customer) => void }> = ({ customer, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Customer>>(customer || { name: '', email: '', phone: '', address: '', nit: 'CF', cui: 'CF', creditLimit: 0, creditDays: 0 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: formData.id || Date.now().toString(), currentBalance: formData.currentBalance || 0, paymentHistory: formData.paymentHistory || [] } as Customer);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">{customer?.id ? 'Editar' : 'Nuevo'} Cliente</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</span>
                        <input name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    </label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NIT</span>
                            <input name="nit" value={formData.nit} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CUI</span>
                            <input name="cui" value={formData.cui} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</span>
                            <input name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </label>
                    </div>
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</span>
                        <input name="address" value={formData.address} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Límite de Crédito</span>
                            <input name="creditLimit" type="number" value={formData.creditLimit} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Días de Crédito</span>
                            <input name="creditDays" type="number" value={formData.creditDays} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </label>
                    </div>
                    <div className="mt-6 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MakePaymentModal: React.FC<{ customer: Customer, onClose: () => void, onPayment: (payment: Payment) => void }> = ({ customer, onClose, onPayment }) => {
    const [amount, setAmount] = useState(customer.currentBalance);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
    const [notes, setNotes] = useState('');
    const context = useContext(AppContext);
    if (!context) return null;

    const handlePayment = () => {
        if (amount <= 0 || amount > customer.currentBalance) {
            alert("Monto inválido");
            return;
        }
        const newPayment: Payment = {
            id: `pay-${Date.now()}`,
            date: new Date().toISOString(),
            amount,
            paymentMethod,
            notes,
        };
        onPayment(newPayment);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
                 <h2 className="text-2xl font-bold mb-4">Registrar Pago</h2>
                 <p className="mb-2">Cliente: <strong>{customer.name}</strong></p>
                 <p className="mb-4">Saldo Actual: <strong>{formatCurrency(customer.currentBalance, context.settings)}</strong></p>
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto a Pagar</span>
                        <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} max={customer.currentBalance} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </label>
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma de Pago</span>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="cash">Efectivo</option>
                            <option value="card">Tarjeta</option>
                            <option value="transfer">Transferencia</option>
                        </select>
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notas (Opcional)</span>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </label>
                </div>
                 <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">Cancelar</button>
                    <button onClick={handlePayment} className="px-4 py-2 bg-primary-500 text-white rounded-lg">Registrar</button>
                </div>
             </div>
        </div>
    );
};

const CustomerDetailModal: React.FC<{ customer: Customer, sales: Sale[], onClose: () => void }> = ({ customer, sales, onClose }) => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('sales');

    if (!context) return null;
    const { settings } = context;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                 <h2 className="text-2xl font-bold mb-4">Detalles de {customer.name}</h2>
                 <div className="mb-4 grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm border-b pb-4 dark:border-gray-700">
                     <p><strong>Email:</strong> {customer.email || 'N/A'}</p>
                     <p><strong>Teléfono:</strong> {customer.phone || 'N/A'}</p>
                     <p><strong>NIT:</strong> {customer.nit}</p>
                     <p><strong>CUI:</strong> {customer.cui}</p>
                     <p><strong>Dirección:</strong> {customer.address || 'N/A'}</p>
                 </div>

                 <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('sales')} className={`${activeTab === 'sales' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Historial de Compras ({sales.length})</button>
                        <button onClick={() => setActiveTab('payments')} className={`${activeTab === 'payments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Historial de Pagos ({customer.paymentHistory.length})</button>
                    </nav>
                 </div>
                 
                 <div className="flex-grow overflow-y-auto pt-4">
                    {activeTab === 'sales' && (
                         <table className="w-full text-sm">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                 <tr className="border-b">
                                     <th className="text-left p-2">ID Venta</th>
                                     <th className="text-left p-2">Fecha</th>
                                     <th className="text-right p-2">Total</th>
                                     <th className="text-right p-2">Método</th>
                                 </tr>
                             </thead>
                             <tbody>
                                {sales.map(s => (
                                    <tr key={s.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">{s.id}</td>
                                        <td className="p-2">{formatDate(s.date, settings)}</td>
                                        <td className="text-right p-2">{formatCurrency(s.total, settings)}</td>
                                        <td className="text-right p-2 capitalize">{s.paymentMethod}</td>
                                    </tr>
                                ))}
                                {sales.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-4">No hay compras registradas.</td></tr>}
                             </tbody>
                         </table>
                    )}
                    {activeTab === 'payments' && (
                         <table className="w-full text-sm">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                 <tr className="border-b">
                                     <th className="text-left p-2">Fecha</th>
                                     <th className="text-right p-2">Monto</th>
                                     <th className="text-right p-2">Método</th>
                                     <th className="text-left p-2">Notas</th>
                                 </tr>
                             </thead>
                             <tbody>
                                {customer.paymentHistory.map(p => (
                                    <tr key={p.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">{formatDate(p.date, settings)}</td>
                                        <td className="text-right p-2">{formatCurrency(p.amount, settings)}</td>
                                        <td className="text-right p-2 capitalize">{p.paymentMethod}</td>
                                        <td className="p-2 italic text-gray-500">{p.notes || '-'}</td>
                                    </tr>
                                ))}
                                 {customer.paymentHistory.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-4">No hay pagos registrados.</td></tr>}
                             </tbody>
                         </table>
                    )}
                 </div>

                 <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">Cerrar</button>
                </div>
             </div>
        </div>
    )
}


const Customers: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
    const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

    if (!context) return null;
    const { customers, setCustomers, sales, logAction, settings } = context;

    const handleSaveCustomer = (customer: Customer) => {
        if (editingCustomer?.id) {
            setCustomers(customers.map(c => c.id === customer.id ? customer : c));
            logAction(`Cliente actualizado: ${customer.name}`, { type: 'customer', id: customer.id });
        } else {
            setCustomers([...customers, customer]);
            logAction(`Cliente creado: ${customer.name}`, { type: 'customer', id: customer.id });
        }
    };
    
    const confirmDeleteCustomer = () => {
        if (!customerToDelete) return;
        setCustomers(customers.filter(c => c.id !== customerToDelete.id));
        logAction(`Cliente eliminado: ${customerToDelete.name}`, { type: 'customer', id: customerToDelete.id });
        setCustomerToDelete(null);
    };

    const openModalForEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const openModalForNew = () => {
        setEditingCustomer(null);
        setIsModalOpen(true);
    };
    
    const handleMakePayment = (payment: Payment) => {
        if (!payingCustomer) return;
        setCustomers(customers.map(c => 
            c.id === payingCustomer.id 
            ? { ...c, 
                currentBalance: c.currentBalance - payment.amount,
                paymentHistory: [payment, ...c.paymentHistory]
              } 
            : c
        ));
        logAction(`Pago recibido de ${payingCustomer.name} por ${formatCurrency(payment.amount, settings)}`, { type: 'payment', id: payment.id});
    };

    const customerSales = useMemo(() => {
        if (!viewingCustomer) return [];
        return sales.filter(s => s.customerId === viewingCustomer.id);
    }, [viewingCustomer, sales]);

    const filteredCustomers = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return customers.filter(c =>
            c.name.toLowerCase().includes(search) ||
            c.email.toLowerCase().includes(search) ||
            c.phone.toLowerCase().includes(search) ||
            c.nit.toLowerCase().includes(search) ||
            c.cui.toLowerCase().includes(search)
        );
    }, [customers, searchTerm]);

    return (
        <div className="container mx-auto">
            {isModalOpen && <CustomerFormModal customer={editingCustomer} onClose={() => setIsModalOpen(false)} onSave={handleSaveCustomer} />}
            {isPaymentModalOpen && payingCustomer && <MakePaymentModal customer={payingCustomer} onClose={() => setIsPaymentModalOpen(false)} onPayment={handleMakePayment} />}
            {viewingCustomer && <CustomerDetailModal customer={viewingCustomer} sales={customerSales} onClose={() => setViewingCustomer(null)} />}
            {customerToDelete && (
                <ConfirmModal
                    isOpen={!!customerToDelete}
                    title="Confirmar Eliminación"
                    message={`¿Está seguro de que desea eliminar al cliente "${customerToDelete.name}"? Esta acción no se puede deshacer.`}
                    onConfirm={confirmDeleteCustomer}
                    onCancel={() => setCustomerToDelete(null)}
                />
            )}

            <div className="sm:flex sm:justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Clientes</h2>
                <button onClick={openModalForNew} className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Cliente
                </button>
            </div>

            <div className="mb-4 relative">
                 <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                    type="text"
                    placeholder="Buscar por nombre, NIT, CUI, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Contacto</th>
                            <th className="px-6 py-3">NIT / CUI</th>
                            <th className="px-6 py-3">Saldo / Límite Crédito</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredCustomers.map(customer => (
                             <tr key={customer.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{customer.name}</td>
                                <td className="px-6 py-4">{customer.email}<br/>{customer.phone}</td>
                                <td className="px-6 py-4">{customer.nit}<br/>{customer.cui}</td>
                                <td className="px-6 py-4">
                                    <span className={customer.currentBalance > 0 ? 'text-red-500' : 'text-green-500'}>
                                        {formatCurrency(customer.currentBalance, settings)}
                                    </span> / {formatCurrency(customer.creditLimit, settings)}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    {customer.currentBalance > 0 && 
                                        <button onClick={() => { setPayingCustomer(customer); setIsPaymentModalOpen(true); }} className="text-green-600 hover:text-green-800 mr-2" title="Registrar Pago">
                                            <CreditCardIcon className="w-5 h-5"/>
                                        </button>
                                    }
                                    <button onClick={() => setViewingCustomer(customer)} className="text-blue-600 hover:text-blue-800 mr-2" title="Ver Historial"><EyeIcon className="w-5 h-5"/></button>
                                    <button onClick={() => openModalForEdit(customer)} className="text-primary-600 hover:text-primary-800 mr-2" title="Editar Cliente"><PencilIcon className="w-5 h-5"/></button>
                                    {customer.id !== '1' && <button onClick={() => setCustomerToDelete(customer)} className="text-red-600 hover:text-red-800" title="Eliminar Cliente"><TrashIcon className="w-5 h-5"/></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Customers;