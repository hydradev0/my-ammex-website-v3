export const formatNumber = (n) => {
  const num = Number(n || 0);
  return num.toLocaleString();
};

export const formatCurrency = (n) => {
  const num = Number(n || 0);
  if (num === 0) return '₱0.00';
  return `₱${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};


