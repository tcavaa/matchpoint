import React from "react";

export default function MenuAdminForm({
  isEditing,
  currentItem,
  onInputChange,
  onFileChange,
  onSubmit,
  onCancelEdit,
  formRef,
  isSubmitting,
}) {
  return (
    <div className="admin-form-card" ref={formRef}>
      <h2>{isEditing ? "Edit Item" : "Add New Item"}</h2>
      <form onSubmit={onSubmit}>
        <input
          type="text"
          name="name"
          id="admin-name-input"
          value={currentItem.name}
          onChange={onInputChange}
          placeholder="Item Name"
          required
        />
        <input
          type="number"
          name="price"
          value={currentItem.price}
          onChange={onInputChange}
          placeholder="Price (GEL)"
          step="0.01"
          required
        />
        <input
          type="file"
          id="image-input"
          name="image"
          onChange={onFileChange}
          accept="image/*"
          required={!isEditing}
        />
        <div className="form-buttons">
          <button className="admin-btn admin-btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting && <span className="btn-spinner" aria-hidden="true" />}
            {isSubmitting ? "Saving..." : isEditing ? "Update Item" : "Add Item"}
          </button>
          {isEditing && (
            <button
              className="admin-btn admin-btn-secondary"
              type="button"
              onClick={onCancelEdit}
              disabled={isSubmitting}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

