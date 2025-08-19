import React, { useContext, useState } from 'react';
import { AppContext } from '../../App';
import { Category, Settings as SettingsType, ExpenseCategory } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon } from '../Icons';
import ConfirmModal from '../common/ConfirmModal';
import toast from 'react-hot-toast';

const CategoryManager: React.FC<{
    title: string;
    categories: (Category | ExpenseCategory)[];
    setCategories: React.Dispatch<React.SetStateAction<any[]>>;
    logActionPrefix: string;
}> = ({ title, categories, setCategories, logActionPrefix }) => {
    const context = useContext(AppContext);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [editingCategory, setEditingCategory] = useState<Category | ExpenseCategory | null>(null);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | ExpenseCategory | null>(null);

    if (!context) return null;
    const { logAction } = context;

    const handleAddCategory = () => {
        if (newCategoryName.trim() === "") return;
        const cat = { id: Date.now().toString(), name: newCategoryName.trim() };
        setCategories((prev: any) => [...prev, cat]);
        logAction(`${logActionPrefix} creada: ${cat.name}`);
        setNewCategoryName("");
    };

    const handleUpdateCategory = () => {
        if (!editingCategory || editingCategory.name.trim() === "") return;
        setCategories((prev: any) => prev.map((c: any) => c.id === editingCategory.id ? editingCategory : c));
        logAction(`${logActionPrefix} actualizada: ${editingCategory.name}`);
        setEditingCategory(null);
    };

    const confirmDeleteCategory = () => {
        if (!categoryToDelete) return;
        setCategories((prev: any) => prev.filter((c: any) => c.id !== categoryToDelete.id));
        logAction(`${logActionPrefix} eliminada: ${categoryToDelete.name}`);
        setCategoryToDelete(null);
    };

    return (
        <div>
            {categoryToDelete && (
                <ConfirmModal
                    isOpen={!!categoryToDelete}
                    title={`Eliminar Categoría`}
                    message={`¿Seguro que quieres eliminar la categoría "${categoryToDelete.name}"?`}
                    onConfirm={confirmDeleteCategory}
                    onCancel={() => setCategoryToDelete(null)}
                />
            )}
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
             <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={(e) => setNewCategoryName(e.target.value)} 
                    placeholder="Nueva categoría"
                    className="flex-grow p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
                />
                <button onClick={handleAddCategory} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"><PlusIcon className="w-5 h-5" /></button>
            </div>
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {categories.map(cat => (
                    <li key={cat.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                        {editingCategory?.id === cat.id ? (
                            <input 
                                type="text" 
                                value={editingCategory.name} 
                                onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})}
                                className="flex-grow p-1 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                onBlur={handleUpdateCategory}
                                onKeyDown={e => e.key === 'Enter' && handleUpdateCategory()}
                                autoFocus
                            />
                        ) : (
                            <span className="truncate">{cat.name}</span>
                        )}
                        <div className="flex-shrink-0">
                            <button onClick={() => setEditingCategory(cat)} className="text-primary-600 hover:text-primary-800 mr-2" title="Editar"><PencilIcon className="w-4 h-4" /></button>
                            <button onClick={() => setCategoryToDelete(cat)} className="text-red-600 hover:text-red-800" title="Eliminar"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

const Settings: React.FC = () => {
    const context = useContext(AppContext);
    const [foundDevices, setFoundDevices] = useState<any[]>([]);

    if (!context) return null;

    const { settings, setSettings, logAction, productCategories, setProductCategories, expenseCategories, setExpenseCategories } = context;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setSettings(prev => ({...prev, [name]: checked} as SettingsType));
        } else {
            const parsedValue = type === 'number' ? parseFloat(value) : value;
            setSettings(prev => ({...prev, [name]: parsedValue} as SettingsType));
        }
    };
    
    const handleFindPrinters = async () => {
        try {
            // Placeholder: In a real app, you might filter for specific services like printing services.
            alert('Buscando impresoras Bluetooth... Asegúrese de que su impresora esté visible.');
            const device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true });
            setFoundDevices(prev => [...prev, device]);
             alert(`Dispositivo encontrado: ${device.name || `ID: ${device.id}`}`);
        } catch (error) {
            console.error('Error al buscar dispositivos Bluetooth:', error);
            alert('No se pudo buscar dispositivos. Asegúrese de que el Bluetooth esté activado y haya concedido permisos.');
        }
    };
    
    const handleSave = () => {
        logAction("Configuración actualizada");
        toast.success('¡Configuración guardada con éxito!');
    };

    const palettes = [
      { name: 'theme-default', color: 'bg-blue-500' },
      { name: 'theme-teal', color: 'bg-teal-500' },
      { name: 'theme-rose', color: 'bg-rose-500' },
      { name: 'theme-amber', color: 'bg-amber-500' },
    ];

    return (
        <div className="container mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Configuración</h2>
            
            <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Datos de la Empresa</h3>
                        <div className="space-y-4">
                            <label className="block"><span className="text-sm font-medium">Nombre del Negocio</span><input type="text" name="companyName" value={settings.companyName} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                            <label className="block"><span className="text-sm font-medium">NIT</span><input type="text" name="companyNit" value={settings.companyNit} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                            <label className="block"><span className="text-sm font-medium">URL del Logo</span><input type="text" name="logoUrl" value={settings.logoUrl} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                            <label className="block"><span className="text-sm font-medium">Slogan</span><input type="text" name="slogan" value={settings.slogan} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                            <label className="block"><span className="text-sm font-medium">Dirección</span><input type="text" name="address" value={settings.address} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                            <label className="block"><span className="text-sm font-medium">Teléfono</span><input type="text" name="phone" value={settings.phone} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                        </div>
                    </div>
                    
                    {/* App Settings */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Personalización y Fiscal</h3>
                        <div className="space-y-4">
                            <label className="block"><span className="text-sm font-medium">Símbolo de Moneda</span><input type="text" name="currencySymbol" value={settings.currencySymbol} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                            <label className="block"><span className="text-sm font-medium">Tasa de Impuestos (%)</span><input type="number" name="taxRate" value={settings.taxRate} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                            <div className="flex items-center"><input type="checkbox" name="pricesIncludeTax" id="pricesIncludeTax" checked={settings.pricesIncludeTax} onChange={handleChange} className="h-4 w-4 rounded" /><label htmlFor="pricesIncludeTax" className="ml-2 block text-sm">Precios incluyen impuestos</label></div>
                            <label className="block"><span className="text-sm font-medium">Mensaje de Pie de Página</span><textarea name="footerMessage" value={settings.footerMessage} onChange={handleChange} rows={2} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"></textarea></label>
                            <label className="block"><span className="text-sm font-medium">Formato de Fecha</span><select name="dateFormat" value={settings.dateFormat} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></label>
                            <label className="block"><span className="text-sm font-medium">Tamaño de Impresión</span><select name="printSize" value={settings.printSize} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"><option value="letter">Carta</option><option value="half-letter">Media Carta</option><option value="80mm">80mm Ticket</option><option value="58mm">58mm Ticket</option></select></label>
                        </div>
                    </div>

                    {/* Category Managers */}
                    <div className="space-y-8">
                        <CategoryManager title="Categorías de Productos" categories={productCategories} setCategories={setProductCategories} logActionPrefix="Categoría de producto" />
                        <CategoryManager title="Categorías de Gastos" categories={expenseCategories} setCategories={setExpenseCategories} logActionPrefix="Categoría de gasto" />
                    </div>

                     {/* Appearance */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Apariencia</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between"><span className="text-sm font-medium">Modo Oscuro</span><label htmlFor="theme-toggle" className="relative inline-flex items-center cursor-pointer"><input type="checkbox" id="theme-toggle" className="sr-only peer" checked={settings.theme === 'dark'} onChange={(e) => setSettings(p => ({...p, theme: e.target.checked ? 'dark' : 'light'}))} /><div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div></label></div>
                            <div><span className="text-sm font-medium">Paleta de Colores</span><div className="flex space-x-3 mt-2">{palettes.map(p => <button key={p.name} onClick={() => setSettings(s => ({...s, themePalette: p.name as any}))} className={`w-8 h-8 rounded-full ${p.color} ring-2 ${settings.themePalette === p.name ? 'ring-primary-500' : 'ring-transparent'}`}></button>)}</div></div>
                        </div>
                    </div>
                    
                    {/* Documents */}
                     <div>
                        <h3 className="text-xl font-semibold mb-4">Documentos</h3>
                        <div className="space-y-4">
                             <div className="flex items-center justify-between"><span className="text-sm font-medium">Habilitar Correlativos</span><label htmlFor="correlative-toggle" className="relative inline-flex items-center cursor-pointer"><input type="checkbox" name="enableCorrelative" id="correlative-toggle" className="sr-only peer" checked={settings.enableCorrelative} onChange={handleChange} /><div className="w-11 h-6 bg-gray-200 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div></label></div>
                             <label className="block"><span className="text-sm font-medium">Prefijo de Documento</span><input type="text" name="documentPrefix" value={settings.documentPrefix} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                             <label className="block"><span className="text-sm font-medium">Siguiente Número</span><input type="number" name="correlativeNextNumber" value={settings.correlativeNextNumber} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" min="1" /></label>
                        </div>
                    </div>

                    {/* Hardware */}
                    <div>
                        <h3 className="text-xl font-semibold mb-4">Hardware</h3>
                        <div className="space-y-4">
                            <button onClick={handleFindPrinters} className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Buscar Impresoras Bluetooth</button>
                            {foundDevices.length > 0 && <ul className="text-xs">{foundDevices.map(d => <li key={d.id}>{d.name || 'Dispositivo sin nombre'}</li>)}</ul>}
                        </div>
                    </div>
                </div>
                 <div className="mt-8 pt-6 border-t dark:border-gray-700">
                    <h3 className="text-xl font-semibold mb-4">Facturación Electrónica (API)</h3>
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/50 border border-yellow-200 dark:border-yellow-800"><p className="text-sm text-yellow-800 dark:text-yellow-200"><strong>¡Advertencia de Seguridad!</strong> Guardar credenciales de API en el navegador es inseguro. En una aplicación real, utilice un backend seguro.</p></div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                         <label className="block"><span className="text-sm font-medium">Usuario API</span><input type="text" name="satApiUser" value={settings.satApiUser} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                         <label className="block"><span className="text-sm font-medium">Clave API</span><input type="password" name="satApiKey" value={settings.satApiKey} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md dark:bg-gray-800 dark:border-gray-700" /></label>
                    </div>
                </div>
                 <div className="mt-8 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 shadow">
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;