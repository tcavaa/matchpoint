// src/pages/MenuAdminPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { applyOrder, setMenuOrder, removeFromOrder } from '../utils/menuOrder';
import './MenuAdminPage.css'; // We'll create this CSS file next

export default function MenuAdminPage() {
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ id: null, name: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef(null);

  // Fetch all items from the backend when the component mounts
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setItems(applyOrder(data));
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem({ ...currentItem, [name]: value });
  };

  const handleFileChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const resetForm = () => {
    setCurrentItem({ id: null, name: '', price: '' });
    setImageFile(null);
    setIsEditing(false);
    document.getElementById('image-input').value = null; // Clear file input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', currentItem.name);
    formData.append('price', currentItem.price);
    if (imageFile) {
        formData.append('image', imageFile);
    }

    const url = isEditing ? `${API_URL}/${currentItem.id}` : API_URL;
    const method = isEditing ? 'PUT' : 'POST';

    try {
        if(isEditing && !imageFile) {
            // If editing without a new image, we need to handle it differently
            // This example simplifies by requiring image on edit, or you can enhance the backend
            // to not require image on update. For now we will send existing image path
            const existingItem = items.find(i => i.id === currentItem.id);
            formData.append('existingImagePath', existingItem.image_path);
        }

      const response = await fetch(url, {
        method: method,
        body: formData, // No 'Content-Type' header needed, browser sets it for FormData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchItems(); // Refresh the list
      resetForm();
    } catch (error) {
      console.error('Error submitting item:', error);
    }
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setCurrentItem({ id: item.id, name: item.name, price: item.price });
    // Smooth scroll to form and focus name input
    requestAnimationFrame(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const nameEl = document.getElementById('admin-name-input');
      if (nameEl) nameEl.focus();
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        removeFromOrder(id);
        fetchItems(); // Refresh the list
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  // Drag-and-drop handlers for manual ordering
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('text/plain', String(id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const sourceIdRaw = e.dataTransfer.getData('text/plain');
    if (!sourceIdRaw) return;
    const sourceId = Number(sourceIdRaw);
    if (sourceId === targetId) return;

    const current = [...items];
    const sourceIndex = current.findIndex(i => i.id === sourceId);
    const targetIndex = current.findIndex(i => i.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updated = [...current];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setItems(updated);
    setMenuOrder(updated.map(i => i.id));
  };

  return (
    <div className="menu-admin-container">
      <h1>Manage Bar Menu</h1>
      
      <div className="admin-form-card" ref={formRef}>
        <h2>{isEditing ? 'Edit Item' : 'Add New Item'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            id="admin-name-input"
            value={currentItem.name}
            onChange={handleInputChange}
            placeholder="Item Name"
            required
          />
          <input
            type="number"
            name="price"
            value={currentItem.price}
            onChange={handleInputChange}
            placeholder="Price (GEL)"
            step="0.01"
            required
          />
          <input
            type="file"
            id="image-input"
            name="image"
            onChange={handleFileChange}
            accept="image/*"
            required={!isEditing} // Image is only required when creating a new item
          />
          <div className="form-buttons">
            <button className="admin-btn admin-btn-primary" type="submit">{isEditing ? 'Update Item' : 'Add Item'}</button>
            {isEditing && <button className="admin-btn admin-btn-secondary" type="button" onClick={resetForm}>Cancel Edit</button>}
          </div>
        </form>
      </div>

      <div className="items-list">
        <h2>Current Menu</h2>
        {items.map((item) => (
          <div
            key={item.id}
            className="item-row"
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item.id)}
            title="Drag to reorder"
          >
            <img src={item.image} alt={item.name} className="item-thumbnail" />
            <span className="item-name">{item.name}</span>
            <span className="item-price">₾{item.price}</span>
            <div className="item-actions">
              <button className="admin-btn admin-btn-primary" onClick={() => handleEdit(item)}>Edit</button>
              <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
