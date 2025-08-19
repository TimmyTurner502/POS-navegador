



import React, { useState, useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import { Purchase, PurchaseItem, Product, Supplier } from '../../types';
import { PlusIcon, TrashIcon, EyeIcon } from '../Icons';
import { formatCurrency, formatDate } from '../../utils/formatters';

// Re-using modals from other components to keep it DRY
import { SupplierFormModal } from '../suppliers/Suppliers';
import { ProductFormModal } from '../inventory/Inventory';


const NewPurchaseModal: React.FC<{ onClose: () => void, onSave: (purchase: Purchase) => void }> = ({ onClose, onSave }) => {
    const context = useContext(AppContext);
    const [supplierId, setSupplierId] = useState<string>('');
    const [items, setItems] = useState<PurchaseItem[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [comments, setComments] = useState('');
    const [receiptImageUrl, setReceiptImageUrl] = useState('');

    const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);

    if (!context) return null;
    const { suppliers, setSuppliers, products, setProducts, currentUser, settings, logAction, productCategories, setProductCategories } = context;

    const filteredProducts = useMemo(() => {
        const itemIds = new Set(items.map(i => i.productId));
        return products.filter(p => 
            !itemIds.has(p.id) &&
            (p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
        );
    }, [products, productSearch, items]);
    
    const handleAddProduct = (product: Product) => {
        setItems([...items, { productId: product.id, name: product.name, quantity: 1, cost: product.cost }]);
        setProductSearch('');
    };
    
    const handleItemChange = (productId: string, field: 'quantity' | 'cost', value: number) => {
        setItems(items.map(item => item.productId === productId ? { ...item, [field]: value } : item));
    };

    const handleRemoveItem = (productId: string) => {
        setItems(items.filter(item => item.productId !== productId));
    }
    
     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setReceiptImageUrl(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const total = useMemo(() => items.reduce((sum, item) => sum + (item.cost * item.quantity), 0), [items]);

    const handleSaveSupplier = (supplier: Supplier) => {
        const existing = suppliers.find(s => s.id === supplier.id);
        if (existing) {
             setSuppliers(suppliers.map(s => s.id === supplier.id ? supplier : s));
        } else {
            setSuppliers([...suppliers, supplier]);
            setSupplierId(supplier.id);
        }
        logAction(`Proveedor guardado: ${supplier.name}`);
        setIsSupplierModalOpen(false);
    }
    
    const handleSaveProduct = (product: Product) => {
        const existing = products.find(p => p.id === product.id);
        if (existing) {
             setProducts(products.map(p => p.id === product.id ? product : p));
        } else {
             setProducts([...products, product]);
        }
         logAction(`Producto guardado: ${product.name}`);
        setIsProductModalOpen(false);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!supplierId || items.length === 0) {
            alert("Por favor seleccione un proveedor y agregue al menos un producto.");
            return;
        }
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return;

        const newPurchase: Purchase = {
            id: `COM-${Date.now()}`,
            date: new Date().toISOString(),
            supplierId,
            supplierName: supplier.name,
            items,
            total,
            user: currentUser.name,
            comments,
            receiptImageUrl
        };
        onSave(newPurchase);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            {isSupplierModalOpen && <div className="fixed inset-0 z-50"><SupplierFormModal supplier={null} onClose={() => setIsSupplierModalOpen(false)} onSave={handleSaveSupplier} /></div>}
            {isProductModalOpen && <div className="fixed inset-0 z-50"><ProductFormModal product={null} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} categories={productCategories} setCategories={setProductCategories} /></div>}

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4">Nueva Compra</h2>
                <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-4 overflow-hidden">
                    <div className="flex gap-2 items-center">
                        <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required className="w-full md:w-1/2 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
                            <option value="">Seleccione un Proveedor</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                         <button type="button" onClick={() => setIsSupplierModalOpen(true)} className="p-2 border rounded dark:border-gray-600" title="Nuevo Proveedor"><PlusIcon className="w-5 h-5"/></button>
                    </div>
                    
                    <div className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
                        <div className="md:w-1/3 flex flex-col border rounded-lg p-2 dark:border-gray-700">
                            <div className="flex gap-2 items-center mb-2">
                                <input type="text" placeholder="Buscar producto..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                                <button type="button" onClick={() => setIsProductModalOpen(true)} className="p-2 border rounded dark:border-gray-600" title="Nuevo Producto"><PlusIcon className="w-5 h-5"/></button>
                            </div>
                            <ul className="flex-grow overflow-y-auto">
                                {filteredProducts.slice(0, 100).map(p => (
                                    <li key={p.id} onClick={() => handleAddProduct(p)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md text-sm">
                                        {p.name} ({p.sku})
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="md:w-2/3 flex flex-col border rounded-lg p-2 dark:border-gray-700">
                             <h3 className="font-semibold mb-2">Artículos en la Compra</h3>
                            <div className="flex-grow overflow-y-auto pr-2">
                                {items.length === 0 ? <p className="text-center text-gray-500 mt-8">Agregue productos desde la lista</p> :
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.productId} className="grid grid-cols-12 gap-2 items-center">
                                            <span className="col-span-4 truncate text-sm">{item.name}</span>
                                            <input type="number" value={item.quantity} onChange={e => handleItemChange(item.productId, 'quantity', parseInt(e.target.value) || 0)} className="col-span-2 p-1 border rounded dark:bg-gray-700 text-sm" placeholder="Cant." min="1" />
                                            <input type="number" value={item.cost} onChange={e => handleItemChange(item.productId, 'cost', parseFloat(e.target.value) || 0)} className="col-span-2 p-1 border rounded dark:bg-gray-700 text-sm" placeholder="Costo" step="0.01" />
                                            <span className="text-right font-semibold col-span-3 text-sm">{formatCurrency(item.quantity * item.cost, settings)}</span>
                                            <button type="button" onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    ))}
                                </div>
                                }
                            </div>
                             <div className="mt-auto pt-2 border-t dark:border-gray-600 text-right">
                                <span className="font-bold text-lg">Total: {formatCurrency(total, settings)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Comentarios..." rows={3} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
                        <div>
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Comprobante (Opcional)</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                            {receiptImageUrl && <img src={receiptImageUrl} alt="Comprobante" className="mt-2 h-16 w-16 object-cover rounded-md" />}
                        </div>
                    </div>

                    <div className="mt-auto flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">Guardar Compra</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PurchaseDetailModal: React.FC<{ purchase: Purchase, onClose: () => void }> = ({ purchase, onClose }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { settings } = context;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Detalle de Compra #{purchase.id}</h2>
                <div className="text-sm space-y-2 mb-4">
                    <p><strong>Fecha:</strong> {new Date(purchase.date).toLocaleString()}</p>
                    <p><strong>Proveedor:</strong> {purchase.supplierName}</p>
                    <p><strong>Usuario:</strong> {purchase.user}</p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2 font-semibold">Producto</th>
                            <th className="text-center p-2 font-semibold">Cant.</th>
                            <th className="text-right p-2 font-semibold">Costo Unit.</th>
                            <th className="text-right p-2 font-semibold">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {purchase.items.map(item => (
                            <tr key={item.productId} className="border-b dark:border-gray-600">
                                <td className="p-2">{item.name}</td>
                                <td className="text-center p-2">{item.quantity}</td>
                                <td className="text-right p-2">{formatCurrency(item.cost, settings)}</td>
                                <td className="text-right p-2">{formatCurrency(item.cost * item.quantity, settings)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 pt-4 border-t dark:border-gray-700 text-right">
                    <p className="font-bold text-lg">Total: {formatCurrency(purchase.total, settings)}</p>
                </div>
                 <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-white">Comentarios:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
                        {purchase.comments || "No hay comentarios."}
                    </p>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const Purchases: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewingPurchase, setViewingPurchase] = useState<Purchase | null>(null);

    if (!context) return null;
    const { purchases, setPurchases, setProducts, setSuppliers, logAction, settings } = context;

    const handleSavePurchase = (purchase: Purchase) => {
        setPurchases(prev => [purchase, ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        setProducts(prevProducts => {
            const newProducts = JSON.parse(JSON.stringify(prevProducts));
            purchase.items.forEach(item => {
                const productIndex = newProducts.findIndex((p: Product) => p.id === item.productId);
                if (productIndex !== -1) {
                    newProducts[productIndex].stock += item.quantity;
                }
            });
            return newProducts;
        });

        setSuppliers(prevSuppliers => {
            return prevSuppliers.map(s => s.id === purchase.supplierId ? { ...s, currentBalance: s.currentBalance + purchase.total } : s);
        });

        logAction(`Compra #${purchase.id} registrada`, { type: 'purchase', id: purchase.id });
    };

     const filteredPurchases = useMemo(() => {
        return purchases.filter(p =>
            p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [purchases, searchTerm]);

    return (
        <div className="container mx-auto">
            {isModalOpen && <NewPurchaseModal onClose={() => setIsModalOpen(false)} onSave={handleSavePurchase} />}
            {viewingPurchase && <PurchaseDetailModal purchase={viewingPurchase} onClose={() => setViewingPurchase(null)} />}

            <div className="sm:flex sm:justify-between sm:items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Compras a Proveedores</h2>
                <button onClick={() => setIsModalOpen(true)} className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nueva Compra
                </button>
            </div>
            
            <div className="mb-4 relative">
                <input
                    type="text"
                    placeholder="Buscar por ID de compra o proveedor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">ID Compra</th>
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Proveedor</th>
                            <th className="px-6 py-3">Total</th>
                            <th className="px-6 py-3">Usuario</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPurchases.map(purchase => (
                             <tr key={purchase.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{purchase.id}</td>
                                <td className="px-6 py-4">{formatDate(purchase.date, settings)}</td>
                                <td className="px-6 py-4">{purchase.supplierName}</td>
                                <td className="px-6 py-4">{formatCurrency(purchase.total, settings)}</td>
                                <td className="px-6 py-4">{purchase.user}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setViewingPurchase(purchase)} className="text-blue-600 hover:text-blue-800">
                                        <EyeIcon className="w-5 h-5" title="Ver Detalles"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                         {filteredPurchases.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">No se encontraron compras.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Purchases;