
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

// Allergy: { id, name, severity }
// AllergyEntryProps: { allergies, onAdd, onRemove }

export const AllergyEntry = ({ allergies, onAdd, onRemove }) => {
  const [newAllergy, setNewAllergy] = React.useState({ name: '', severity: 'mild' });
  const [allergyError, setAllergyError] = React.useState('');

  const validateAllergyName = (value) => {
    const allergyRegex = /^[a-zA-Z\s-]*$/;
    if (!allergyRegex.test(value)) {
      return "Allergy name can only contain letters, spaces, and hyphens";
    }
    return null;
  };

  const handleAdd = () => {
    if (newAllergy.name.trim()) {
      const error = validateAllergyName(newAllergy.name);
      if (error) {
        setAllergyError(error);
        return;
      }
      onAdd(newAllergy);
      setNewAllergy({ name: '', severity: 'mild' });
      setAllergyError('');
    }
  };

  const handleAllergyNameChange = (e) => {
    const value = e.target.value;
    setNewAllergy(prev => ({ ...prev, name: value }));
    if (allergyError) {
      setAllergyError('');
    }
  };

  const handleAllergyNameBlur = () => {
    if (newAllergy.name.trim()) {
      const error = validateAllergyName(newAllergy.name);
      setAllergyError(error || '');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'severe': return 'bg-orange-100 text-orange-800';
      case 'life-threatening': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Input
            value={newAllergy.name}
            onChange={handleAllergyNameChange}
            onBlur={handleAllergyNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Allergy name"
            className={allergyError ? 'border-red-500' : ''}
          />
          {allergyError && (
            <p className="text-xs text-red-500 mt-1">{allergyError}</p>
          )}
        </div>
        <Select 
          value={newAllergy.severity} 
          onValueChange={(value) => setNewAllergy(prev => ({ ...prev, severity: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mild">Mild</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="severe">Severe</SelectItem>
            <SelectItem value="life-threatening">Life-threatening</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          type="button" 
          onClick={handleAdd} 
          size="sm" 
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Add
        </Button>
      </div>

      {allergies.length > 0 && (
        <div className="space-y-2">
          {allergies.map((allergy) => (
            <div key={allergy.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <span>{allergy.name}</span>
                <Badge className={getSeverityColor(allergy.severity)}>
                  {allergy.severity}
                </Badge>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => onRemove(allergy.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
