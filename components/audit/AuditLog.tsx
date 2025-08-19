import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../../App';
import { MagnifyingGlassIcon, EyeIcon, PrinterIcon } from '../Icons';
import { Sale, Purchase, Expense, Product, Customer, Supplier, User } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { numberToWords } from '../../services/numberToWords';
import Receipt from '../pos/Receipt';

const DetailsViewer: React.FC<{ details: any, onClose: () => void }> = ({ details, onClose }) => {
    const context = useContext(AppContext);
    const [saleToPrint, setSaleToPrint] = useState<any>(null);

    if (!context) return null;
    const { settings, customers } = context;

    let content = <p>No hay detalles para este tipo de registro.</p>;
    let title = "Detalles del Registro";
    let footerButtons = (
         <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cerrar</button>
    );

    const handlePrint = (sale: Sale) => {
        const customer = customers.find(c => c.id === sale.customerId) || customers[0];
        setSaleToPrint({ ...sale, customer, totalInWords: numberToWords(sale.total) });
        setTimeout(() => window.print(), 300);
        setTimeout(() => setSaleToPrint(null), 1000);
    }
    
    if (details.type === 'sale') {
        const sale = details.data as Sale;
        title = `Detalles de Venta #${sale.id}`;
        content = (
            <div className="text-sm space-y-3">
                <p><strong>Cliente:</strong> {sale.customerName}</p>
                <p><strong>Total:</strong> {formatCurrency(sale.total, settings)}</p>
                <p><strong>Método de Pago:</strong> <span className="capitalize">{sale.paymentMethod}</span></p>
                <table className="w-full text-xs my-2">
                    <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-1 text-left">Producto</th><th className="p-1 text-center">Cant.</th><th className="p-1 text-right">Precio</th><th className="p-1 text-right">Subtotal</th></tr></thead>
                    <tbody>{sale.items.map(i => <tr key={i.productId} className="border-b dark:border-gray-600"><td className="p-1">{i.name}</td><td className="p-1 text-center">{i.quantity}</td><td className="p-1 text-right">{formatCurrency(i.price, settings)}</td><td className="p-1 text-right">{formatCurrency(i.price * i.quantity, settings)}</td></tr>)}</tbody>
                </table>
                <div className="mt-2 pt-2 border-t dark:border-gray-600">
                    <h4 className="font-semibold">Comentarios:</h4>
                    <p className="italic text-gray-600 dark:text-gray-400">{sale.comments || "No hay comentarios."}</p>
                </div>
            </div>
        );
        footerButtons = (
            <>
                <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cerrar</button>
                <button onClick={() => handlePrint(sale)} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><PrinterIcon className="w-4 h-4 mr-2"/> Reimprimir</button>
            </>
        )
    } else if (details.type === 'purchase') {
         const purchase = details.data as Purchase;
         title = `Detalles de Compra #${purchase.id}`;
         content = (
             <div className="text-sm space-y-3">
                 <p><strong>Proveedor:</strong> {purchase.supplierName}</p>
                 <p><strong>Total:</strong> {formatCurrency(purchase.total, settings)}</p>
                 <table className="w-full text-xs my-2">
                    <thead className="bg-gray-100 dark:bg-gray-700"><tr><th className="p-1 text-left">Producto</th><th className="p-1 text-center">Cant.</th><th className="p-1 text-right">Costo</th><th className="p-1 text-right">Subtotal</th></tr></thead>
                    <tbody>{purchase.items.map(i => <tr key={i.productId} className="border-b dark:border-gray-600"><td className="p-1">{i.name}</td><td className="p-1 text-center">{i.quantity}</td><td className="p-1 text-right">{formatCurrency(i.cost, settings)}</td><td className="p-1 text-right">{formatCurrency(i.cost * i.quantity, settings)}</td></tr>)}</tbody>
                 </table>
                 <div className="mt-2 pt-2 border-t dark:border-gray-600">
                    <h4 className="font-semibold">Comentarios:</h4>
                    <p className="italic text-gray-600 dark:text-gray-400">{purchase.comments || "No hay comentarios."}</p>
                 </div>
            </div>
        )
    } else if (details.type === 'expense') {
        const expense = details.data as Expense;
        title = `Detalle de Gasto`;
        content = (
            <div className="text-sm space-y-3">
                <p><strong>Descripción:</strong> {expense.description}</p>
                <p><strong>Monto:</strong> {formatCurrency(expense.amount, settings)}</p>
                <p><strong>Forma de Pago:</strong> <span className="capitalize">{expense.paymentMethod}</span></p>
                 {expense.receiptImageUrl && (
                    <div className="mt-2 pt-2 border-t dark:border-gray-600">
                         <h4 className="font-semibold">Comprobante:</h4>
                        <img src={expense.receiptImageUrl} alt="comprobante" className="mt-1 rounded-md max-w-full max-h-48 object-contain" />
                    </div>
                )}
            </div>
        )
    }


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
             {saleToPrint && <Receipt sale={saleToPrint} />}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4">{title}</h2>
                <div className="flex-grow overflow-y-auto pr-2">{content}</div>
                <div className="mt-6 flex justify-end space-x-2">
                   {footerButtons}
                </div>
            </div>
        </div>
    );
}

const AuditLogComponent: React.FC = () => {
    const context = useContext(AppContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [viewingDetails, setViewingDetails] = useState<any>(null);
    const logsPerPage = 15;

    if (!context) return null;
    const { auditLog, sales, purchases, expenses, products, customers, suppliers, users } = context;

    const handleViewDetails = (logDetails: any) => {
        let data: Sale | Purchase | Expense | Product | Customer | Supplier | User | undefined = undefined;
        switch(logDetails.type) {
            case 'sale': data = sales.find(d => d.id === logDetails.id); break;
            case 'purchase': data = purchases.find(d => d.id === logDetails.id); break;
            case 'expense': data = expenses.find(d => d.id === logDetails.id); break;
            case 'product': data = products.find(d => d.id === logDetails.id); break;
            case 'customer': data = customers.find(d => d.id === logDetails.id); break;
            case 'supplier': data = suppliers.find(d => d.id === logDetails.id); break;
            case 'user': data = users.find(d => d.id === logDetails.id); break;
        }
        if (data) {
            setViewingDetails({ type: logDetails.type, data });
        } else {
            alert("No se pudo encontrar el registro detallado. Puede haber sido eliminado.");
        }
    }

    const filteredLogs = useMemo(() => {
        return auditLog.filter(log =>
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [auditLog, searchTerm]);

    const indexOfLastLog = currentPage * logsPerPage;
    const indexOfFirstLog = indexOfLastLog - logsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

    const paginate = (pageNumber: number) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };

    return (
        <div className="container mx-auto">
            {viewingDetails && <DetailsViewer details={viewingDetails} onClose={() => setViewingDetails(null)} />}
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Historial de Actividad</h2>

            <div className="mb-4 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por usuario o acción..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                    }}
                    className="w-full p-3 pl-10 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">Fecha y Hora</th>
                            <th scope="col" className="px-6 py-3">Usuario</th>
                            <th scope="col" className="px-6 py-3">Acción</th>
                            <th scope="col" className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentLogs.map(log => (
                            <tr key={log.id} className="border-b dark:border-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{log.user}</td>
                                <td className="px-6 py-4">{log.action}</td>
                                <td className="px-6 py-4">
                                    {log.details && (
                                        <button onClick={() => handleViewDetails(log.details)} className="text-primary-600 hover:text-primary-800">
                                            <EyeIcon className="w-5 h-5" title="Ver Detalles"/>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {currentLogs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="text-center py-8 text-gray-500">No se encontraron registros.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {totalPages > 1 && (
                 <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-700 dark:text-gray-400">
                        Página {currentPage} de {totalPages}
                    </span>
                    <div className="inline-flex rounded-md shadow-sm">
                        <button 
                            onClick={() => paginate(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            Anterior
                        </button>
                        <button 
                            onClick={() => paginate(currentPage + 1)} 
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-lg hover:bg-gray-100 disabled:opacity-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogComponent;