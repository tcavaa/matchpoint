// src/pages/MenuAdminPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { applyOrder, setMenuOrder, removeFromOrder } from '../utils/menuOrder';
import { fetchMenuItems, createMenuItem, updateMenuItem, deleteMenuItem } from '../services/supabaseData';
import MenuAdminForm from "../components/menu-admin/MenuAdminForm";
import MenuItemsList from "../components/menu-admin/MenuItemsList";
import './MenuAdminPage.css'; // We'll create this CSS file next

export default function MenuAdminPage() {
  const [items, setItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ id: null, name: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const formRef = useRef(null);

  // Fetch all items from the backend when the component mounts
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setIsLoadingItems(true);
      const data = await fetchMenuItems();
      setItems(applyOrder(data));
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setIsLoadingItems(false);
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
    if (isSubmitting) return;
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      setIsSubmitting(true);
      let image = '';
      if (imageFile) {
        image = await toBase64(imageFile);
      } else if (isEditing) {
        const existingItem = items.find((i) => i.id === currentItem.id);
        image = existingItem?.image || '';
      }

      if (!image) {
        throw new Error("Image is required.");
      }

      if (isEditing) {
        await updateMenuItem(currentItem.id, {
          name: currentItem.name,
          price: Number(currentItem.price),
          image,
        });
      } else {
        await createMenuItem({
          name: currentItem.name,
          price: Number(currentItem.price),
          image,
        });
      }

      fetchItems(); // Refresh the list
      resetForm();
    } catch (error) {
      console.error('Error submitting item:', error);
    } finally {
      setIsSubmitting(false);
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
        await deleteMenuItem(id);
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

      <MenuAdminForm
        isEditing={isEditing}
        currentItem={currentItem}
        onInputChange={handleInputChange}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
        onCancelEdit={resetForm}
        formRef={formRef}
        isSubmitting={isSubmitting}
      />

      <MenuItemsList
        items={items}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        isLoadingItems={isLoadingItems}
      />
    </div>
  );
}
