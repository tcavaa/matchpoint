import React from "react";
import "./Sidebar.css";
import Cart from "./Cart";
import ItemCard from "./ItemCard";
import { ITEMS } from "../config";

export default function Sidebar({ cart, increment, decrement, remove, total, submit, addToCart }) {
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
        {ITEMS.map(item => (
          <ItemCard key={item.name} item={item} addToCart={addToCart} />
        ))}
      </div>
    </div>
  );
}
