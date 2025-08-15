import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import Cart from "./Cart";
import ItemCard from "./ItemCard";
import { API_URL } from "../config";

export default function Sidebar({ cart, increment, decrement, remove, total, submit, addToCart }) {
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setMenuItems(data);
      } catch (err) {
        console.error("Failed to fetch menu items:", err);
        setError("Could not load menu items. Is the backend server running?");
      }
    };

    fetchMenuItems();
  }, []);

  return (
    <div className="sidebar">
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
        {menuItems.map(item => (
          <ItemCard key={item.id} item={item} addToCart={addToCart} />
        ))}
      </div>
    </div>
  );
}
