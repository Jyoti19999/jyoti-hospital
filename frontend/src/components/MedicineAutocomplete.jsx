import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Pill } from 'lucide-react';

const MedicineAutocomplete = ({ onSelect, placeholder = "Search medicines..." }) => {
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
          `${import.meta.env.VITE_API_URL}/medicine-master/search?q=${encodeURIComponent(searchTerm)}&limit=10`,
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

  const handleSelect = (medicine) => {
    onSelect(medicine);
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggestions(false);
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
    <div ref={wrapperRef} className="relative">
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
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-sm text-gray-500 text-center">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((medicine) => (
                <li
                  key={medicine.id}
                  onClick={() => handleSelect(medicine)}
                  className="px-3 py-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Pill className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-gray-900">
                          {medicine.name}
                        </span>
                        {medicine.code && (
                          <Badge variant="outline" className="text-xs">
                            {medicine.code}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5 ml-6">
                        {medicine.type && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Type:</span>
                            <span>{medicine.type.name}</span>
                          </div>
                        )}
                        {medicine.genericMedicine && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Generic:</span>
                            <span>{medicine.genericMedicine.name}</span>
                          </div>
                        )}
                        {medicine.drugGroup && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Group:</span>
                            <span>{medicine.drugGroup.name}</span>
                          </div>
                        )}
                        {medicine.dosageSchedule && (
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Schedule:</span>
                            <span>{medicine.dosageSchedule.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">
              No medicines found. Try different keywords.
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
  );
};

export default MedicineAutocomplete;
