
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// Medication: { id, name, dosage, frequency }
// MedicationTableProps: { medications, onAdd, onRemove }

export const MedicationTable = ({ medications, onAdd, onRemove }) => {
  const [newMedication, setNewMedication] = React.useState({ name: '', dosage: '', frequency: '' });

  const handleAdd = () => {
    if (newMedication.name.trim()) {
      onAdd(newMedication);
      setNewMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          value={newMedication.name}
          onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Medication name"
        />
        <Input
          value={newMedication.dosage}
          onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
          placeholder="Dosage"
        />
        <Select 
          value={newMedication.frequency} 
          onValueChange={(value) => setNewMedication(prev => ({ ...prev, frequency: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Once daily">Once daily</SelectItem>
            <SelectItem value="Twice daily">Twice daily</SelectItem>
            <SelectItem value="Three times daily">Three times daily</SelectItem>
            <SelectItem value="Every hour">Every hour</SelectItem>
            <SelectItem value="Every 2 hours">Every 2 hours</SelectItem>
            <SelectItem value="As needed">As needed</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} size="sm">Add</Button>
      </div>

      {medications.length > 0 && (
        <div className="space-y-2">
          {medications.map((medication) => (
            <div key={medication.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid grid-cols-3 gap-4 flex-1">
                <span>{medication.name}</span>
                <span className="text-gray-600">{medication.dosage}</span>
                <span className="text-gray-600">{medication.frequency}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRemove(medication.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
