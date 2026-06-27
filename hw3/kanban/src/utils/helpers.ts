import type { Task, Priority, Column } from '../types';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getDate().toString().padStart(2, '0');
  const year = dateObj.getFullYear().toString().slice(-2);
  return `${month}/${day}/${year}`;
};

export const filterTasks = (tasks: Task[], searchTerm: string, selectedTags: string[], priorityFilter?: Priority): Task[] => {
  return tasks.filter(task => {
    const matchesSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => task.tags.some(t => t.id === tag));
    
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    
    return matchesSearch && matchesTags && matchesPriority;
  });
};

export const sortTasks = (tasks: Task[], sortBy: 'date' | 'priority'): Task[] => {
  return [...tasks].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    } else {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
  });
};

export const getPriorityLabel = (priority: Priority): string => {
  switch (priority) {
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Medium';
  }
};

export const sortColumns = (columns: Column[]): Column[] => {
  return [...columns].sort((a, b) => a.order - b.order);
};

export const generateStatusFromTitle = (title: string): string => {
  return title.toLowerCase().replace(/\s+/g, '-');
};

export const sortTasksByOrder = (tasks: Task[]): Task[] => {
  return [...tasks].sort((a, b) => a.order - b.order);
};

export const getNextTaskOrder = (tasks: Task[]): number => {
  if (tasks.length === 0) return 1;
  return Math.max(...tasks.map(t => t.order)) + 1;
};

export const reorderTasks = (
  tasks: Task[],
  startIndex: number,
  endIndex: number
): Task[] => {
  const result = Array.from(tasks);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result.map((task, index) => ({
    ...task,
    order: index + 1
  }));
};