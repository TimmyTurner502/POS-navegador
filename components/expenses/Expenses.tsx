import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import { Expense, ExpenseCategory } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, EyeIcon } from '../Icons';
import { formatCurrency, formatDate } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';

const ExpenseFormModal: React.FC<{ expense: Partial<Expense> | null, onClose: () => void, onSave: (expense: Expense) => void }> = ({ expense, onClose, onSave }) => {
    const context = useContext(AppContext);
    const [formData, setFormData] = useState<Partial<Expense>>(expense || { 
        description: '', 
        amount: 0, 
        categoryId: context?.expenseCategories[0]?.id || '', 
        date: new Date().toISOString().split('T')[0], 
        isRecurring: false,
        paymentMethod: 'cash'
    });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    
    if (!context) return null;
    const { expenseCategories, setExpenseCategories } = context;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, receiptImageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAddNewCategory = () => {
        if (newCategoryName.trim() === "") return;
        const newCategory = { id: Date.now().toString(), name: newCategoryName.trim() };
        setExpenseCategories(prev => [...prev, newCategory]);
        setFormData(prev => ({...prev, categoryId: newCategory.id}));
        setNewCategoryName("");
        setIsAddingCategory(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: formData.id || Date.now().toString() } as Expense);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">{expense?.id ? 'Editar' : 'Nuevo'} Gasto</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción del Gasto</span>
                        <input name="description" value={formData.description} onChange={handleChange} className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" required />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto</span>
                            <input type="number" name="amount" value={formData.amount} onChange={handleChange} step="0.01" className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</span>
                            <div className="flex gap-2 mt-1">
                                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full">
                                    {expenseCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                                <button type="button" onClick={() => setIsAddingCategory(true)} className="p-2 border rounded dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                            {isAddingCategory && (
                                <div className="flex gap-2 mt-2">
                                    <input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nueva categoría" className="flex-grow p-2 border rounded dark:bg-gray-700"/>
                                    <button type="button" onClick={handleAddNewCategory} className="px-3 py-2 bg-primary-500 text-white rounded">OK</button>
                                </div>
                            )}
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha</span>
                            <input type="date" name="date" value={formData.date} onChange={handleChange} className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma de Pago</span>
                            <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full">
                               <option value="cash">Efectivo</option>
                               <option value="card">Tarjeta</option>
                               <option value="transfer">Transferencia</option>
                            </select>
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comprobante / Recibo</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                        {formData.receiptImageUrl && <img src={formData.receiptImageUrl} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-md" />}
                    </div>
                     <div className="flex items-center">
                        <input type="checkbox" name="isRecurring" checked={!!formData.isRecurring} onChange={handleChange} id="isRecurring" className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">Gasto Recurrente</label>
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


const Expenses: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Partial<Expense> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    if (!context) return null;
    const { expenses, setExpenses, expenseCategories, logAction, settings } = context;

    const handleSaveExpense = (expense: Expense) => {
        if (editingExpense?.id) {
            setExpenses(expenses.map(e => e.id === expense.id ? expense : e));
            logAction(`Gasto actualizado: ${expense.description}`, { type: 'expense', id: expense.id });
        } else {
            setExpenses(prev => [...prev, expense].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            logAction(`Gasto creado: ${expense.description}`, { type: 'expense', id: expense.id });
        }
    };
    
    const confirmDeleteExpense = () => {
        if (!expenseToDelete) return;
        setExpenses(expenses.filter(e => e.id !== expenseToDelete.id));
        logAction(`Gasto eliminado: ${expenseToDelete.description}`, { type: 'expense', id: expenseToDelete.id });
        setExpenseToDelete(null);
    };

    const openModalForEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const openModalForNew = () => {
        setEditingExpense(null);
        setIsModalOpen(true);
    };

    const getCategoryName = (categoryId: string) => {
        return expenseCategories.find(c => c.id === categoryId)?.name || 'Sin categoría';
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(e =>
            e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCategoryName(e.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [expenses, searchTerm, expenseCategories]);

    return (
        <div className="container mx-auto">
            {isModalOpen && <ExpenseFormModal expense={editingExpense} onClose={() => setIsModalOpen(false)} onSave={handleSaveExpense} />}
            {expenseToDelete && (
                <ConfirmModal
                    isOpen={!!expenseToDelete}
                    title="Confirmar Eliminación"
                    message={`¿Está seguro de que desea eliminar el gasto "${expenseToDelete.description}"?`}
                    onConfirm={confirmDeleteExpense}
                    onCancel={() => setExpenseToDelete(null)}
                />
            )}
            {viewingImage && (
                <div onClick={() => setViewingImage(null)} className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <img src={viewingImage} alt="Comprobante" className="max-w-full max-h-full object-contain" />
                </div>
            )}
            
            <div className="sm:flex sm:justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Gestión de Gastos</h2>
                 <button onClick={openModalForNew} className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Gasto
                </button>
            </div>
            
             <div className="mb-4 relative">
                 <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                 <input
                    type="text"
                    placeholder="Buscar por descripción o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-x-auto">
                 <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Comprobante</th>
                            <th scope="col" className="px-6 py-3">Fecha</th>
                            <th scope="col" className="px-6 py-3">Descripción</th>
                            <th scope="col" className="px-6 py-3">Categoría</th>
                            <th scope="col" className="px-6 py-3">Monto</th>
                             <th scope="col" className="px-6 py-3">Forma de Pago</th>
                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(expense => (
                            <tr key={expense.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4">
                                    {expense.receiptImageUrl ? (
                                        <img src={expense.receiptImageUrl} alt="receipt" onClick={() => setViewingImage(expense.receiptImageUrl!)} className="w-10 h-10 object-cover rounded cursor-pointer" />
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400">
                                            <EyeIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">{formatDate(expense.date, settings)}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{expense.description}</td>
                                <td className="px-6 py-4">{getCategoryName(expense.categoryId)}</td>
                                <td className="px-6 py-4">{formatCurrency(expense.amount, settings)}</td>
                                <td className="px-6 py-4 capitalize">{expense.paymentMethod}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openModalForEdit(expense)} className="text-primary-600 hover:text-primary-800 mr-2"><PencilIcon className="w-5 h-5" title="Editar"/></button>
                                    <button onClick={() => setExpenseToDelete(expense)} className="text-red-600 hover:text-red-800"><TrashIcon className="w-5 h-5" title="Eliminar"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Expenses;