export const formatNumber = (n) => {
  const num = Number(n || 0);
  return num.toLocaleString();
};

export const formatCurrency = (n, currency = 'USD', locale = 'en-US') => {
  const num = Number(n || 0);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(num);
};


