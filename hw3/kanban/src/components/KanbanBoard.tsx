import React, { useState } from 'react';
import Column from './Column';
import TaskModal from './TaskModal';
import ConfirmDialog from './ConfirmDialog';
import AddColumnModal from './AddColumnModal';
import ConfirmColumnDelete from './ConfirmColumnDelete';
import SearchFilter from './SearchFilter';
import type { Task, Status, Tag, Priority, Column as ColumnType } from '../types';
import { filterTasks, generateId, sortColumns, generateStatusFromTitle, getNextTaskOrder, reorderTasks } from '../utils/helpers';
import { useLocalStorage } from '../hooks/useLocalStorage';
import '../styles/styles.css';

const initialTags: Tag[] = [
  { id: '1', name: 'Urgent', color: '#ef4444' },
  { id: '2', name: 'Development', color: '#3b82f6' },
  { id: '3', name: 'Design', color: '#8b5cf6' },
  { id: '4', name: 'Marketing', color: '#10b981' },
];

const initialColumns: ColumnType[] = [
  { id: 'col-1', title: 'To Do', status: 'todo', tasks: [], order: 1 },
  { id: 'col-2', title: 'In Progress', status: 'in-progress', tasks: [], order: 2 },
  { id: 'col-3', title: 'Done', status: 'done', tasks: [], order: 3 },
];

const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Project Setup',
    description: 'Initialize project structure and configurations',
    status: 'done',
    priority: 'high',
    tags: [initialTags[0], initialTags[1]],
    createdAt: new Date('2023-09-29'),
    updatedAt: new Date('2023-09-30'),
    order: 1
  },
  {
    id: '2',
    title: 'UI Design',
    description: 'Design user interface components',
    status: 'in-progress',
    priority: 'medium',
    tags: [initialTags[2]],
    createdAt: new Date('2023-10-01'),
    updatedAt: new Date('2023-10-05'),
    order: 1
  },
  {
    id: '3',
    title: 'Database Schema',
    description: 'Design and implement database structure',
    status: 'todo',
    priority: 'high',
    tags: [initialTags[1]],
    createdAt: new Date('2023-10-02'),
    updatedAt: new Date('2023-10-02'),
    order: 1
  },
  {
    id: '4',
    title: 'Testing',
    description: 'Write unit and integration tests',
    status: 'todo',
    priority: 'low',
    tags: [initialTags[0]],
    createdAt: new Date('2023-10-04'),
    updatedAt: new Date('2023-10-04'),
    dueDate: new Date('2023-10-20'),
    order: 2
  },
  {
    id: '5',
    title: 'Documentation',
    description: 'Write project documentation',
    status: 'todo',
    priority: 'medium',
    tags: [initialTags[3]],
    createdAt: new Date('2023-10-05'),
    updatedAt: new Date('2023-10-05'),
    order: 3
  },
];

const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useLocalStorage<ColumnType[]>('kanban-columns', 
    initialColumns.map(col => ({
      ...col,
      tasks: sampleTasks
        .filter(task => task.status === col.status)
        .map((task, index) => ({ ...task, order: index + 1 }))
    }))
  );
  const [tags, setTags] = useLocalStorage<Tag[]>('kanban-tags', initialTags);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isColumnDeleteConfirmOpen, setIsColumnDeleteConfirmOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [columnToDelete, setColumnToDelete] = useState<ColumnType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority>();
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'order'>('order');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [newTagName, setNewTagName] = useState('');
  const [selectedColumnForTask, setSelectedColumnForTask] = useState<Status | null>(null);

  const sortedColumns = sortColumns(columns);

  const getTasksByStatus = (status: Status): Task[] => {
    const column = columns.find(col => col.status === status);
    let tasks = column?.tasks || [];
    
    tasks = filterTasks(tasks, searchTerm, selectedTags, priorityFilter);
    
    const sortedTasks = [...tasks].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          const dateComparison = dateB.getTime() - dateA.getTime();
          return sortDirection === 'desc' ? dateComparison : -dateComparison;
        
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityComparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          return sortDirection === 'desc' ? priorityComparison : -priorityComparison;
        
        case 'order':
        default:
          const orderComparison = a.order - b.order;
          return orderComparison;
      }
    });
    
    return sortedTasks;
  };

  const handleAddTask = (status: Status) => {
    setEditingTask(null);
    setSelectedColumnForTask(status);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Partial<Task>) => {
    const taskId = editingTask?.id || generateId();
    const now = new Date();
    
    let taskStatus: Status;
    if (taskData.status) {
      taskStatus = taskData.status;
    } else if (editingTask?.status) {
      taskStatus = editingTask.status;
    } else {
      taskStatus = selectedColumnForTask || 'todo';
    }
    
    const column = columns.find(col => col.status === taskStatus);
    
    let newOrder: number;
    if (editingTask && editingTask.status === taskStatus) {
      newOrder = editingTask.order;
    } else {
      newOrder = column ? getNextTaskOrder(column.tasks) : 1;
    }
    
    const task: Task = {
      id: taskId,
      title: taskData.title!,
      description: taskData.description,
      status: taskStatus,
      priority: taskData.priority || 'medium',
      tags: taskData.tags || [],
      createdAt: editingTask?.createdAt || now,
      updatedAt: now,
      dueDate: taskData.dueDate,
      order: newOrder,
    };

    if (editingTask) {
      setColumns(prevColumns => 
        prevColumns.map(column => {
          const filteredTasks = column.tasks.filter(t => t.id !== editingTask.id);
          
          if (column.status === task.status) {
            return {
              ...column,
              tasks: [...filteredTasks, task],
            };
          }
          
          return {
            ...column,
            tasks: filteredTasks,
          };
        })
      );
    } else {
      setColumns(prevColumns => 
        prevColumns.map(column => {
          if (column.status === task.status) {
            return {
              ...column,
              tasks: [...column.tasks, task],
            };
          }
          return column;
        })
      );
    }
    
    setIsModalOpen(false);
    setEditingTask(null);
    setSelectedColumnForTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId);
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      setColumns(columns.map(column => ({
        ...column,
        tasks: column.tasks.filter(task => task.id !== taskToDelete),
      })));
    }
    setIsConfirmOpen(false);
    setTaskToDelete(null);
  };

  const handleReorderTasks = (status: Status, taskId: string, newIndex: number) => {
    if (sortBy !== 'order') {
      alert('Drag & drop is only available when sorting by Position. Please switch to "Sort by Position" to reorder tasks.');
      return;
    }
    
    setColumns(prevColumns => 
      prevColumns.map(column => {
        if (column.status === status) {
          const taskIndex = column.tasks.findIndex(t => t.id === taskId);
          if (taskIndex === -1 || taskIndex === newIndex) {
            return column;
          }
          
          const reorderedTasks = reorderTasks(column.tasks, taskIndex, newIndex);
          return {
            ...column,
            tasks: reorderedTasks,
          };
        }
        return column;
      })
    );
  };

  const handleAddColumn = (title: string) => {
    const status = generateStatusFromTitle(title);
    const newColumn: ColumnType = {
      id: generateId(),
      title,
      status,
      tasks: [],
      order: columns.length + 1,
    };
    
    setColumns([...columns, newColumn]);
  };

  const handleDeleteColumnRequest = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (column) {
      setColumnToDelete(column);
      setIsColumnDeleteConfirmOpen(true);
    }
  };

  const handleConfirmColumnDelete = (moveTasksToStatus: string) => {
    if (!columnToDelete) return;

    if (columns.length <= 1) {
      alert('Cannot delete the last column. You must have at least one column.');
      setIsColumnDeleteConfirmOpen(false);
      setColumnToDelete(null);
      return;
    }

    const newColumns = columns.filter(col => col.id !== columnToDelete.id);
    
    if (columnToDelete.tasks.length > 0 && moveTasksToStatus) {
      const updatedColumns = newColumns.map(column => {
        if (column.status === moveTasksToStatus) {
          const currentMaxOrder = Math.max(...column.tasks.map(t => t.order), 0);
          const movedTasks = columnToDelete.tasks.map((task, index) => ({
            ...task,
            status: moveTasksToStatus,
            order: currentMaxOrder + index + 1,
            updatedAt: new Date(),
          }));
          return {
            ...column,
            tasks: [...column.tasks, ...movedTasks],
          };
        }
        return column;
      });
      
      setColumns(updatedColumns);
    } else {
      setColumns(newColumns);
    }
    
    setIsColumnDeleteConfirmOpen(false);
    setColumnToDelete(null);
  };

  const handleResetToInitial = () => {
    if (window.confirm('Are you sure you want to reset to initial columns? All custom columns and tasks will be deleted.')) {
      setColumns(initialColumns.map(col => ({
        ...col,
        tasks: sampleTasks
          .filter(task => task.status === col.status)
          .map((task, index) => ({ ...task, order: index + 1 }))
      })));
      setTags(initialTags);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Status, dropIndex?: number) => {
    e.preventDefault();
    
    if (sortBy !== 'order') {
      alert('Drag & drop between columns is only available when sorting by Position. Please switch to "Sort by Position" to move tasks between columns.');
      return;
    }
    
    const taskId = e.dataTransfer.getData('taskId');
    const sourceStatus = e.dataTransfer.getData('sourceStatus');
    
    if (!taskId) return;

    const movedTask = columns.reduce<Task | null>((foundTask, column) => {
      if (foundTask) return foundTask;
      const task = column.tasks.find(t => t.id === taskId);
      return task || null;
    }, null);

    if (!movedTask) return;

    setColumns(prevColumns => {
      let newColumns = prevColumns.map(column => {
        const filteredTasks = column.tasks.filter(t => t.id !== taskId);
        
        if (column.status === status) {
          let updatedTasks = [...filteredTasks];
          const updatedTask = { 
            ...movedTask, 
            status, 
            updatedAt: new Date(),
            order: dropIndex !== undefined ? dropIndex + 1 : getNextTaskOrder(filteredTasks)
          };
          
          if (dropIndex !== undefined) {
            updatedTasks.splice(dropIndex, 0, updatedTask);
            updatedTasks = updatedTasks.map((task, index) => ({
              ...task,
              order: index + 1
            }));
          } else {
            updatedTasks.push(updatedTask);
          }
          
          return {
            ...column,
            tasks: updatedTasks,
          };
        }
        
        return {
          ...column,
          tasks: filteredTasks,
        };
      });
      
      return newColumns;
    });
  };

  const handleAddTag = () => {
    if (newTagName.trim()) {
      const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
      const newTag: Tag = {
        id: generateId(),
        name: newTagName.trim(),
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      setTags([...tags, newTag]);
      setNewTagName('');
    }
  };

  const handleSortChange = (newSortBy: 'date' | 'priority' | 'order') => {
    setSortBy(newSortBy);
    
    if (newSortBy === 'order') {
      setSortDirection('asc');
    } else {
      setSortDirection('desc');
    }
  };

  return (
    <div className="app-container">
      <div className="main-content">
        <SearchFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          tags={tags}
          selectedTags={selectedTags}
          onTagToggle={(tagId) =>
            setSelectedTags(prev =>
              prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
            )
          }
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
        />

        <div className="column-management">
          <div className="column-management-header">
            <h2 className="column-management-title">Column Management</h2>
            <div className="column-management-actions">
              <button
                onClick={() => setIsAddColumnModalOpen(true)}
                className="btn-info"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Column
              </button>
              <button
                onClick={handleResetToInitial}
                className="btn-warning"
              >
                Reset to Initial
              </button>
            </div>
          </div>
          
          <div className="current-columns-info">
            <p className="columns-count">
              Total columns: {columns.length}
            </p>
            <p className="sorting-info">
              Current sorting: {sortBy === 'order' ? 'Position' : sortBy} ({sortDirection === 'desc' ? 'Descending' : 'Ascending'})
              {sortBy !== 'order' && (
                <span className="drag-disabled-hint"> • Drag & drop disabled in this mode</span>
              )}
            </p>
            {columns.length === 0 && (
              <p className="error-message">
                <strong>Warning:</strong> No columns exist. Please add at least one column.
              </p>
            )}
          </div>
        </div>

        <div className="tag-management">
          <div className="tag-management-header">
            <h2 className="tag-management-title">Tag Management</h2>
            <div className="tag-input-container">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="New tag name..."
                className="tag-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                onClick={handleAddTag}
                className="btn-success"
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>

        {columns.length === 0 ? (
          <div className="no-columns-message">
            <div className="empty-state">
              <h3>No Columns Available</h3>
              <p>Please add at least one column to start managing tasks.</p>
              <button
                onClick={() => setIsAddColumnModalOpen(true)}
                className="btn-info"
              >
                Add Your First Column
              </button>
            </div>
          </div>
        ) : (
          <div className="columns-container">
            {sortedColumns.map(column => (
              <Column
                key={column.id}
                columnId={column.id}
                title={column.title}
                status={column.status}
                tasks={getTasksByStatus(column.status)}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onDeleteColumn={handleDeleteColumnRequest}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onReorderTasks={handleReorderTasks}
              />
            ))}
          </div>
        )}

        <TaskModal
          isOpen={isModalOpen}
          task={editingTask}
          tags={tags}
          columns={columns}
          initialStatus={selectedColumnForTask}
          onSave={handleSaveTask}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
            setSelectedColumnForTask(null);
          }}
        />

        <AddColumnModal
          isOpen={isAddColumnModalOpen}
          onSave={handleAddColumn}
          onClose={() => setIsAddColumnModalOpen(false)}
        />

        <ConfirmDialog
          isOpen={isConfirmOpen}
          title="Delete Task"
          message="Are you sure you want to delete this task? This action cannot be undone."
          onConfirm={confirmDelete}
          onCancel={() => {
            setIsConfirmOpen(false);
            setTaskToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
        />

        <ConfirmColumnDelete
          isOpen={isColumnDeleteConfirmOpen}
          columnTitle={columnToDelete?.title || ''}
          taskCount={columnToDelete?.tasks.length || 0}
          onConfirm={handleConfirmColumnDelete}
          onCancel={() => {
            setIsColumnDeleteConfirmOpen(false);
            setColumnToDelete(null);
          }}
          availableColumns={columns}
        />
      </div>
    </div>
  );
};

export default KanbanBoard;