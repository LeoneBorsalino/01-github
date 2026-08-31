"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CartItem, ProductRow } from "../types";

function storageKey(eventId: string) {
  return `barra-cart-${eventId}`;
}

/**
 * Carrito del pedido en BORRADOR: vive 100% en el cliente (no en la base)
 * para que armar/editar un pedido sea instantáneo. Se persiste en
 * localStorage por evento, así un refresh accidental de la tablet de Caja
 * no hace perder el pedido en curso.
 */
export function useCart(eventId: string | null | undefined) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    if (!eventId) {
      setItems([]);
      return;
    }
    try {
      const raw = localStorage.getItem(storageKey(eventId));
      setItems(raw ? (JSON.parse(raw) as CartItem[]) : []);
    } catch {
      setItems([]);
    } finally {
      setHydrated(true);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !hydrated) return;
    try {
      localStorage.setItem(storageKey(eventId), JSON.stringify(items));
    } catch {
      // localStorage lleno o deshabilitado: seguimos igual, solo se pierde la persistencia
    }
  }, [eventId, items, hydrated]);

  const addProduct = useCallback((product: ProductRow, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          category: product.category,
          sectorEconomico: product.sector_economico,
          sectorPreparacion: product.sector_preparacion,
          unitPrice: product.price,
          quantity: qty,
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

  const increment = useCallback((productId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i))
    );
  }, []);

  const decrement = useCallback((productId: string) => {
    setItems((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0),
    [items]
  );
  const itemCount = useMemo(() => items.reduce((acc, i) => acc + i.quantity, 0), [items]);

  return {
    items,
    hydrated,
    addProduct,
    setQuantity,
    increment,
    decrement,
    removeItem,
    clear,
    total,
    itemCount,
  };
}
