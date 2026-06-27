import React from 'react';
import ThemeToggle from './ThemeToggle';
import '../styles/styles.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <div className="logo"></div>
          <h1 className="app-title">Task Management System</h1>
        </div>
        <div className="header-controls">
          <ThemeToggle />
          <div className="system-label"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;