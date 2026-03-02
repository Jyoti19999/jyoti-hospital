import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';

const DiagnosisAutocomplete = ({ value = [], onChange, placeholder = "Search and select diagnoses..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/diagnosis-master/search?q=${encodeURIComponent(searchTerm)}&limit=10`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.data || []);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelect = (diagnosis) => {
    // Check if already selected
    const isAlreadySelected = value.some(d => d.id === diagnosis.id);
    if (isAlreadySelected) {
      return;
    }

    // Add to selected diagnoses
    const newValue = [...value, {
      id: diagnosis.id,
      code: diagnosis.code,
      title: typeof diagnosis.title === 'object' ? diagnosis.title['@value'] : diagnosis.title,
      category: diagnosis.ophthalmologyCategory
    }];
    
    onChange(newValue);
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleRemove = (diagnosisId) => {
    const newValue = value.filter(d => d.id !== diagnosisId);
    onChange(newValue);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowSuggestions(true);
    }
  };

  return (
    <div ref={wrapperRef} className="space-y-2">
      {/* Selected Diagnoses */}
      {value && value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50">
          {value.map((diagnosis) => (
            <Badge
              key={diagnosis.id}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1.5"
            >
              <span className="text-sm">{diagnosis.title}</span>
              <button
                type="button"
                onClick={() => handleRemove(diagnosis.id)}
                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (searchTerm.length >= 2) && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Searching...
              </div>
            ) : suggestions.length > 0 ? (
              <ul className="py-1">
                {suggestions.map((diagnosis) => {
                  const isSelected = value.some(d => d.id === diagnosis.id);
                  const title = typeof diagnosis.title === 'object' ? diagnosis.title['@value'] : diagnosis.title;
                  
                  return (
                    <li
                      key={diagnosis.id}
                      onClick={() => !isSelected && handleSelect(diagnosis)}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                        isSelected ? 'bg-gray-50 opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {title}
                            </span>
                            <span className="font-mono text-xs text-gray-500">
                              ({diagnosis.code})
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {diagnosis.ophthalmologyCategory}
                          </div>
                        </div>
                        {isSelected && (
                          <Badge variant="secondary" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="p-3 text-sm text-gray-500 text-center">
                No diagnoses found. Try different keywords.
              </div>
            )}
          </div>
        )}

        {/* Helper Text */}
        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <div className="text-xs text-gray-500 mt-1">
            Type at least 2 characters to search...
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosisAutocomplete;
