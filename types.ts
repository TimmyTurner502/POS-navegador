import type React from 'react';

export enum View {
    DASHBOARD = 'Dashboard',
    INVENTORY = 'Inventario',
    POS = 'Punto de Venta',
    SALES = 'Historial de Ventas',
    PURCHASES = 'Compras',
    CUSTOMERS = 'Clientes',
    SUPPLIERS = 'Proveedores',
    EXPENSES = 'Gastos',
    REPORTS = 'Reportes',
    USERS = 'Usuarios y Roles',
    SETTINGS = 'Configuración',
    AUDIT_LOG = 'Historial',
}

export interface Category {
    id: string;
    name: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    stock: number;
    lowStockAlert: number;
    price: number;
    cost: number;
    categoryId: string;
    expiryDate?: string;
    imageUrl?: string; // Can be a URL or a Base64 data URI
}

export interface Payment {
    id: string;
    date: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'transfer';
    notes?: string;
}


export interface Customer {
    id: string;
    name: string;
    nit: string;
    cui: string;
    email: string;
    phone: string;
    address: string;
    creditLimit: number;
    creditDays?: number;
    currentBalance: number;
    paymentHistory: Payment[];
}

export interface Supplier {
    id: string;
    name: string;
    contactPerson: string;
    email: string;
    phone: string;
    creditLimit: number;
    creditDays?: number;
    currentBalance: number;
    paymentHistory: Payment[];
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    categoryId: string;
    date: string;
    isRecurring: boolean;
    paymentMethod: 'cash' | 'card' | 'transfer';
    receiptImageUrl?: string;
}

export interface SaleItem {
    productId: string;
    name: string;
    quantity: number;
    price: number;
    cost: number;
}

export interface PurchaseItem {
    productId: string;
    name: string;
    quantity: number;
    cost: number;
}

export interface Sale {
    id: string;
    date: string;
    customerId: string;
    customerName: string;
    items: SaleItem[];
    subtotal: number;
    discountPercentage: number;
    tax: number;
    total: number;
    user: string;
    paymentMethod: 'cash' | 'credit' | 'card';
    comments?: string;
}

export interface Purchase {
    id: string;
    date: string;
    supplierId: string;
    supplierName: string;
    items: PurchaseItem[];
    total: number;
    user: string;
    comments?: string;
    receiptImageUrl?: string; // Base64 data URI
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: string; // This should match a Role name
    password?: string; // This is NOT secure in localStorage. For demo purposes only.
}

export interface Role {
    id: string;
    name: string;
    permissions: View[];
}

export interface Settings {
    companyName: string;
    companyNit: string;
    logoUrl: string;
    address: string;
    phone: string;
    slogan: string;
    footerMessage: string;
    documentPrefix: string;
    enableCorrelative: boolean;
    correlativeNextNumber: number;
    printSize: 'letter' | 'half-letter' | '80mm' | '58mm';
    language: 'es' | 'en';
    theme: 'light' | 'dark';
    themePalette: 'theme-default' | 'theme-teal' | 'theme-rose' | 'theme-amber';
    currencySymbol: string;
    dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
    numberFormat: 'en-US' | 'de-DE'; // dot or comma for decimal
    taxRate: number; // Percentage
    pricesIncludeTax: boolean;
    appMode: 'products' | 'services';
    enableNotifications: boolean;
    satApiKey: string;
    satApiUser: string;
}

export interface AuditLog {
    id: string;
    user: string;
    action: string;
    timestamp: string;
    details?: {
        type: 'sale' | 'purchase' | 'expense' | 'customer' | 'product' | 'user' | 'supplier' | 'payment';
        id: string;
    }
}

export interface AppContextType {
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    sales: Sale[];
    setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
    purchases: Purchase[];
    setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    roles: Role[];
    setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
    settings: Settings;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    auditLog: AuditLog[];
    setAuditLog: React.Dispatch<React.SetStateAction<AuditLog[]>>;
    suppliers: Supplier[];
    setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
    expenses: Expense[];
    setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    productCategories: Category[];
    setProductCategories: React.Dispatch<React.SetStateAction<Category[]>>;
    expenseCategories: ExpenseCategory[];
    setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
    dismissedAlerts: string[];
    setDismissedAlerts: React.Dispatch<React.SetStateAction<string[]>>;
    currentUser: User;
    setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
    currentUserRole: Role | undefined;
    logAction: (action: string, details?: AuditLog['details']) => void;
}


interface InitialData {
    products: Product[];
    sales: Sale[];
    purchases: Purchase[];
    customers: Customer[];
    users: User[];
    roles: Role[];
    settings: Settings;
    auditLog: AuditLog[];
    suppliers: Supplier[];
    expenses: Expense[];
    productCategories: Category[];
    expenseCategories: ExpenseCategory[];
}

export const initialData: InitialData = {
    productCategories: [
        { id: '1', name: 'Electrónica' },
        { id: '2', name: 'Accesorios' },
        { id: '3', name: 'Monitores' },
        { id: '4', name: 'Lácteos' },
    ],
    expenseCategories: [
        { id: 'ec1', name: 'Alquiler' },
        { id: 'ec2', name: 'Servicios Públicos' },
        { id: 'ec3', name: 'Salarios' },
        { id: 'ec4', name: 'Marketing' },
    ],
    products: [
        { id: '1', name: 'Laptop Pro 15"', sku: 'LP15-001', stock: 25, lowStockAlert: 10, price: 1200, cost: 800, categoryId: '1', expiryDate: '2025-12-31', imageUrl: 'https://picsum.photos/seed/laptop/200' },
        { id: '2', name: 'Mouse Inalámbrico', sku: 'MS-W-002', stock: 8, lowStockAlert: 15, price: 25, cost: 15, categoryId: '2', imageUrl: 'https://picsum.photos/seed/mouse/200' },
        { id: '3', name: 'Teclado Mecánico RGB', sku: 'KB-RGB-003', stock: 40, lowStockAlert: 10, price: 80, cost: 50, categoryId: '2', imageUrl: 'https://picsum.photos/seed/keyboard/200' },
        { id: '4', name: 'Monitor 27" 4K', sku: 'MN-4K-004', stock: 18, lowStockAlert: 5, price: 450, cost: 300, categoryId: '3', imageUrl: 'https://picsum.photos/seed/monitor/200' },
        { id: '5', name: 'Leche 1L', sku: 'LCH-1L', stock: 50, lowStockAlert: 20, price: 1.5, cost: 1, categoryId: '4', expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], imageUrl: 'https://picsum.photos/seed/milk/200' },
    ],
    sales: [],
    purchases: [],
    customers: [
        { id: '1', name: 'Cliente General', email: 'n/a', phone: 'n/a', address: 'n/a', nit: 'CF', cui: 'CF', creditLimit: 0, creditDays: 0, currentBalance: 0, paymentHistory: [] },
        { id: '2', name: 'Juan Pérez', email: 'juan.perez@email.com', phone: '555-1234', address: 'Calle Falsa 123', nit: '1234567-8', cui: '2988123450101', creditLimit: 500, creditDays: 30, currentBalance: 75.50, paymentHistory: [] },
    ],
    users: [
        { id: '1', name: 'Admin', email: 'admin@zenith.com', role: 'Administrador', password: 'YWRtaW4=' }, // Default pass: admin
        { id: '2', name: 'Vendedor 1', email: 'vendedor@zenith.com', role: 'Vendedor', password: 'cGFzc3dvcmQ=' } // Default pass: password
    ],
    roles: [
        { id: 'role1', name: 'Administrador', permissions: Object.values(View) },
        { id: 'role2', name: 'Vendedor', permissions: [View.DASHBOARD, View.POS, View.SALES, View.CUSTOMERS] },
        { id: 'role3', name: 'Almacenista', permissions: [View.DASHBOARD, View.INVENTORY, View.SUPPLIERS, View.PURCHASES] }
    ],
    settings: {
        companyName: "Zenith Solutions",
        companyNit: "1234567-8",
        logoUrl: 'https://tailwindui.com/img/logos/mark.svg?color=indigo&shade=600',
        address: "Av. Principal 456, Ciudad Capital",
        phone: "+1 (555) 123-4567",
        slogan: "Tu negocio, a otro nivel.",
        footerMessage: "¡Gracias por su compra, vuelva pronto!",
        documentPrefix: "FAC-",
        enableCorrelative: true,
        correlativeNextNumber: 1,
        printSize: '80mm',
        language: 'es',
        theme: 'light',
        themePalette: 'theme-default',
        currencySymbol: '$',
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'en-US',
        taxRate: 12,
        pricesIncludeTax: true,
        appMode: 'products',
        enableNotifications: false,
        satApiKey: '',
        satApiUser: '',
    },
    auditLog: [],
    suppliers: [
        { id: '1', name: 'Electro Proveedores S.A.', contactPerson: 'Carlos Ruiz', email: 'ventas@electro.com', phone: '555-5678', creditLimit: 10000, creditDays: 45, currentBalance: 2500, paymentHistory: [] }
    ],
    expenses: [
         { id: '1', description: 'Pago de alquiler Enero', amount: 800, categoryId: 'ec1', date: new Date().toISOString(), isRecurring: true, paymentMethod: 'transfer', receiptImageUrl: '' },
         { id: '2', description: 'Factura de electricidad', amount: 150, categoryId: 'ec2', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), isRecurring: true, paymentMethod: 'cash', receiptImageUrl: '' }
    ],
};