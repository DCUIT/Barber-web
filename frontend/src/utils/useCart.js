import { useState, useEffect } from "react";

// Cart utility functions - gộp chung migrate + cart logic
// Thay thế code trùng lặp ở Home.jsx, Cart.jsx, Payment.jsx

const CART_KEY = "cart";

/**
 * Migrate old cart format (array of numbers like [1,2,3]) to new format [{id:1, quantity:1}, {id:2, quantity:1}]
 * và cập nhật localStorage
 */
function migrateCart() {
  try {
    const cartString = localStorage.getItem(CART_KEY);
    if (!cartString) return null;
    
    let cart = JSON.parse(cartString);
    
    // Check if old format (array of numbers)
    if (cart.length > 0 && typeof cart[0] === "number") {
      console.log("Migrating cart from old format...");
      const newCart = {};
      cart.forEach(id => {
        newCart[id] = (newCart[id] || 0) + 1;
      });
      cart = Object.entries(newCart).map(([id, quantity]) => ({ id: parseInt(id), quantity }));
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      return cart;
    }
    
    return cart;
  } catch (e) {
    console.error("Cart migration error:", e);
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

/**
 * Get cart items với migrate tự động
 */
export function getCart() {
  return migrateCart() || [];
}

/**
 * Add item to cart - tự động migrate nếu cần
 */
export function addToCart(item) {
  let cart = getCart();
  const { id, quantity = 1 } = item;
  const existingIndex = cart.findIndex(c => c.id === id);
  
  if (existingIndex > -1) {
    cart[existingIndex].quantity += quantity;
  } else {
    cart.push({ id, quantity });
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("storage"));
  return cart;
}

/**
 * Remove item from cart
 */
export function removeFromCart(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event("storage"));
  return cart;
}

/**
 * Update item quantity in cart
 */
export function updateCartQuantity(id, newQuantity) {
  if (newQuantity <= 0) {
    return removeFromCart(id);
  }
  
  let cart = getCart();
  const index = cart.findIndex(item => item.id === id);
  if (index > -1) {
    cart[index].quantity = newQuantity;
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
  }
  return cart;
}

/**
 * Clear cart
 */
export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event("storage"));
}

/**
 * Get cart item count (tổng số lượng all items)
 */
export function getCartCount() {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

/**
 * Hook useCart - React hook cho các component
 */
export function useCart() {
  const [cartCount, setCartCount] = useState(0);
  
  useEffect(() => {
    // Initial load (defer state update to avoid react-hooks/set-state-in-effect)
    const initialId = window.setTimeout(() => {
      const cart = getCart();
      setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 0), 0));
    }, 0);


    // Listen to storage changes
    const handleStorageChange = () => {
      const count = getCartCount();
      setCartCount(count);
    };

    window.addEventListener("storage", handleStorageChange);

    // Polling for faster updates within the same tab
    const interval = window.setInterval(handleStorageChange, 500);

    return () => {
      window.clearTimeout(initialId);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  
  return { cartCount };
}

export default useCart;
