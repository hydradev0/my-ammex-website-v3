// Shared helpers to compute best-of (tier vs product) at order level without stacking

/**
 * Compute base subtotal from an array of line items.
 * Each item shape for cart: { sellingPrice, price, discountedPrice, discountPercentage, quantity }
 * Each item shape for orders: supply an adapter to map fields.
 */
export function computeBaseSubtotal(items, opts = {}) {
  const {
    getUnitBase = (it) => Number(it.sellingPrice ?? it.price ?? 0),
    getQty = (it) => Number(it.quantity ?? 0)
  } = opts;
  return items.reduce((sum, it) => sum + getUnitBase(it) * getQty(it), 0);
}

/**
 * Compute product-path total (use product discounts only).
 */
export function computeProductPathTotal(items, opts = {}) {
  const {
    getUnitBase = (it) => Number(it.sellingPrice ?? it.price ?? 0),
    getUnitDiscounted = (it) => {
      const d = it.discountedPrice;
      if (d === null || d === undefined) return null;
      const n = Number(d);
      return Number.isFinite(n) ? n : null;
    },
    getQty = (it) => Number(it.quantity ?? 0)
  } = opts;
  return items.reduce((sum, it) => {
    const unit = getUnitDiscounted(it) ?? getUnitBase(it);
    return sum + unit * getQty(it);
  }, 0);
}

/**
 * Compute tier-path total (ignore product discounts, apply tier % across base).
 */
export function computeTierPathTotal(items, tierPercent, opts = {}) {
  const {
    getUnitBase = (it) => Number(it.sellingPrice ?? it.price ?? 0),
    getQty = (it) => Number(it.quantity ?? 0)
  } = opts;
  const tier = Math.max(0, Number(tierPercent || 0));
  const subtotal = items.reduce((sum, it) => sum + getUnitBase(it) * getQty(it), 0);
  const discountAmt = subtotal * (tier / 100);
  return Math.max(0, subtotal - discountAmt);
}

/**
 * Compute best-of discount choice and savings.
 * Returns:
 * {
 *   applied: 'tier' | 'product' | 'none',
 *   tierPercent: number,
 *   baseSubtotal: number,
 *   productTotal: number,
 *   tierTotal: number,
 *   chosenTotal: number,
 *   savingsAmount: number,
 *   savingsPercentOfProduct: number
 * }
 */
export function computeBestOf(items, tierPercent, opts = {}) {
  const baseSubtotal = computeBaseSubtotal(items, opts);
  const productTotal = computeProductPathTotal(items, opts);
  const tierTotal = computeTierPathTotal(items, tierPercent, opts);
  let applied = 'none';
  let chosenTotal = productTotal;
  if (Number.isFinite(tierTotal) && tierTotal < productTotal) {
    applied = tierPercent > 0 ? 'tier' : 'none';
    chosenTotal = tierTotal;
  } else if (productTotal < baseSubtotal) {
    applied = 'product';
  }
  const savingsAmount = Math.max(0, productTotal - chosenTotal);
  const savingsPercentOfProduct = productTotal > 0 ? (savingsAmount / productTotal) * 100 : 0;
  return {
    applied,
    tierPercent: Math.max(0, Number(tierPercent || 0)),
    baseSubtotal,
    productTotal,
    tierTotal,
    chosenTotal,
    savingsAmount,
    savingsPercentOfProduct
  };
}


