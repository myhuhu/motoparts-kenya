import { createContext, useCallback, useContext, useEffect, useState } from "react";
import cartService from "../services/cartService";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart({ items: [], subtotal: 0 });
      return;
    }
    setLoading(true);
    try {
      const data = await cartService.get();
      setCart(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      showToast("Please log in to add items to your cart.", "info");
      return false;
    }
    try {
      const data = await cartService.add(productId, quantity);
      setCart(data);
      showToast("Product added to cart.");
      return true;
    } catch (err) {
      showToast(err.response?.data?.quantity?.[0] || err.response?.data?.detail || "Could not add to cart.", "error");
      return false;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      const data = await cartService.updateItem(itemId, quantity);
      setCart(data);
    } catch (err) {
      showToast(err.response?.data?.quantity?.[0] || "Could not update quantity.", "error");
    }
  };

  const removeFromCart = async (itemId) => {
    const data = await cartService.removeItem(itemId);
    setCart(data);
    showToast("Product removed from cart.", "info");
  };

  const clearCart = async () => {
    const data = await cartService.clear();
    setCart(data);
  };

  const itemCount = cart.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{ cart, loading, itemCount, refreshCart, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
