import { Settings } from '../types';

export const formatCurrency = (amount: number, settings: Settings): string => {
    const { currencySymbol, numberFormat } = settings;
    const options: Intl.NumberFormatOptions = {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    };
    
    let locale = 'en-US'; // Uses dot for decimal, comma for thousand
    if (numberFormat === 'de-DE') {
        locale = 'de-DE'; // Uses comma for decimal, dot for thousand
    }
    
    return `${settings.currencySymbol} ${new Intl.NumberFormat(locale, options).format(amount)}`;
};


export const formatDate = (dateString: string, settings: Settings): string => {
    const date = new Date(dateString);
    const { dateFormat } = settings;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    switch (dateFormat) {
        case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'DD/MM/YYYY':
        default:
            return `${day}/${month}/${year}`;
    }
};
