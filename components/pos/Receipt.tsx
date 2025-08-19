import React, { useContext } from 'react';
import { AppContext } from '../../App';
import type { Sale, Customer } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface ReceiptProps {
    sale: Sale & { totalInWords: string, customer: Customer };
}

const Receipt: React.FC<ReceiptProps> = ({ sale }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { settings } = context;

    const printSizes = {
        'letter': 'w-full',
        'half-letter': 'w-1/2',
        '80mm': 'w-[80mm]',
        '58mm': 'w-[58mm]'
    };
    
    const separator = "----------------------------------------";

    return (
        <div id="print-section-container" className="hidden">
            <div id="print-section" className={`p-2 bg-white text-black font-mono text-xs mx-auto ${printSizes[settings.printSize]}`}>
                <div className="text-center">
                    {settings.logoUrl && <img src={settings.logoUrl} alt="logo" className="mx-auto h-16 w-16 my-2" />}
                    <h2 className="text-lg font-bold">{settings.companyName}</h2>
                    <p>{settings.address}</p>
                    <p>Tel: {settings.phone}</p>
                    <p>{settings.slogan}</p>
                    <p>{separator}</p>
                </div>
                <div className="my-2">
                    <p><strong>Recibo:</strong> {sale.id}</p>
                    <p><strong>Fecha:</strong> {new Date(sale.date).toLocaleString()}</p>
                    <p><strong>Cajero:</strong> {sale.user}</p>
                    <p>{separator}</p>
                    <p><strong>Cliente:</strong> {sale.customer.name}</p>
                    <p><strong>NIT:</strong> {sale.customer.nit}</p>
                    <p><strong>Dirección:</strong> {sale.customer.address}</p>
                </div>
                <p>{separator}</p>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left">C/P/D</th>
                            <th className="text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map(item => (
                            <tr key={item.productId}>
                                <td colSpan={2}>{item.name}</td>
                            </tr>
                        ))}
                        {sale.items.map(item => (
                             <tr key={`${item.productId}-price`}>
                                <td>{item.quantity} x {formatCurrency(item.price, settings)}</td>
                                <td className="text-right">{formatCurrency(item.quantity * item.price, settings)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <p>{separator}</p>
                <div className="text-right my-2">
                    <p>Subtotal: {formatCurrency(sale.subtotal, settings)}</p>
                    <p>Impuestos ({settings.taxRate}%){settings.pricesIncludeTax ? " (Incluido)" : ""}: {formatCurrency(sale.tax, settings)}</p>
                    <p className="text-base font-bold">TOTAL: {formatCurrency(sale.total, settings)}</p>
                </div>
                 <p className="text-xs">SON: {sale.totalInWords}</p>
                 <p>{separator}</p>
                <div className="text-center mt-4">
                    <p>{settings.footerMessage}</p>
                    <p>Forma de Pago: {sale.paymentMethod}</p>
                </div>
            </div>
        </div>
    );
};

export default Receipt;
