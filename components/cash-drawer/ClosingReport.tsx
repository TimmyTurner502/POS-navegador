
import React, { useContext, useMemo } from 'react';
import { AppContext } from '../../App';
import { CashDrawerSession } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PrinterIcon } from '../Icons';

interface ClosingReportProps {
    session: CashDrawerSession;
    onClose: () => void;
}

const ClosingReport: React.FC<ClosingReportProps> = ({ session, onClose }) => {
    const context = useContext(AppContext);
    if (!context) return null;
    const { settings, sales } = context;

    const sessionSales = useMemo(() => {
        const startTime = new Date(session.startTime).getTime();
        const endTime = session.endTime ? new Date(session.endTime).getTime() : Date.now();
        return sales.filter(sale => {
            const saleTime = new Date(sale.date).getTime();
            return sale.branchId === session.branchId && saleTime >= startTime && saleTime <= endTime;
        });
    }, [sales, session]);

    const cardSales = sessionSales.filter(s => s.paymentMethod === 'card').reduce((sum, s) => sum + s.total, 0);
    const creditSales = sessionSales.filter(s => s.paymentMethod === 'credit').reduce((sum, s) => sum + s.total, 0);

    const totalInflows = session.movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
    const totalOutflows = session.movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);
    const expectedAmount = session.startAmount + session.cashSales + totalInflows - totalOutflows;

    const handlePrint = () => {
        window.print();
    };
    

    return (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 sm:p-6">
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
                <div id="print-section">
                    <div className="text-center mb-6 border-b pb-4 dark:border-gray-700">
                        <h2 className="text-2xl font-bold">Reporte de Cierre de Caja</h2>
                        <p className="text-gray-500">Sesión ID: {session.id}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <p><strong>Usuario:</strong> {session.user}</p>
                            <p><strong>Fecha de Apertura:</strong> {new Date(session.startTime).toLocaleString()}</p>
                            <p><strong>Fecha de Cierre:</strong> {session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div className="text-right">
                             {settings.logoUrl && <img src={settings.logoUrl} alt="logo" className="h-12 w-auto ml-auto mb-2" />}
                            <p className="font-semibold">{settings.companyName}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-2">Resumen de Efectivo</h3>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b dark:border-gray-700"><td className="py-1">Monto de Apertura</td><td className="text-right font-mono">{formatCurrency(session.startAmount, settings)}</td></tr>
                                    <tr className="border-b dark:border-gray-700"><td className="py-1 text-green-600">(+) Ventas en Efectivo</td><td className="text-right font-mono text-green-600">{formatCurrency(session.cashSales, settings)}</td></tr>
                                    <tr className="border-b dark:border-gray-700"><td className="py-1 text-green-600">(+) Otras Entradas de Efectivo</td><td className="text-right font-mono text-green-600">{formatCurrency(totalInflows, settings)}</td></tr>
                                    <tr className="border-b dark:border-gray-700"><td className="py-1 text-red-500">(-) Salidas de Efectivo</td><td className="text-right font-mono text-red-500">{formatCurrency(totalOutflows, settings)}</td></tr>
                                    <tr className="font-bold"><td className="py-2">Total Esperado en Caja</td><td className="text-right font-mono">{formatCurrency(expectedAmount, settings)}</td></tr>
                                    <tr><td className="py-1">Monto Contado al Cierre</td><td className="text-right font-mono">{formatCurrency(session.endAmount || 0, settings)}</td></tr>
                                    <tr className={`font-bold text-lg ${session.difference === 0 ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}><td className="py-2 px-2">Diferencia de Efectivo</td><td className="text-right font-mono px-2">{formatCurrency(session.difference || 0, settings)}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                            <h3 className="font-bold text-lg mb-2">Desglose de Ventas Totales</h3>
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b dark:border-gray-700"><td className="py-1">Ventas en Efectivo</td><td className="text-right font-mono">{formatCurrency(session.cashSales, settings)}</td></tr>
                                    <tr className="border-b dark:border-gray-700"><td className="py-1">Ventas con Tarjeta</td><td className="text-right font-mono">{formatCurrency(cardSales, settings)}</td></tr>
                                    <tr className="border-b dark:border-gray-700"><td className="py-1">Ventas a Crédito</td><td className="text-right font-mono">{formatCurrency(creditSales, settings)}</td></tr>
                                    <tr className="font-bold text-lg"><td className="py-2">Total de Ventas Registradas</td><td className="text-right font-mono">{formatCurrency(session.cashSales + cardSales + creditSales, settings)}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>


                    <div className="mt-6">
                         <h3 className="font-bold text-lg mb-2">Detalle de Movimientos de Efectivo</h3>
                         {session.movements.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-2 text-left">Descripción</th>
                                        <th className="p-2 text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {session.movements.map(m => (
                                        <tr key={m.id} className="border-b dark:border-gray-700">
                                            <td className="p-2">{m.reason} <span className="text-xs text-gray-500">({m.type === 'in' ? 'Entrada' : 'Salida'})</span></td>
                                            <td className={`p-2 text-right font-mono ${m.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                                                {formatCurrency(m.amount, settings)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         ) : (
                            <p className="text-sm text-gray-500 italic">No hubo movimientos manuales de efectivo en esta sesión.</p>
                         )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end space-x-3 non-printable">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Volver</button>
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                        <PrinterIcon className="w-5 h-5 mr-2"/>Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClosingReport;