function FilterBar({ filters, options, onFilterChange, onSearch }) {
  return (
    <div className="filter-bar">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search recipes..."
          value={filters.search || ''}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        <span className="search-icon">🔍</span>
      </div>

      <div className="filter-group">
        <select
          value={filters.meal_type || ''}
          onChange={(e) => onFilterChange('meal_type', e.target.value)}
          className="filter-select"
        >
          <option value="">All Meal Types</option>
          {options.meal_types?.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select
          value={filters.difficulty || ''}
          onChange={(e) => onFilterChange('difficulty', e.target.value)}
          className="filter-select"
        >
          <option value="">All Difficulties</option>
          {options.difficulties?.map(diff => (
            <option key={diff} value={diff}>{diff}</option>
          ))}
        </select>

        <select
          value={filters.cooking_method || ''}
          onChange={(e) => onFilterChange('cooking_method', e.target.value)}
          className="filter-select"
        >
          <option value="">All Cooking Methods</option>
          {options.cooking_methods?.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default FilterBar
