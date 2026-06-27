export type Priority = 'low' | 'medium' | 'high';
export type Status = string;

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  tags: Tag[];
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  order: number;
}

export interface Column {
  id: string;
  title: string;
  status: Status;
  tasks: Task[];
  order: number;
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
  createdAt: Date;
}