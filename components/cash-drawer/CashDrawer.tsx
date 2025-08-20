
import React, { useState, useContext } from 'react';
import { AppContext } from '../../App';
import { CashDrawerMovement, CashDrawerSession } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { PaperClipIcon } from '../Icons';
import ClosingReport from './ClosingReport';

const CloseDrawerModal: React.FC<{
    expectedAmount: number,
    onClose: () => void,
    onConfirm: (finalAmount: number) => void
}> = ({ expectedAmount, onClose, onConfirm }) => {
    const context = useContext(AppContext);
    const [countedAmount, setCountedAmount] = useState<number | string>("");

    if (!context) return null;
    const { settings } = context;

    const difference = typeof countedAmount === 'number' ? countedAmount - expectedAmount : 0;

    const handleSubmit = () => {
        if (typeof countedAmount !== 'number' || countedAmount < 0) {
            toast.error("Por favor ingrese un monto válido.");
            return;
        }
        onConfirm(countedAmount);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-4">Cerrar Caja</h2>
                <p className="mb-4">Monto esperado en caja: <span className="font-bold">{formatCurrency(expectedAmount, settings)}</span></p>
                <label className="block">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monto Final Contado</span>
                    <input
                        type="number"
                        value={countedAmount}
                        onChange={(e) => setCountedAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                        className="mt-1 w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                        autoFocus
                    />
                </label>
                {typeof countedAmount === 'number' && countedAmount > 0 && (
                     <div className={`mt-4 p-3 rounded-lg text-center font-bold ${difference === 0 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'}`}>
                        {difference > 0 && `Sobrante: ${formatCurrency(difference, settings)}`}
                        {difference < 0 && `Faltante: ${formatCurrency(Math.abs(difference), settings)}`}
                        {difference === 0 && '¡Cuadre Perfecto!'}
                    </div>
                )}
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg hover:bg-gray-400">Cancelar</button>
                    <button onClick={handleSubmit} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">Confirmar Cierre</button>
                </div>
            </div>
        </div>
    );
};


const CashDrawer: React.FC = () => {
    const context = useContext(AppContext);
    const [startAmount, setStartAmount] = useState<number | string>('');
    const [movement, setMovement] = useState({ type: 'in' as 'in' | 'out', amount: 0, reason: '', receiptImageUrl: '' });
    const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [viewingReport, setViewingReport] = useState<CashDrawerSession | null>(null);


    if (!context) return null;
    const { activeCashDrawerSession, setActiveCashDrawerSession, cashDrawerHistory, setCashDrawerHistory, currentUser, logAction, settings, currentBranchId } = context;

    const handleOpenDrawer = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = typeof startAmount === 'number' ? startAmount : parseFloat(startAmount);
        if (isNaN(amount) || amount < 0) {
            toast.error("Por favor, ingrese un monto inicial válido.");
            return;
        }

        const newSession: CashDrawerSession = {
            id: `CD-${Date.now()}`,
            startTime: new Date().toISOString(),
            startAmount: amount,
            cashSales: 0,
            movements: [],
            status: 'open',
            user: currentUser.name,
            branchId: currentBranchId,
        };
        setActiveCashDrawerSession(newSession);
        logAction(`Apertura de caja con ${formatCurrency(amount, settings)}`, { type: 'cash_drawer', id: newSession.id });
        setStartAmount('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setMovement(prev => ({ ...prev, receiptImageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAddMovement = (e: React.FormEvent) => {
        e.preventDefault();
        if (movement.amount <= 0 || !movement.reason.trim()) {
            toast.error("Por favor, complete todos los campos para el movimiento.");
            return;
        }

        const newMovement: CashDrawerMovement = {
            id: `M-${Date.now()}`,
            timestamp: new Date().toISOString(),
            user: currentUser.name,
            type: movement.type,
            amount: movement.amount,
            reason: movement.reason,
            receiptImageUrl: movement.receiptImageUrl || undefined,
        };
        
        setActiveCashDrawerSession(prev => prev ? { ...prev, movements: [newMovement, ...prev.movements] } : null);
        logAction(`Movimiento de caja (${movement.type}): ${formatCurrency(movement.amount, settings)} por ${movement.reason}`);
        setMovement({ type: 'in', amount: 0, reason: '', receiptImageUrl: '' });
    };
    
    const handleCloseDrawer = (finalAmount: number) => {
        if (!activeCashDrawerSession) return;

        const totalInflows = activeCashDrawerSession.movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
        const totalOutflows = activeCashDrawerSession.movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);
        const expectedAmount = activeCashDrawerSession.startAmount + activeCashDrawerSession.cashSales + totalInflows - totalOutflows;

        const closedSession: CashDrawerSession = {
            ...activeCashDrawerSession,
            endTime: new Date().toISOString(),
            endAmount: finalAmount,
            difference: finalAmount - expectedAmount,
            status: 'closed'
        };
        
        setCashDrawerHistory(prev => [closedSession, ...prev]);
        setActiveCashDrawerSession(null);
        logAction(`Cierre de caja. Esperado: ${formatCurrency(expectedAmount, settings)}, Contado: ${formatCurrency(finalAmount, settings)}`, {type: 'cash_drawer', id: closedSession.id});
        setIsCloseModalOpen(false);
        toast.success("Caja cerrada exitosamente.");
    };

    if (viewingReport) {
        return <ClosingReport session={viewingReport} onClose={() => setViewingReport(null)} />;
    }

    if (!activeCashDrawerSession) {
        return (
            <div>
                 <div className="max-w-md mx-auto mt-10">
                    <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-md text-center">
                        <h2 className="text-2xl font-bold mb-4">Abrir Caja</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">Ingrese el monto inicial de efectivo en la caja para comenzar el día.</p>
                        <form onSubmit={handleOpenDrawer}>
                            <input
                                type="number"
                                value={startAmount}
                                onChange={(e) => setStartAmount(e.target.value)}
                                placeholder="Monto inicial"
                                className="w-full p-3 text-center text-xl border rounded-md dark:bg-gray-800 dark:border-gray-700 mb-4"
                                autoFocus
                            />
                            <button type="submit" className="w-full py-3 bg-primary-500 text-white font-bold rounded-lg hover:bg-primary-600">
                                Iniciar Sesión de Caja
                            </button>
                        </form>
                    </div>
                </div>
                 {cashDrawerHistory.length > 0 && (
                    <div className="mt-10 max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Historial de Cajas Cerradas</h3>
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
                             <ul className="divide-y dark:divide-gray-700">
                                {cashDrawerHistory.slice(0, 5).map(session => (
                                    <li key={session.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">Cierre por: {session.user} - {formatDate(session.endTime!, settings)}</p>
                                            <p className="text-sm text-gray-500">Diferencia: <span className={session.difference === 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(session.difference || 0, settings)}</span></p>
                                        </div>
                                        <button onClick={() => setViewingReport(session)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">
                                            Ver Reporte
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const totalInflows = activeCashDrawerSession.movements.filter(m => m.type === 'in').reduce((sum, m) => sum + m.amount, 0);
    const totalOutflows = activeCashDrawerSession.movements.filter(m => m.type === 'out').reduce((sum, m) => sum + m.amount, 0);
    const expectedAmount = activeCashDrawerSession.startAmount + activeCashDrawerSession.cashSales + totalInflows - totalOutflows;

    return (
        <div>
             {isCloseModalOpen && <CloseDrawerModal expectedAmount={expectedAmount} onClose={() => setIsCloseModalOpen(false)} onConfirm={handleCloseDrawer} />}
             {viewingImage && (
                <div onClick={() => setViewingImage(null)} className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
                    <img src={viewingImage} alt="Comprobante" className="max-w-full max-h-full object-contain" />
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Módulo de Caja - Sesión Activa</h2>
                <button onClick={() => setIsCloseModalOpen(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Cerrar Caja</button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md space-y-4">
                     <h3 className="text-xl font-semibold border-b pb-2 dark:border-gray-700">Resumen de Caja</h3>
                     <div className="flex justify-between"><span>Apertura:</span> <span className="font-mono">{formatCurrency(activeCashDrawerSession.startAmount, settings)}</span></div>
                     <div className="flex justify-between text-green-600"><span>(+) Ventas Efectivo:</span> <span className="font-mono">{formatCurrency(activeCashDrawerSession.cashSales, settings)}</span></div>
                     <div className="flex justify-between text-green-600"><span>(+) Otras Entradas:</span> <span className="font-mono">{formatCurrency(totalInflows, settings)}</span></div>
                     <div className="flex justify-between text-red-500"><span>(-) Salidas:</span> <span className="font-mono">{formatCurrency(totalOutflows, settings)}</span></div>
                     <div className="flex justify-between font-bold text-lg border-t pt-2 dark:border-gray-700"><span>Esperado en Caja:</span> <span className="font-mono">{formatCurrency(expectedAmount, settings)}</span></div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                     <h3 className="text-xl font-semibold mb-4">Registrar Movimiento de Caja</h3>
                     <form onSubmit={handleAddMovement} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="sm:col-span-2"><label className="block text-sm font-medium">Descripción</label><input type="text" value={movement.reason} onChange={e => setMovement(p => ({...p, reason: e.target.value}))} className="mt-1 p-2 w-full border rounded dark:bg-gray-700" /></div>
                         <div><label className="block text-sm font-medium">Monto</label><input type="number" value={movement.amount} onChange={e => setMovement(p => ({...p, amount: parseFloat(e.target.value) || 0}))} className="mt-1 p-2 w-full border rounded dark:bg-gray-700" /></div>
                         <div><label className="block text-sm font-medium">Tipo</label><select value={movement.type} onChange={e => setMovement(p => ({...p, type: e.target.value as any}))} className="mt-1 p-2 w-full border rounded dark:bg-gray-700"><option value="in">Entrada</option><option value="out">Salida</option></select></div>
                         <div className="sm:col-span-2"><label className="block text-sm font-medium">Comprobante (Opcional)</label><input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"/></div>
                         <button type="submit" className="w-full sm:col-span-2 py-2 bg-primary-500 text-white rounded-lg self-end">Añadir</button>
                     </form>
                     <div className="mt-6">
                        <h4 className="font-semibold mb-2">Movimientos Recientes</h4>
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {activeCashDrawerSession.movements.map(m => (
                                <li key={m.id} className="flex justify-between items-center p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                                    <div className="flex items-center">
                                        {m.receiptImageUrl && <button onClick={() => setViewingImage(m.receiptImageUrl!)} className="mr-3 text-gray-500 hover:text-primary-500"><PaperClipIcon className="w-5 h-5"/></button>}
                                        <div>
                                            <p className="font-semibold">{m.reason}</p>
                                            <p className="text-xs text-gray-500">{new Date(m.timestamp).toLocaleTimeString()} - {m.user}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold ${m.type === 'in' ? 'text-green-600' : 'text-red-500'}`}>
                                        {m.type === 'in' ? '+' : '-'} {formatCurrency(m.amount, settings)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default CashDrawer;
