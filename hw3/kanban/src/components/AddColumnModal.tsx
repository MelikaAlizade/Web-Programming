import React, { useState } from 'react';
import '../styles/styles.css';

interface AddColumnModalProps {
  isOpen: boolean;
  onSave: (title: string) => void;
  onClose: () => void;
}

const AddColumnModal: React.FC<AddColumnModalProps> = ({ isOpen, onSave, onClose }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a column title');
      return;
    }
    
    onSave(title.trim());
    setTitle('');
    onClose();
  };

  if (!isOpen) return null;

  const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            Add New Column
          </h2>
          <button onClick={onClose} className="close-button">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Column Title <span className="required">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Review, Backlog, Testing"
              className="form-input"
              required
              autoFocus
            />
            <p className="form-help">
              This will create a new column where you can add tasks.
            </p>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddColumnModal;