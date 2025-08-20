
import React, { useState, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../../App';
import { Product, Category, InventoryStock } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon, CameraIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '../Icons';
import { formatCurrency, formatDate } from '../../utils/formatters';
import BarcodeScanner from '../common/BarcodeScanner';
import ConfirmModal from '../common/ConfirmModal';
import { useVirtualizer } from '@tanstack/react-virtual';
import toast from 'react-hot-toast';

export const ProductFormModal: React.FC<{ product: Partial<Product> | null, onClose: () => void, onSave: (product: Product, stock: number) => void, categories: Category[], setCategories: React.Dispatch<React.SetStateAction<Category[]>> }> = ({ product, onClose, onSave, categories, setCategories }) => {
    const context = useContext(AppContext);
    const [formData, setFormData] = useState<Partial<Product>>(product || { name: '', sku: '', lowStockAlert: 5, price: 0, cost: 0, categoryId: categories[0]?.id || '' });
    
    const getStockForProduct = (productId: string | undefined) => {
        if (!context || !productId) return 0;
        return context.inventoryStock.find(s => s.productId === productId && s.branchId === context.currentBranchId)?.stock || 0;
    }
    
    const [stock, setStock] = useState<number>(getStockForProduct(product?.id));
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddNewCategory = () => {
        if (newCategoryName.trim() === "") return;
        const newCategory = { id: Date.now().toString(), name: newCategoryName.trim() };
        setCategories(prev => [...prev, newCategory]);
        setFormData(prev => ({...prev, categoryId: newCategory.id}));
        setNewCategoryName("");
        setIsAddingCategory(false);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: formData.id || Date.now().toString() } as Product, stock);
        onClose();
    };
    
    const handleScan = (result: string) => {
        setFormData(prev => ({...prev, sku: result}));
        setIsScannerOpen(false);
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
             {isScannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">{product?.id ? 'Editar' : 'Nuevo'} Producto</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Producto</span>
                        <input name="name" value={formData.name} onChange={handleChange} className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" required/>
                    </label>
                    
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU / Código de Barras</span>
                        <div className="flex gap-2 mt-1">
                            <input name="sku" value={formData.sku} onChange={handleChange} className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
                            <button type="button" onClick={() => setIsScannerOpen(true)} className="p-2 border rounded dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
                                <CameraIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</span>
                             <div className="flex gap-2 mt-1">
                                <select name="categoryId" value={formData.categoryId} onChange={handleChange} className="flex-grow p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full">
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
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
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock Actual (Esta Sucursal)</span>
                            <input type="number" name="stock" value={stock} onChange={e => setStock(parseInt(e.target.value) || 0)} className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Alerta de Stock Bajo</span>
                            <input type="number" name="lowStockAlert" value={formData.lowStockAlert} onChange={handleChange} className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Precio de Venta</span>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Costo</span>
                            <input type="number" name="cost" value={formData.cost} onChange={handleChange} step="0.01" className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Vencimiento</span>
                            <input type="date" name="expiryDate" value={formData.expiryDate || ''} onChange={handleChange} className="mt-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 w-full" />
                        </label>
                    </div>
                    
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imagen del Producto</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/>
                        {formData.imageUrl && <img src={formData.imageUrl} alt="Preview" className="mt-2 h-24 w-24 object-cover rounded-md" />}
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

const Inventory: React.FC = () => {
    const context = useContext(AppContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const parentRef = useRef<HTMLDivElement>(null);


    if (!context) return null;
    const { products, setProducts, logAction, settings, productCategories, setProductCategories, inventoryStock, setInventoryStock, currentBranchId } = context;
    
    const getStock = (productId: string) => {
        return inventoryStock.find(s => s.productId === productId && s.branchId === currentBranchId)?.stock || 0;
    };

    const handleSaveProduct = (product: Product, stock: number) => {
        const isNewProduct = !products.some(p => p.id === product.id);

        setProducts(prevProducts => {
            if (isNewProduct) {
                return [...prevProducts, product];
            } else {
                return prevProducts.map(p => (p.id === product.id ? product : p));
            }
        });

        setInventoryStock(prevInventory => {
            const newInventory = [...prevInventory];
            const stockIndex = newInventory.findIndex(
                s => s.productId === product.id && s.branchId === currentBranchId
            );

            if (stockIndex > -1) {
                newInventory[stockIndex] = { ...newInventory[stockIndex], stock };
            } else {
                newInventory.push({ productId: product.id, branchId: currentBranchId, stock });
            }
            return newInventory;
        });

        const action = isNewProduct ? 'creado' : 'actualizado';
        logAction(`Producto ${action}: ${product.name}`, { type: 'product', id: product.id });
        toast.success(`Producto ${action} con éxito.`);
    };
    
    const confirmDeleteProduct = () => {
        if (!productToDelete) return;
        // Remove product globally
        setProducts(products.filter(p => p.id !== productToDelete.id));
        // Remove all stock entries for this product across all branches
        setInventoryStock(inventoryStock.filter(s => s.productId !== productToDelete.id));
        logAction(`Producto eliminado: ${productToDelete.name}`, { type: 'product', id: productToDelete.id });
        setProductToDelete(null);
        toast.success("Producto eliminado.");
    };

    const openModalForEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const openModalForNew = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };
    
    const getCategoryName = (categoryId: string) => {
        return productCategories.find(c => c.id === categoryId)?.name || 'Sin categoría';
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getCategoryName(p.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm, productCategories]);

    const rowVirtualizer = useVirtualizer({
        count: filteredProducts.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 68,
        overscan: 5,
    });
    
    const isProductExpiringSoon = (expiryDate: string | undefined) => {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30 && diffDays > 0;
    };
    
    const handleScan = (result: string) => {
        setSearchTerm(result);
        setIsScannerOpen(false);
    }
    
    const exportData = (format: 'json' | 'csv') => {
        const productsWithStock = products.map(p => ({
            ...p,
            stock: getStock(p.id) // Get stock for the current branch
        }));

        if(productsWithStock.length === 0) {
            toast.error("No hay productos para exportar.");
            return;
        }

        let dataStr = '';
        let fileName = `inventario_${currentBranchId}_${new Date().toISOString()}`;

        if (format === 'json') {
            dataStr = JSON.stringify(productsWithStock, null, 2);
            fileName += '.json';
        } else { // csv
            const headers = Object.keys(productsWithStock[0]).join(',');
            const rows = productsWithStock.map(p => Object.values(p).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
            dataStr = [headers, ...rows].join('\n');
            fileName += '.csv';
        }

        const blob = new Blob([dataStr], { type: `text/${format};charset=utf-8;` });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href);
        logAction(`Inventario exportado a ${format.toUpperCase()} para la sucursal ${currentBranchId}`);
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        type ProductWithStock = Product & { stock: number };

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                let importedData: ProductWithStock[];

                if (file.name.endsWith('.json')) {
                    importedData = JSON.parse(text);
                } else if (file.name.endsWith('.csv')) {
                    const lines = text.split('\n').filter(line => line.trim());
                    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                    importedData = lines.slice(1).map(line => {
                        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Handle commas inside quotes
                        return headers.reduce((obj, header, index) => {
                            const value = (values[index] || '').trim().replace(/"/g, '');
                            if (['lowStockAlert', 'price', 'cost', 'stock'].includes(header)) {
                                (obj as any)[header] = parseFloat(value) || 0;
                            } else {
                                (obj as any)[header] = value;
                            }
                            return obj;
                        }, {} as ProductWithStock);
                    });
                } else {
                    toast.error("Formato de archivo no soportado. Use CSV o JSON.");
                    return;
                }
                
                const existingSkus = new Set(products.map(p => p.sku));
                const newProductsToCreate: Product[] = [];
                const newStockEntries: InventoryStock[] = [];

                importedData.forEach(p => {
                    if (p.sku && !existingSkus.has(p.sku)) {
                        const { stock, ...productData } = p;
                        newProductsToCreate.push(productData);
                        newStockEntries.push({
                            productId: productData.id,
                            branchId: currentBranchId,
                            stock: stock || 0
                        });
                    }
                });
                
                if (newProductsToCreate.length > 0) {
                    setProducts(prev => [...prev, ...newProductsToCreate]);
                    setInventoryStock(prev => [...prev, ...newStockEntries]);
                    logAction(`${newProductsToCreate.length} productos importados. ${importedData.length - newProductsToCreate.length} duplicados omitidos.`);
                    toast.success(`${newProductsToCreate.length} productos importados. ${importedData.length - newProductsToCreate.length} duplicados fueron omitidos.`);
                } else {
                     toast.error("No se importaron productos nuevos. Todos los SKUs del archivo ya existen.");
                }

            } catch (error) {
                console.error("Error al importar archivo:", error);
                toast.error("Hubo un error al procesar el archivo.");
            } finally {
                 if(fileInputRef.current) fileInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };
    
    const downloadTemplate = () => {
         const headers = "id,name,sku,lowStockAlert,price,cost,categoryId,expiryDate,imageUrl,stock";
         const exampleRow = "temp-1,Producto Ejemplo,SKU-000,10,19.99,10,1,2025-12-31,http://example.com/image.png,100";
         const csvContent = `${headers}\n${exampleRow}`;
         const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
         const link = document.createElement("a");
         link.href = URL.createObjectURL(blob);
         link.download = "plantilla_inventario.csv";
         link.click();
         URL.revokeObjectURL(link.href);
    };

    return (
        <div className="container mx-auto flex flex-col h-full">
             {isScannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}
             {productToDelete && (
                <ConfirmModal
                    isOpen={!!productToDelete}
                    title="Confirmar Eliminación"
                    message={`¿Está seguro de que desea eliminar el producto "${productToDelete.name}"? Esta acción eliminará el producto y todo su stock en TODAS las sucursales.`}
                    onConfirm={confirmDeleteProduct}
                    onCancel={() => setProductToDelete(null)}
                />
            )}
            <div className="sm:flex sm:justify-between sm:items-center mb-6 gap-4 flex-shrink-0">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-0">Inventario</h2>
                <div className="flex flex-wrap items-center gap-2">
                     <button onClick={openModalForNew} className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nuevo
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".csv, .json" className="hidden"/>
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 shadow" title="Importar desde CSV/JSON">
                        <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                        Importar
                    </button>
                    <button onClick={() => exportData('csv')} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow" title="Exportar a CSV">
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        CSV
                    </button>
                    <button onClick={() => exportData('json')} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow" title="Exportar a JSON">
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                        JSON
                    </button>
                     <button onClick={downloadTemplate} className="text-sm text-primary-600 hover:underline">Descargar Plantilla</button>
                </div>
            </div>
            
            <div className="mb-4 relative flex-shrink-0">
                <input
                    type="text"
                    placeholder="Buscar productos por nombre, SKU o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-4 pr-12 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button onClick={() => setIsScannerOpen(true)} className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-500 hover:text-primary-600">
                    <CameraIcon className="w-6 h-6" title="Escanear código de barras"/>
                </button>
            </div>

            <div ref={parentRef} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-auto flex-grow">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-10">
                        <tr>
                            <th scope="col" className="px-6 py-3"></th>
                            <th scope="col" className="px-6 py-3">Nombre</th>
                            <th scope="col" className="px-6 py-3">SKU</th>
                            <th scope="col" className="px-6 py-3">Stock (Suc. Actual)</th>
                            <th scope="col" className="px-6 py-3">Precio</th>
                            <th scope="col" className="px-6 py-3">Categoría</th>
                            <th scope="col" className="px-6 py-3">Vencimiento</th>
                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                        {rowVirtualizer.getVirtualItems().map(virtualItem => {
                            const product = filteredProducts[virtualItem.index];
                            const stock = getStock(product.id);
                            const isLowStock = stock > 0 && stock <= product.lowStockAlert;
                            const isExpiring = isProductExpiringSoon(product.expiryDate);
                            const rowClass = isLowStock ? 'bg-red-100 dark:bg-red-900/50' : isExpiring ? 'bg-yellow-100 dark:bg-yellow-900/50' : '';
                            
                            return (
                                <tr key={product.id} className={`border-b dark:border-gray-700 absolute w-full ${rowClass}`}
                                    style={{
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                >
                                    <td className="px-6 py-4">
                                        <img src={product.imageUrl || 'https://via.placeholder.com/40'} alt={product.name} className="w-10 h-10 rounded-md object-cover"/>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">{product.name}</td>
                                    <td className="px-6 py-4">{product.sku}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {stock}
                                            {isLowStock && <ExclamationTriangleIcon title="Stock bajo" className="w-5 h-5 text-red-500 ml-2" />}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{formatCurrency(product.price, settings)}</td>
                                    <td className="px-6 py-4">{getCategoryName(product.categoryId)}</td>
                                    <td className="px-6 py-4">
                                        {product.expiryDate ? formatDate(product.expiryDate, settings) : 'N/A'}
                                        {isExpiring && <ExclamationTriangleIcon title="Próximo a vencer" className="w-5 h-5 text-yellow-500 ml-2 inline" />}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => openModalForEdit(product)} className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-200 mr-2"><PencilIcon className="w-5 h-5" title="Editar Producto"/></button>
                                        <button onClick={() => setProductToDelete(product)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"><TrashIcon className="w-5 h-5" title="Eliminar Producto"/></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {isModalOpen && <ProductFormModal product={editingProduct} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} categories={productCategories} setCategories={setProductCategories} />}
        </div>
    );
};

export default Inventory;