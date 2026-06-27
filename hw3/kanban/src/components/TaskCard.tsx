import React from 'react';
import type { Task } from '../types';
import { formatDate, getPriorityLabel } from '../utils/helpers';
import '../styles/styles.css';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, taskId: string, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  sortBy?: 'date' | 'priority' | 'order'; 
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index,
  onEdit, 
  onDelete, 
  onDragStart,
  onDragOver,
  onDrop,
  sortBy = 'order'
}) => {
  const createdAt = task.createdAt instanceof Date ? task.createdAt : new Date(task.createdAt);
  const updatedAt = task.updatedAt instanceof Date ? task.updatedAt : new Date(task.updatedAt);
  const dueDate = task.dueDate ? 
    (task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)) : 
    undefined;
  
  const isPastDue = dueDate && dueDate < new Date();
  const isDragDisabled = sortBy !== 'order';

  const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
    </svg>
  );

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );

  const HighPriorityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );

  const MediumPriorityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  );

  const LowPriorityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );

  const TagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  );

  const handleDragStart = (e: React.DragEvent) => {
    if (isDragDisabled) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('sourceIndex', index.toString());
    e.dataTransfer.setData('sourceStatus', task.status);
    e.dataTransfer.effectAllowed = 'move';
    
    onDragStart(e, task.id, index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isDragDisabled) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isDragDisabled) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    onDrop(e, index);
  };

  const cardClasses = [
    'task-card',
    `sort-by-${sortBy}`,
    `priority-${task.priority}`,
    isPastDue ? 'past-due' : '',
    isDragDisabled ? 'drag-disabled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      draggable={!isDragDisabled}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cardClasses}
      data-task-id={task.id}
      data-index={index}
    >
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-actions">
          <button onClick={onEdit} className="action-button" title="Edit">
            <EditIcon />
          </button>
          <button onClick={onDelete} className="action-button" title="Delete">
            <DeleteIcon />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-info">
        <div className={`priority-badge priority-${task.priority}`}>
          {task.priority === 'high' && <HighPriorityIcon />}
          {task.priority === 'medium' && <MediumPriorityIcon />}
          {task.priority === 'low' && <LowPriorityIcon />}
          {getPriorityLabel(task.priority)}
        </div>

        {dueDate && (
          <div className={`due-date ${isPastDue ? 'past-due' : ''}`}>
            <ClockIcon />
            {formatDate(dueDate)}
          </div>
        )}
      </div>

      {sortBy === 'date' && (
        <div className="date-info">
          <small>Created: {formatDate(createdAt)}</small>
        </div>
      )}

      {task.tags.length > 0 && (
        <div className="task-tags">
          {task.tags.map(tag => (
            <span
              key={tag.id}
              className="task-tag"
              style={{ borderLeft: `3px solid ${tag.color}` }}
            >
              <TagIcon />
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="task-created">
        Created: {formatDate(createdAt)}
      </div>
    </div>
  );
};

export default TaskCard;