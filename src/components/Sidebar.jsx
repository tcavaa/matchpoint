import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import Cart from "./Cart";
import ItemCard from "./ItemCard";
import { applyOrder } from "../utils/menuOrder";
import { fetchMenuItems as fetchMenuItemsFromSupabase } from "../services/supabaseData";

export default function Sidebar({ cart, increment, decrement, remove, total, submit, addToCart, toggleSidebar }) {
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setIsLoadingMenu(true);
        const data = await fetchMenuItemsFromSupabase();
        setMenuItems(applyOrder(data));
      } catch (err) {
        console.error("Failed to fetch menu items:", err);
        setError("Could not load menu items. Check Supabase configuration.");
      } finally {
        setIsLoadingMenu(false);
      }
    };

    fetchMenuItems();
  }, []);

  return (
    <div className="sidebar">
      <button className="closeButton" onClick={toggleSidebar}>X</button>
      <Cart
        cart={cart}
        incrementQuantity={increment}
        decrementQuantity={decrement}
        removeItem={remove}
        calculateTotal={total}
        handleSubmit={submit}
      />
      <div className="menu">
        {error && <p className="error-message">{error}</p>}
        {isLoadingMenu && (
          <div className="sidebar-loading">
            <span className="sidebar-spinner" aria-hidden="true" />
            <span>Loading menu...</span>
          </div>
        )}
        {menuItems.map(item => (
          <ItemCard key={item.id} item={item} addToCart={addToCart} />
        ))}
      </div>
    </div>
  );
}
