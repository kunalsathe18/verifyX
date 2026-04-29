// ============================================================
// indexer.js  –  lightweight client-side product cache
//
// Instead of querying the blockchain on every render, we cache
// product data in localStorage and refresh only when needed.
// This gives faster reads and reduces RPC load.
// ============================================================

import { getProduct, CONTRACT_ID } from "./contract";

const CACHE_KEY  = "verifyX_product_cache";
const CACHE_TTL  = 5 * 60 * 1000; // 5 minutes

// ── Read cache from localStorage ────────────────────────────
function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return { products: {}, fetchedAt: 0, contractId: "" };
    return JSON.parse(raw);
  } catch {
    return { products: {}, fetchedAt: 0, contractId: "" };
  }
}

// ── Write cache to localStorage ──────────────────────────────
function writeCache(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      products,
      fetchedAt:  Date.now(),
      contractId: CONTRACT_ID,
    }));
  } catch {
    // localStorage full — silently skip
  }
}

// ── Invalidate cache (call after add/approve) ────────────────
export function invalidateCache() {
  localStorage.removeItem(CACHE_KEY);
}

// ── Fetch a single product (cache-first) ─────────────────────
export async function getCachedProduct(id) {
  const cache = readCache();

  // Invalidate if contract changed
  if (cache.contractId !== CONTRACT_ID) {
    invalidateCache();
  }

  const key = String(id);
  if (cache.products[key]) {
    return cache.products[key];
  }

  const product = await getProduct(id);
  if (product) {
    cache.products[key] = product;
    writeCache(cache.products);
  }
  return product;
}

// ── Fetch all products up to `count` (cache-aware) ───────────
export async function fetchAllProducts(count) {
  const cache = readCache();

  // Full refresh if cache is stale or contract changed
  const stale = Date.now() - cache.fetchedAt > CACHE_TTL;
  const wrongContract = cache.contractId !== CONTRACT_ID;

  if (stale || wrongContract) {
    invalidateCache();
    cache.products = {};
  }

  const results = [];
  for (let i = 1; i <= count; i++) {
    const key = String(i);
    if (cache.products[key]) {
      results.push(cache.products[key]);
    } else {
      try {
        const product = await getProduct(i);
        if (product) {
          cache.products[key] = product;
          results.push(product);
        }
      } catch (err) {
        console.warn(`indexer: could not fetch product ${i}:`, err.message);
      }
    }
  }

  writeCache(cache.products);
  return results;
}

// ── Derive dashboard metrics from a product list ─────────────
export function computeMetrics(products) {
  const uniqueManufacturers = new Set(
    products.map(p => p.manufacturer).filter(Boolean)
  );

  const verified = products.filter(p => p.is_verified).length;

  return {
    totalProducts:  products.length,
    totalUsers:     uniqueManufacturers.size,
    totalVerified:  verified,
  };
}
