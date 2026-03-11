import React from "react";

export default function MenuItemsList({
  items,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  isLoadingItems,
}) {
  return (
    <div className="items-list">
      <h2>Current Menu</h2>
      {isLoadingItems && (
        <div className="menu-items-loading">
          <span className="btn-spinner" aria-hidden="true" />
          <span>Loading menu items...</span>
        </div>
      )}
      {items.map((item) => (
        <div
          key={item.id}
          className="item-row"
          draggable
          onDragStart={(e) => onDragStart(e, item.id)}
          onDragOver={onDragOver}
          onDrop={(e) => onDrop(e, item.id)}
          title="Drag to reorder"
        >
          <img src={item.image} alt={item.name} className="item-thumbnail" />
          <span className="item-name">{item.name}</span>
          <span className="item-price">₾{item.price}</span>
          <div className="item-actions">
            <button className="admin-btn admin-btn-primary" onClick={() => onEdit(item)}>
              Edit
            </button>
            <button className="admin-btn admin-btn-danger" onClick={() => onDelete(item.id)}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

