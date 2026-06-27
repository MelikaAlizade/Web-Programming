import React from 'react';
import Header from './components/Header';
import KanbanBoard from './components/KanbanBoard';
import './styles/styles.css';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Header />
      <KanbanBoard />
    </div>
  );
};

export default App;