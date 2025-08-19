import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import { Supplier, Purchase, Payment } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, EyeIcon, CreditCardIcon } from '../Icons';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';


export const SupplierFormModal: React.FC<{ supplier: Partial<Supplier> | null, onClose: () => void, onSave: (supplier: Supplier) => void }> = ({ supplier, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Supplier>>(supplier || { name: '', contactPerson: '', email: '', phone: '', creditLimit: 0, creditDays: 0 });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: formData.id || Date.now().toString(), currentBalance: formData.currentBalance || 0, paymentHistory: formData.paymentHistory || [] } as Supplier);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">{supplier?.id ? 'Editar' : 'Nuevo'} Proveedor</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Proveedor</span>
                        <input name="name" value={formData.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required />
                    </label>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Persona de Contacto</span>
                        <input name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                            <input name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</span>
                            <input name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                        </label>
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

const MakePaymentModal: React.FC<{ supplier: Supplier, onClose: () => void, onPayment: (payment: Payment) => void }> = ({ supplier, onClose, onPayment }) => {
    const [amount, setAmount] = useState(supplier.currentBalance);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('transfer');
    const [notes, setNotes] = useState('');
    const context = useContext(AppContext);
    if (!context) return null;

    const handlePayment = () => {
        if (amount <= 0 || amount > supplier.currentBalance) {
            alert("Monto inválido");
            return;
        }
        const newPayment: Payment = {
            id: `pay-supp-${Date.now()}`,
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
                 <h2 className="text-2xl font-bold mb-4">Registrar Pago a Proveedor</h2>
                 <p className="mb-2">Proveedor: <strong>{supplier.name}</strong></p>
                 <p className="mb-4">Saldo por Pagar: <strong>{formatCurrency(supplier.currentBalance, context.settings)}</strong></p>
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto a Pagar</span>
                        <input type="number" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value))} max={supplier.currentBalance} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                    </label>
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma de Pago</span>
                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="transfer">Transferencia</option>
                            <option value="cash">Efectivo</option>
                            <option value="card">Tarjeta</option>
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

const SupplierDetailModal: React.FC<{ supplier: Supplier, purchases: Purchase[], onClose: () => void }> = ({ supplier, purchases, onClose }) => {
    const context = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('purchases');

    if (!context) return null;
    const { settings } = context;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
             <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                 <h2 className="text-2xl font-bold mb-4">Detalles de {supplier.name}</h2>
                 <div className="mb-4 grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm border-b pb-4 dark:border-gray-700">
                     <p><strong>Contacto:</strong> {supplier.contactPerson || 'N/A'}</p>
                     <p><strong>Email:</strong> {supplier.email || 'N/A'}</p>
                     <p><strong>Teléfono:</strong> {supplier.phone || 'N/A'}</p>
                 </div>

                 <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        <button onClick={() => setActiveTab('purchases')} className={`${activeTab === 'purchases' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Historial de Compras ({purchases.length})</button>
                        <button onClick={() => setActiveTab('payments')} className={`${activeTab === 'payments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Historial de Pagos ({supplier.paymentHistory.length})</button>
                    </nav>
                 </div>
                 
                 <div className="flex-grow overflow-y-auto pt-4">
                    {activeTab === 'purchases' && (
                         <table className="w-full text-sm">
                             <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                 <tr className="border-b">
                                     <th className="text-left p-2">ID Compra</th>
                                     <th className="text-left p-2">Fecha</th>
                                     <th className="text-right p-2">Total</th>
                                 </tr>
                             </thead>
                             <tbody>
                                {purchases.map(p => (
                                    <tr key={p.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">{p.id}</td>
                                        <td className="p-2">{formatDate(p.date, settings)}</td>
                                        <td className="text-right p-2">{formatCurrency(p.total, settings)}</td>
                                    </tr>
                                ))}
                                {purchases.length === 0 && <tr><td colSpan={3} className="text-center text-gray-500 py-4">No hay compras registradas.</td></tr>}
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
                                {supplier.paymentHistory.map(p => (
                                    <tr key={p.id} className="border-b dark:border-gray-700">
                                        <td className="p-2">{formatDate(p.date, settings)}</td>
                                        <td className="text-right p-2">{formatCurrency(p.amount, settings)}</td>
                                        <td className="text-right p-2 capitalize">{p.paymentMethod}</td>
                                        <td className="p-2 italic text-gray-500">{p.notes || '-'}</td>
                                    </tr>
                                ))}
                                 {supplier.paymentHistory.length === 0 && <tr><td colSpan={4} className="text-center text-gray-500 py-4">No hay pagos registrados.</td></tr>}
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

const Suppliers: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
    const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

    if (!context) return null;
    const { suppliers, setSuppliers, settings, logAction, purchases } = context;
    
    const handleSaveSupplier = (supplier: Supplier) => {
        if (editingSupplier?.id) {
            setSuppliers(suppliers.map(s => s.id === supplier.id ? supplier : s));
            logAction(`Proveedor actualizado: ${supplier.name}`, { type: 'supplier', id: supplier.id });
        } else {
            setSuppliers([...suppliers, supplier]);
            logAction(`Proveedor creado: ${supplier.name}`, { type: 'supplier', id: supplier.id });
        }
    };
    
    const confirmDeleteSupplier = () => {
        if (!supplierToDelete) return;
        setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id));
        logAction(`Proveedor eliminado: ${supplierToDelete.name}`, { type: 'supplier', id: supplierToDelete.id });
        setSupplierToDelete(null);
    };

    const openModalForEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsModalOpen(true);
    };

    const openModalForNew = () => {
        setEditingSupplier(null);
        setIsModalOpen(true);
    };

    const handleMakePayment = (payment: Payment) => {
        if (!payingSupplier) return;
        setSuppliers(suppliers.map(s => 
            s.id === payingSupplier.id 
            ? { ...s, 
                currentBalance: s.currentBalance - payment.amount,
                paymentHistory: [payment, ...s.paymentHistory]
              } 
            : s
        ));
        logAction(`Pago realizado a ${payingSupplier.name} por ${formatCurrency(payment.amount, settings)}`, { type: 'payment', id: payment.id});
    };
    
    const supplierPurchases = useMemo(() => {
        if (!viewingSupplier) return [];
        return purchases.filter(p => p.supplierId === viewingSupplier.id);
    }, [viewingSupplier, purchases]);
    
    const filteredSuppliers = useMemo(() => {
        const search = searchTerm.toLowerCase();
        return suppliers.filter(s =>
            s.name.toLowerCase().includes(search) ||
            s.contactPerson.toLowerCase().includes(search) ||
            s.email.toLowerCase().includes(search) ||
            s.phone.toLowerCase().includes(search)
        );
    }, [suppliers, searchTerm]);


    return (
        <div className="container mx-auto">
             {isModalOpen && <SupplierFormModal supplier={editingSupplier} onClose={() => setIsModalOpen(false)} onSave={handleSaveSupplier} />}
             {isPaymentModalOpen && payingSupplier && <MakePaymentModal supplier={payingSupplier} onClose={() => setIsPaymentModalOpen(false)} onPayment={handleMakePayment} />}
             {viewingSupplier && <SupplierDetailModal supplier={viewingSupplier} purchases={supplierPurchases} onClose={() => setViewingSupplier(null)} />}
             {supplierToDelete && (
                <ConfirmModal
                    isOpen={!!supplierToDelete}
                    title="Confirmar Eliminación"
                    message={`¿Está seguro de que desea eliminar al proveedor "${supplierToDelete.name}"?`}
                    onConfirm={confirmDeleteSupplier}
                    onCancel={() => setSupplierToDelete(null)}
                />
            )}

            <div className="sm:flex sm:justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Proveedores</h2>
                <button onClick={openModalForNew} className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Proveedor
                </button>
            </div>
            
            <div className="mb-4 relative">
                 <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                    type="text"
                    placeholder="Buscar por nombre, contacto, email o teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-x-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Nombre</th>
                            <th scope="col" className="px-6 py-3">Contacto</th>
                            <th scope="col" className="px-6 py-3">Email / Teléfono</th>
                             <th scope="col" className="px-6 py-3">Saldo / Límite Crédito</th>
                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSuppliers.map(supplier => (
                             <tr key={supplier.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{supplier.name}</td>
                                <td className="px-6 py-4">{supplier.contactPerson}</td>
                                <td className="px-6 py-4">{supplier.email}<br/>{supplier.phone}</td>
                                <td className="px-6 py-4">
                                     <span className={supplier.currentBalance > 0 ? 'text-red-500' : ''}>
                                        {formatCurrency(supplier.currentBalance, settings)}
                                    </span> / {formatCurrency(supplier.creditLimit, settings)}
                                </td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    {supplier.currentBalance > 0 && 
                                        <button onClick={() => { setPayingSupplier(supplier); setIsPaymentModalOpen(true); }} className="text-green-600 hover:text-green-800 mr-2" title="Registrar Pago">
                                            <CreditCardIcon className="w-5 h-5"/>
                                        </button>
                                    }
                                    <button onClick={() => setViewingSupplier(supplier)} className="text-blue-600 hover:text-blue-800 mr-2" title="Ver Historial"><EyeIcon className="w-5 h-5"/></button>
                                    <button onClick={() => openModalForEdit(supplier)} className="text-primary-600 hover:text-primary-800 mr-2" title="Editar Proveedor"><PencilIcon className="w-5 h-5"/></button>
                                    <button onClick={() => setSupplierToDelete(supplier)} className="text-red-600 hover:text-red-800" title="Eliminar Proveedor"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Suppliers;