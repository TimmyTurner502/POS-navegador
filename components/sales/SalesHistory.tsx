


import React, { useContext, useState, useRef, useMemo } from 'react';
import { AppContext } from '../../App';
import { Sale } from '../../types';
import Receipt from '../pos/Receipt';
import { numberToWords } from '../../services/numberToWords';
import { EyeIcon, PrinterIcon, DocumentDuplicateIcon } from '../Icons';
import { formatCurrency } from '../../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';


const SaleDetailModal: React.FC<{ sale: Sale, onClose: () => void }> = ({ sale, onClose }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { settings, customers } = context;

    const customer = customers.find(c => c.id === sale.customerId);
    const subtotalBeforeDiscount = sale.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountAmount = subtotalBeforeDiscount * (sale.discountPercentage / 100);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">Detalle de Venta #{sale.id}</h2>
                <div className="text-sm space-y-2 mb-4">
                    <p><strong>Fecha:</strong> {new Date(sale.date).toLocaleString()}</p>
                    <p><strong>Cliente:</strong> {sale.customerName}</p>
                    {customer && <p><strong>NIT / CUI:</strong> {customer.nit || 'N/A'} / {customer.cui || 'N/A'}</p>}
                    <p><strong>Vendedor:</strong> {sale.user}</p>
                    <p><strong>Método de Pago:</strong> <span className="capitalize">{sale.paymentMethod}</span></p>
                </div>
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr className="border-b dark:border-gray-700">
                            <th className="text-left p-2 font-semibold">Producto</th>
                            <th className="text-center p-2 font-semibold">Cant.</th>
                            <th className="text-right p-2 font-semibold">Precio Unit.</th>
                            <th className="text-right p-2 font-semibold">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map(item => (
                            <tr key={item.productId} className="border-b dark:border-gray-600">
                                <td className="p-2">{item.name}</td>
                                <td className="text-center p-2">{item.quantity}</td>
                                <td className="text-right p-2">{formatCurrency(item.price, settings)}</td>
                                <td className="text-right p-2">{formatCurrency(item.price * item.quantity, settings)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="mt-4 pt-4 border-t dark:border-gray-700 text-right space-y-1">
                    <p>Subtotal: {formatCurrency(subtotalBeforeDiscount, settings)}</p>
                    {sale.discountPercentage > 0 && (
                        <p className="text-red-500">Descuento ({sale.discountPercentage}%): -{formatCurrency(discountAmount, settings)}</p>
                    )}
                    <p>Impuestos ({settings.taxRate}%): {formatCurrency(sale.tax, settings)}</p>
                    <p className="font-bold text-lg">Total: {formatCurrency(sale.total, settings)}</p>
                </div>
                 <div className="mt-4 pt-4 border-t dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-white">Comentarios:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-1 bg-gray-50 dark:bg-gray-900 p-2 rounded-md">
                        {sale.comments || "No hay comentarios."}
                    </p>
                </div>
                <div className="mt-6 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

const PrintPreviewModal: React.FC<{ sale: any, onClose: () => void }> = ({ sale, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);
    
    const handlePrint = () => {
        const printContent = printRef.current?.querySelector('#print-section-clone');
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Recibo</title>');
            // Inline critical styles for printing
            printWindow.document.write('<style>body { margin: 0; font-family: monospace; } table { width: 100%; border-collapse: collapse; } th, td { padding: 2px; } .text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; } .font-bold { font-weight: bold; } .text-xs { font-size: 12px; } .text-sm { font-size: 14px; } .text-base { font-size: 16px; } .text-lg { font-size: 18px; } .my-2 { margin-top: 8px; margin-bottom: 8px; } .mt-4 { margin-top: 16px; } .mx-auto { margin-left: auto; margin-right: auto; } .h-16 { height: 64px; } .w-16 { width: 64px; } img { max-width: 100%; height: auto; }</style>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    };

    const handleDownloadPdf = () => {
        const input = printRef.current?.querySelector('#print-section-clone');
        if (input) {
            html2canvas(input as HTMLElement, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [canvas.width, canvas.height]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`recibo-${sale.id}.pdf`);
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 pt-10 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-xl">
                 <h2 className="text-2xl font-bold mb-4">Vista Previa</h2>
                 <div className="border dark:border-gray-700 p-2 overflow-y-auto max-h-[60vh]" ref={printRef}>
                    <div id="print-section-wrapper" className="bg-gray-200 p-4">
                        <div id="print-section-clone">
                         <Receipt sale={sale} />
                        </div>
                    </div>
                 </div>
                 <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cerrar</button>
                    <button onClick={handleDownloadPdf} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><DocumentDuplicateIcon className="w-5 h-5 mr-2"/> PDF</button>
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><PrinterIcon className="w-5 h-5 mr-2"/> Imprimir</button>
                </div>
            </div>
        </div>
    );
};


const SalesHistory: React.FC = () => {
    const context = useContext(AppContext);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [saleToPrint, setSaleToPrint] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    if (!context) return null;
    const { settings, customers, sales } = context;

    const handleOpenPrintPreview = (sale: Sale) => {
        const customer = customers.find(c => c.id === sale.customerId) || customers[0];
        setSaleToPrint({ ...sale, customer, totalInWords: numberToWords(sale.total) });
    };

    const filteredSales = useMemo(() => {
        return sales.filter(sale =>
            sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            new Date(sale.date).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [sales, searchTerm]);

    return (
        <div className="container mx-auto">
            <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
              {saleToPrint && <Receipt sale={saleToPrint} />}
            </div>
            
            {saleToPrint && <PrintPreviewModal sale={saleToPrint} onClose={() => setSaleToPrint(null)} />}

            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Historial de Ventas</h2>

            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por ID, cliente, fecha..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th scope="col" className="px-6 py-3">ID Venta</th>
                            <th scope="col" className="px-6 py-3">Fecha</th>
                            <th scope="col" className="px-6 py-3">Cliente</th>
                            <th scope="col" className="px-6 py-3">Total</th>
                            <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map(sale => (
                            <tr key={sale.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{sale.id}</td>
                                <td className="px-6 py-4">{new Date(sale.date).toLocaleString()}</td>
                                <td className="px-6 py-4">{sale.customerName}</td>
                                <td className="px-6 py-4">{formatCurrency(sale.total, settings)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => setSelectedSale(sale)} className="text-blue-600 hover:text-blue-800 mr-2"><EyeIcon className="w-5 h-5" title="Ver Detalles"/></button>
                                    <button onClick={() => handleOpenPrintPreview(sale)} className="text-green-600 hover:text-green-800">
                                        <PrinterIcon className="w-5 h-5" title="Imprimir Recibo"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedSale && <SaleDetailModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}
        </div>
    );
};

export default SalesHistory;