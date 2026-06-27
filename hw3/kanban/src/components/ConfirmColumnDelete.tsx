import React, { useState } from 'react';
import '../styles/styles.css';

interface ConfirmColumnDeleteProps {
  isOpen: boolean;
  columnTitle: string;
  taskCount: number;
  onConfirm: (moveTasksTo: string) => void;
  onCancel: () => void;
  availableColumns: Array<{ id: string; title: string; status: string }>;
}

const ConfirmColumnDelete: React.FC<ConfirmColumnDeleteProps> = ({
  isOpen,
  columnTitle,
  taskCount,
  onConfirm,
  onCancel,
  availableColumns,
}) => {
  const [moveTasksTo, setMoveTasksTo] = useState<string>('');

  if (!isOpen) return null;

  const WarningIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(moveTasksTo);
  };

  return (
    <div className="modal-overlay">
      <div className="confirm-dialog">
        <div className="confirm-header">
          <div className="warning-icon">
            <WarningIcon />
          </div>
          <h3 className="confirm-title">Delete Column</h3>
        </div>
        
        <div className="confirm-message">
          <p>
            Are you sure you want to delete the column "<strong>{columnTitle}</strong>"?
          </p>
          {taskCount > 0 && (
            <div className="task-warning">
              <p>This column contains <strong>{taskCount} task{taskCount !== 1 ? 's' : ''}</strong>.</p>
              <p>Please select where to move these tasks.</p>
            </div>
          )}
        </div>

        {taskCount > 0 && (
          <form onSubmit={handleSubmit} className="move-tasks-form">
            <div className="form-group">
              <label className="form-label">Move tasks to:</label>
              <select
                value={moveTasksTo}
                onChange={(e) => setMoveTasksTo(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select a column...</option>
                {availableColumns
                  .filter(col => col.title !== columnTitle)
                  .map(column => (
                    <option key={column.id} value={column.status}>
                      {column.title}
                    </option>
                  ))}
              </select>
            </div>
          </form>
        )}

        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button 
            onClick={() => onConfirm(moveTasksTo)} 
            className="btn-danger"
            disabled={taskCount > 0 && !moveTasksTo}
          >
            Delete Column
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmColumnDelete;