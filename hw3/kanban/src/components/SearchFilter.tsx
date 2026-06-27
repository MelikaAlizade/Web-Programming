import React from 'react';
import type { Tag, Priority } from '../types';
import '../styles/styles.css';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (tagId: string) => void;
  priorityFilter?: Priority;
  onPriorityChange: (priority?: Priority) => void;
  sortBy: 'date' | 'priority' | 'order';
  onSortChange: (sortBy: 'date' | 'priority' | 'order') => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
}

const SearchFilter: React.FC<SearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  tags,
  selectedTags,
  onTagToggle,
  priorityFilter,
  onPriorityChange,
  sortBy,
  onSortChange,
  sortDirection,
  onSortDirectionChange,
}) => {
  const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );

  const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
    </svg>
  );

  const SortAscIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5h10"></path>
      <path d="M11 9h7"></path>
      <path d="M11 13h4"></path>
      <path d="m3 17 3 3 3-3"></path>
      <path d="M6 18V4"></path>
    </svg>
  );

  const SortDescIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5h10"></path>
      <path d="M11 9h7"></path>
      <path d="M11 13h4"></path>
      <path d="m3 17 3 3 3-3"></path>
      <path d="M6 4v14"></path>
    </svg>
  );

  const showDirectionButton = sortBy !== 'order';

  return (
    <div className="search-filter-container">
      <div className="search-input-container">
        <div className="search-icon">
          <SearchIcon />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search in title or description..."
          className="search-input"
        />
      </div>

      <div className="filter-controls">
        <div className="filter-label">
          <FilterIcon />
          <span>Filter:</span>
        </div>
        
        <select
          value={priorityFilter || ''}
          onChange={(e) => onPriorityChange(e.target.value as Priority || undefined)}
          className="select-filter"
        >
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <div className="sort-controls">
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as 'date' | 'priority' | 'order')}
            className="select-filter"
          >
            <option value="order">Sort by Position</option>
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
          
          {showDirectionButton && (
            <button
              onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="sort-direction-button"
              title={sortDirection === 'desc' ? 'Descending' : 'Ascending'}
            >
              {sortDirection === 'desc' ? <SortDescIcon /> : <SortAscIcon />}
            </button>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="tags-section">
          <div className="tags-label">Tags:</div>
          <div className="tags-container">
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => onTagToggle(tag.id)}
                className={`tag-button ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                style={{ borderLeftColor: tag.color }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;