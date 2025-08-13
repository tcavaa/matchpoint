import React from 'react'
import "./ItemCard.css"

export default function ItemCard({ item, addToCart }) {
    const {name, price, image } = item;

  return (
    <div onClick={() => addToCart(name, price)} className="item-card">
        <img src={image} alt={name} className="item-image" />
        <h3>{name}</h3>
        <p>₾{price.toFixed(2)}</p>
    </div>
  )
}
