import { useState, useCallback } from "react";
import { sendToGoogleSheets } from '../services/googleSheets'
import { playSound } from "../utils/utils";
import { SOUNDS, SALE_TYPES } from "../utils/constants";
import { v4 as uuidv4 } from "uuid";

export default function useCart() {
  const [cart, setCart] = useState([]);

  const addToCart = useCallback((name, price) => {
    setCart(prev => {
      const existing = prev.find(item => item.name === name);
      if (existing) {
        return prev.map(item =>
          item.name === name ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [{ name, price, quantity: 1 }, ...prev];
    });
  }, []);

  const incrementQuantity = useCallback(name => {
    setCart(prev =>
      prev.map(item => (item.name === name ? { ...item, quantity: item.quantity + 1 } : item))
    );
  }, []);

  const decrementQuantity = useCallback(name => {
    setCart(prev =>
      prev.map(item =>
        item.name === name && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  }, []);

  const removeItem = useCallback(name => {
    setCart(prev => prev.filter(item => item.name !== name));
  }, []);

  const calculateTotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
  }, [cart]);

  const handleSubmit = useCallback(() => {
    // 1. Don't do anything if the cart is empty
    
    if (cart.length === 0) {
      console.log("Cart is empty, nothing to submit.");
      return;
    }

    // 2. Prepare the data payload for Google Sheets
    const total = calculateTotal();
    const saleData = {
      type: SALE_TYPES.BAR_SALE, // This new 'type' field tells our script how to handle the data
      timestamp: new Date().toISOString(),
      items: cart.map(item => `${item.name} (x${item.quantity})`).join(', '), // Creates a readable string of items
      totalAmount: parseFloat(total),
      id: uuidv4() // A unique ID for this transaction
    };

    // 3. Check if the Google Sheets URL is configured
    sendToGoogleSheets(
      saleData, 
      'Bar Sale', 
      () => playSound(SOUNDS.PAYMENT_SUCCESS)
    );

    // 5. Clear the cart locally immediately after submitting
    setCart([]);
  }, [cart, calculateTotal]);

  return { cart, addToCart, incrementQuantity, decrementQuantity, removeItem, calculateTotal, handleSubmit };
}
