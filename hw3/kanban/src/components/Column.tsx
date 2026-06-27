import React, { useState } from 'react';
import type { Task, Status } from '../types';
import TaskCard from './TaskCard';
import '../styles/styles.css';

interface ColumnProps {
  title: string;
  status: Status;
  tasks: Task[];
  columnId: string;
  onAddTask: (status: Status) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: Status, index?: number) => void;
  onReorderTasks: (status: Status, taskId: string, newIndex: number) => void;
  sortBy?: 'date' | 'priority' | 'order'; 
}

const Column: React.FC<ColumnProps> = ({
  title,
  status,
  tasks,
  columnId,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDeleteColumn,
  onDragOver,
  onDrop,
  onReorderTasks,
  sortBy = 'order',
}) => {
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  
  const AddIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

  const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );

  const ColumnIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    </svg>
  );

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOverIndex(null);
    onDragOver(e);
  };

  const handleColumnDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    
    if (sourceStatus !== status) {
      onDrop(e, status);
    }
    setDraggedOverIndex(null);
  };

  const handleTaskDragStart = (e: React.DragEvent, taskId: string, index: number) => {
    if (sortBy !== 'order') {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('sourceStatus', status);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceIndex', index.toString());
  };

  const handleTaskDragOver = (e: React.DragEvent) => {
    if (sortBy !== 'order') {
      e.preventDefault();
      return;
    }
    e.preventDefault();
  };

  const handleTaskDrop = (e: React.DragEvent, dropIndex: number) => {
    if (sortBy !== 'order') {
      e.preventDefault();
      return;
    }
    
    e.preventDefault();
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    const taskId = e.dataTransfer.getData('taskId');
    const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex') || '-1');
    
    if (sourceStatus === status) {
      if (taskId && sourceIndex !== dropIndex) {
        onReorderTasks(status, taskId, dropIndex);
      }
    } else {
      onDrop(e, status, dropIndex);
    }
    setDraggedOverIndex(null);
  };

  const handleTaskDragEnter = (index: number) => {
    if (sortBy === 'order') {
      setDraggedOverIndex(index);
    }
  };

  const handleTaskDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const getTaskCardClass = (task: Task, index: number) => {
    const classes = [];
    
    classes.push(`sort-by-${sortBy}`);
    
    classes.push(`priority-${task.priority}`);
    
    if (draggedOverIndex === index) {
      classes.push('drag-over');
    }
    
    if (sortBy !== 'order') {
      classes.push('drag-disabled');
    }
    
    return classes.join(' ');
  };

  return (
    <div
      className="column"
      onDragOver={handleColumnDragOver}
      onDrop={handleColumnDrop}
    >
      <div className="column-header">
        <div className="column-title">
          <ColumnIcon />
          {title}
          <span className="task-count">{tasks.length}</span>
          <span className="sort-mode-indicator">
            {/* {sortBy === 'order' ? 'Position' : sortBy} */}
          </span>
        </div>
        <div className="column-actions">
          <button
            onClick={() => onAddTask(status)}
            className="add-task-button"
            title="Add Task"
          >
            <AddIcon />
          </button>
          <button
            onClick={() => onDeleteColumn(columnId)}
            className="delete-column-button"
            title="Delete Column"
          >
            <DeleteIcon />
          </button>
        </div>
      </div>

      <div className="tasks-container">
        {tasks.map((task, index) => (
          <div 
            key={task.id}
            className={`task-container ${draggedOverIndex === index ? 'drag-over' : ''}`}
            onDragEnter={() => handleTaskDragEnter(index)}
            onDragLeave={handleTaskDragLeave}
          >
            <TaskCard
              task={task}
              index={index}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              onDragStart={handleTaskDragStart}
              onDragOver={handleTaskDragOver}
              onDrop={handleTaskDrop}
              sortBy={sortBy}
            />
          </div>
        ))}

        {tasks.length === 0 && (
          <div className="empty-column">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
};

export default Column;