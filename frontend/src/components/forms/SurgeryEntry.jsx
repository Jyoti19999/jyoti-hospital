
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

// Surgery: { id, procedure, date, hospital, complications }
// SurgeryEntryProps: { surgeries, onAdd, onRemove }

export const SurgeryEntry = ({ surgeries, onAdd, onRemove }) => {
  const [newSurgery, setNewSurgery] = React.useState({ 
    procedure: '', 
    date: '', 
    hospital: '', 
    complications: '' 
  });

  const handleAdd = () => {
    if (newSurgery.procedure.trim()) {
      onAdd(newSurgery);
      setNewSurgery({ procedure: '', date: '', hospital: '', complications: '' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Select 
          value={newSurgery.procedure} 
          onValueChange={(value) => setNewSurgery(prev => ({ ...prev, procedure: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Procedure" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LASIK">LASIK</SelectItem>
            <SelectItem value="Cataract Surgery">Cataract Surgery</SelectItem>
            <SelectItem value="Retinal Surgery">Retinal Surgery</SelectItem>
            <SelectItem value="Glaucoma Surgery">Glaucoma Surgery</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={newSurgery.date}
          onChange={(e) => setNewSurgery(prev => ({ ...prev, date: e.target.value }))}
        />
        <Input
          value={newSurgery.hospital}
          onChange={(e) => setNewSurgery(prev => ({ ...prev, hospital: e.target.value }))}
          placeholder="Hospital"
        />
        <Input
          value={newSurgery.complications}
          onChange={(e) => setNewSurgery(prev => ({ ...prev, complications: e.target.value }))}
          placeholder="Complications"
        />
        <Button onClick={handleAdd} size="sm">Add</Button>
      </div>

      {surgeries.length > 0 && (
        <div className="space-y-2">
          {surgeries.map((surgery) => (
            <div key={surgery.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid grid-cols-4 gap-4 flex-1">
                <span>{surgery.procedure}</span>
                <span className="text-gray-600">{surgery.date}</span>
                <span className="text-gray-600">{surgery.hospital}</span>
                <span className="text-gray-600">{surgery.complications || 'None'}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onRemove(surgery.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
