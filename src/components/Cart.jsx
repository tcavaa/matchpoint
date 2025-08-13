import React from 'react';
import './Cart.css';

export default function Cart({ cart, incrementQuantity, decrementQuantity, removeItem, calculateTotal, handleSubmit }) {
    return (
        <>
        <div className="cart">
            {cart.length === 0 ? (
                <p className="cart-empty">Your cart is empty</p>
            ) : (
                <>
                    {cart.map(item => (
                        <div key={item.name} className="cart-item">
                            <div className="cart-item-details">
                                <h3>{item.name}</h3>
                                <p>
                                    ₾{item.price.toFixed(2)} x {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                                </p>
                            </div>
                            <div className="cart-item-controls">
                                <button
                                    className="cart-btn increment-btn"
                                    onClick={() => incrementQuantity(item.name)}
                                >
                                    +
                                </button>
                                <button
                                    className="cart-btn decrement-btn"
                                    onClick={() => decrementQuantity(item.name)}
                                    disabled={item.quantity === 1}
                                >
                                    -
                                </button>
                                <button
                                    className="cart-btn remove-btn"
                                    onClick={() => removeItem(item.name)}
                                >
                                    X
                                </button>
                            </div>
                        </div>
                    ))}
                    
                </>
            )}
        </div>
        
        <div className="cart-total">
            <button
                className="cart-btn increment-btn"
                onClick={() => handleSubmit()}
            >
                Submit
            </button>
            <h3>Total: ₾{calculateTotal()}</h3>
        </div>
        </>
    );
}