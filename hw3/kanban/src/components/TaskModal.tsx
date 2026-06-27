import React, { useState, useEffect } from 'react';
import type { Task, Tag, Priority, Status, Column } from '../types';
import '../styles/styles.css';

interface TaskModalProps {
  isOpen: boolean;
  task?: Task | null;
  tags: Tag[];
  columns: Column[];
  initialStatus?: Status; 
  onSave: (taskData: Partial<Task>) => void;
  onClose: () => void;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  task, 
  tags, 
  columns, 
  initialStatus,
  onSave, 
  onClose 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<Status>('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setSelectedTags(task.tags.map(t => t.id));
      setDueDate(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '');
      setStatus(task.status); 
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setSelectedTags([]);
      setDueDate('');
      
      if (initialStatus && columns.some(col => col.status === initialStatus)) {
        setStatus(initialStatus);
      } else if (columns.length > 0) {
        setStatus(columns[0].status);
      } else {
        setStatus('');
      }
    }
  }, [task, columns, initialStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!status) {
      alert('Please select a column');
      return;
    }

    const taskData: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || undefined,
      status: status,
      priority,
      tags: tags.filter(tag => selectedTags.includes(tag.id)),
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };

    console.log('Task data to save:', taskData);
    
    onSave(taskData);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
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
            {task ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button onClick={onClose} className="close-button">
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              required
              autoFocus={!task}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="form-textarea"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Column (Status) <span className="required">*</span></label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="form-select"
                required
              >
                <option value="">Select a column...</option>
                {columns.map(column => (
                  <option key={column.id} value={column.status}>
                    {column.title}
                    {task && column.status === task.status ? '' : ''}
                    {!task && column.status === initialStatus ? '' : ''}
                  </option>
                ))}
              </select>
              {task && (
                <p className="form-help">
                  Current column: {columns.find(c => c.status === task.status)?.title || task.status}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="form-select"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tags-container">
                {tags.map(tag => (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`tag-button ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                    style={{ borderLeftColor: tag.color }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;