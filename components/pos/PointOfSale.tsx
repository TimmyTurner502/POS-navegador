import React, { useState, useContext, useMemo, useEffect } from 'react';
import { AppContext } from '../../App';
import { Product, SaleItem, Customer, Sale } from '../../types';
import { numberToWords } from '../../services/numberToWords';
import { ShoppingCartIcon, TrashIcon, UserPlusIcon, MagnifyingGlassIcon, CreditCardIcon, CameraIcon } from '../Icons';
import Receipt from './Receipt';
import BarcodeScanner from '../common/BarcodeScanner';
import { formatCurrency } from '../../utils/formatters';

const CustomerFormModal: React.FC<{ onClose: () => void, onSave: (customer: Customer) => void }> = ({ onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Customer, 'id' | 'creditLimit' | 'currentBalance' | 'paymentHistory'>>({ name: '', email: '', phone: '', address: '', nit: '', cui: '' });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [e.target.name]: e.target.value}));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, id: Date.now().toString(), creditLimit: 0, currentBalance: 0, paymentHistory: [] });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <h3 className="text-xl font-bold mb-4">Nuevo Cliente</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</span>
                        <input name="name" onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" required/>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">NIT</span>
                            <input name="nit" onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CUI</span>
                            <input name="cui" onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</span>
                            <input name="email" type="email" onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        </label>
                         <label className="block">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</span>
                            <input name="phone" onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                        </label>
                    </div>
                    <label className="block">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dirección</span>
                        <input name="address" onChange={handleChange} className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"/>
                    </label>
                    <div className="flex justify-end space-x-2 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const PaymentModal: React.FC<{ total: number, customer: Customer | undefined, onProcessPayment: (method: Sale['paymentMethod']) => void, onClose: () => void }> = ({ total, customer, onProcessPayment, onClose }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { settings } = context;

    const availableCredit = customer ? customer.creditLimit - customer.currentBalance : 0;
    const canUseCredit = customer && customer.creditLimit > 0 && total <= availableCredit;

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-sm text-center">
                <h3 className="text-2xl font-bold mb-2">Total a Pagar</h3>
                <p className="text-4xl font-mono font-bold text-primary-600 mb-6">{formatCurrency(total, settings)}</p>
                <div className="space-y-3">
                    <button onClick={() => onProcessPayment('cash')} className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600">Efectivo</button>
                    <button onClick={() => onProcessPayment('card')} className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600">Tarjeta</button>
                    <button onClick={() => onProcessPayment('credit')} disabled={!canUseCredit} className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Crédito {customer && `(Disp: ${formatCurrency(availableCredit, settings)})`}
                    </button>
                </div>
                <button onClick={onClose} className="mt-6 text-sm text-gray-500 hover:underline">Cancelar</button>
            </div>
        </div>
    );
};


const PointOfSale: React.FC = () => {
    const context = useContext(AppContext);
    const [cart, setCart] = useState<SaleItem[]>([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('1');
    const [comments, setComments] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [isDiscountInputVisible, setIsDiscountInputVisible] = useState(false);
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [lastSale, setLastSale] = useState<any>(null);

    if (!context) return null;
    const { products, setProducts, sales, setSales, customers, setCustomers, logAction, settings, setSettings, currentUser } = context;

    useEffect(() => {
        // When the selected customer is no longer in the list (e.g. after a search), reset to default.
        if (!customers.find(c => c.id === selectedCustomerId)) {
            setSelectedCustomerId('1');
        }
    }, [customers, selectedCustomerId]);
    
    const filteredProducts = useMemo(() => {
        return products.filter(p => (p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())) && p.stock > 0);
    }, [products, productSearchTerm]);
    
    const filteredCustomers = useMemo(() => {
        return customers.filter(c =>
            c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            c.nit.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            c.cui.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            c.phone.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
        );
    }, [customers, customerSearchTerm]);

    const addToCart = (product: Product) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(item => item.productId === product.id);
            if (existingItem) {
                if (product.stock > existingItem.quantity) {
                    return prevCart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
                }
                alert("No hay más stock disponible para este producto.");
                return prevCart;
            } else {
                return [...prevCart, { productId: product.id, name: product.name, quantity: 1, price: product.price, cost: product.cost }];
            }
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        const product = products.find(p => p.id === productId);
        if (product && quantity > product.stock) {
            alert(`Stock máximo disponible: ${product.stock}`);
            return;
        }
        setCart(cart.map(item => item.productId === productId ? { ...item, quantity } : item).filter(item => item.quantity > 0));
    };
    
    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    const { subtotal, discountAmount, subtotalAfterDiscount, taxAmount, cartTotal } = useMemo(() => {
        const preDiscountTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        const discountAmt = preDiscountTotal * (discountPercentage / 100);
        const postDiscountTotal = preDiscountTotal - discountAmt;

        if (settings.pricesIncludeTax) {
            const total = postDiscountTotal;
            const sub = total / (1 + settings.taxRate / 100);
            const tax = total - sub;
            return { subtotal: preDiscountTotal, discountAmount: discountAmt, subtotalAfterDiscount: postDiscountTotal, taxAmount: tax, cartTotal: total };
        } else {
            const sub = postDiscountTotal;
            const tax = sub * (settings.taxRate / 100);
            const total = sub + tax;
            return { subtotal: preDiscountTotal, discountAmount: discountAmt, subtotalAfterDiscount: postDiscountTotal, taxAmount: tax, cartTotal: total };
        }
    }, [cart, settings.taxRate, settings.pricesIncludeTax, discountPercentage]);
    
    const handleSaveCustomer = (customer: Customer) => {
        setCustomers([...customers, customer]);
        setSelectedCustomerId(customer.id);
        logAction(`Cliente creado: ${customer.name}`, { type: 'customer', id: customer.id });
    };

    const processCheckout = (paymentMethod: Sale['paymentMethod']) => {
        setIsPaymentModalOpen(false);

        const newProducts = [...products];
        for (const item of cart) {
            const productIndex = newProducts.findIndex(p => p.id === item.productId);
            if (productIndex !== -1) {
                newProducts[productIndex].stock -= item.quantity;
            }
        }
        setProducts(newProducts);

        const customer = customers.find(c => c.id === selectedCustomerId) || customers[0];

        if (paymentMethod === 'credit') {
            const newCustomers = customers.map(c => 
                c.id === customer.id ? { ...c, currentBalance: c.currentBalance + cartTotal } : c
            );
            setCustomers(newCustomers);
        }
        
        const saleId = settings.enableCorrelative
            ? `${settings.documentPrefix}${settings.correlativeNextNumber.toString().padStart(5, '0')}`
            : `${settings.documentPrefix}${Date.now()}`;


        const newSale: Sale = {
            id: saleId,
            date: new Date().toISOString(),
            customerId: selectedCustomerId,
            customerName: customer.name,
            items: cart,
            subtotal: subtotalAfterDiscount, // Subtotal after discount
            discountPercentage: discountPercentage,
            tax: taxAmount,
            total: cartTotal,
            user: currentUser.name,
            paymentMethod: paymentMethod,
            comments: comments.trim(),
        };

        setSales([...sales, newSale]);
        if (settings.enableCorrelative) {
            setSettings(prev => ({...prev, correlativeNextNumber: prev.correlativeNextNumber + 1}));
        }

        logAction(`Venta #${newSale.id} (${paymentMethod}) por ${formatCurrency(newSale.total, settings)}`, { type: 'sale', id: newSale.id });
        
        setLastSale({ ...newSale, customer, totalInWords: numberToWords(newSale.total) });
        setCart([]);
        setComments('');
        setDiscountPercentage(0);
        setIsDiscountInputVisible(false);
        
        setTimeout(() => {
            window.print();
        }, 500);
    };

    const startCheckout = () => {
        if (cart.length === 0) {
            alert("El carrito está vacío.");
            return;
        }
        setIsPaymentModalOpen(true);
    };
    
    const handleScan = (result: string) => {
        const scannedProduct = products.find(p => p.sku === result);
        if (scannedProduct) {
            addToCart(scannedProduct);
        } else {
            alert(`Producto con SKU "${result}" no encontrado.`);
        }
        setIsScannerOpen(false);
    }

    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-4">
             {lastSale && <Receipt sale={lastSale} />}
             {isPaymentModalOpen && <PaymentModal total={cartTotal} customer={selectedCustomer} onProcessPayment={processCheckout} onClose={() => setIsPaymentModalOpen(false)} />}
             {isScannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setIsScannerOpen(false)} />}

            {/* Product Grid */}
            <div className="lg:w-2/3 bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 flex flex-col">
                 <div className="relative mb-4">
                    <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar productos por nombre o SKU..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="w-full p-2 pl-10 pr-10 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    />
                    <button onClick={() => setIsScannerOpen(true)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 hover:text-primary-600">
                      <CameraIcon className="w-6 h-6" title="Escanear código"/>
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {filteredProducts.map(product => (
                            <div key={product.id} onClick={() => addToCart(product)} className="border dark:border-gray-700 rounded-lg p-3 text-center cursor-pointer hover:shadow-lg hover:border-primary-500 transition-all">
                                <img src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200`} alt={product.name} className="w-full h-24 object-cover rounded-md mb-2" />
                                <h4 className="font-semibold text-sm truncate">{product.name}</h4>
                                <p className="text-primary-500 font-bold">{formatCurrency(product.price, settings)}</p>
                                <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart and Checkout */}
            <div className="lg:w-1/3 bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 flex flex-col">
                <h3 className="text-xl font-bold mb-4 flex items-center"><ShoppingCartIcon className="w-6 h-6 mr-2"/> Carrito</h3>
                <div className="flex items-center mb-4 gap-2">
                     <div className="flex-grow relative">
                         <input
                            type="text"
                            placeholder="Buscar cliente por nombre, NIT, CUI..."
                            value={customerSearchTerm}
                            onChange={(e) => setCustomerSearchTerm(e.target.value)}
                            className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        />
                         <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
                            {filteredCustomers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.nit})</option>)}
                        </select>
                    </div>
                    <button onClick={() => setIsCustomerModalOpen(true)} className="p-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200">
                        <UserPlusIcon className="w-6 h-6" title="Crear nuevo cliente"/>
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto mb-4 border-t border-b dark:border-gray-700 py-2">
                    {cart.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">El carrito está vacío</p>
                    ) : (
                        <ul className="space-y-3">
                            {cart.map(item => (
                                <li key={item.productId} className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-sm">{item.name}</p>
                                        <p className="text-xs text-gray-500">{formatCurrency(item.price, settings)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))} className="w-16 p-1 text-center border rounded dark:bg-gray-800 dark:border-gray-700" min="1" />
                                        <button onClick={() => removeFromCart(item.productId)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" title="Quitar del carrito"/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="space-y-2">
                     <label>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Comentarios</span>
                        <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Añadir un comentario a la venta..." rows={2} className="mt-1 w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 text-sm"></textarea>
                    </label>
                    <div className="flex justify-between items-center text-sm pt-2">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal, settings)}</span>
                    </div>

                    {!isDiscountInputVisible && (
                         <button onClick={() => setIsDiscountInputVisible(true)} className="text-sm text-primary-600 hover:underline text-left">Aplicar descuento</button>
                    )}
                   
                    {isDiscountInputVisible && (
                         <div className="flex items-center justify-between text-sm">
                           <label htmlFor="discount" className="text-red-500">Descuento (%):</label>
                           <input 
                              id="discount"
                              type="number" 
                              value={discountPercentage} 
                              onChange={e => setDiscountPercentage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                              className="w-20 p-1 text-right border rounded dark:bg-gray-800"
                           />
                        </div>
                    )}
                    {discountAmount > 0 && (
                         <div className="flex justify-between text-sm text-red-500">
                            <span>Descuento aplicado:</span>
                            <span>- {formatCurrency(discountAmount, settings)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm">
                        <span>Impuestos ({settings.taxRate}%):</span>
                        <span>{formatCurrency(taxAmount, settings)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-lg border-t pt-1 dark:border-gray-700">
                        <span>Total:</span>
                        <span>{formatCurrency(cartTotal, settings)}</span>
                    </div>
                    <button onClick={startCheckout} disabled={cart.length === 0} className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                        Cobrar
                    </button>
                </div>
            </div>
            {isCustomerModalOpen && <CustomerFormModal onClose={() => setIsCustomerModalOpen(false)} onSave={handleSaveCustomer} />}
        </div>
    );
};

export default PointOfSale;