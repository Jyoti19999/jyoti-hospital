import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Clock } from 'lucide-react';
import useOptometristStore from '@/stores/optometrist';

const ActivePatientsPanel = () => {
  const { activePatients, addPatient, startExam } = useOptometristStore();
  const [newPatientName, setNewPatientName] = useState('');

  const handleAddPatient = () => {
    if (newPatientName.trim()) {
      addPatient({
        name: newPatientName.trim(),
        age: Math.floor(Math.random() * 50) + 20, // Mock age
        appointmentTime: new Date().toLocaleTimeString()
      });
      setNewPatientName('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddPatient();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Active Patients ({activePatients.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Patient Section */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter patient name..."
            value={newPatientName}
            onChange={(e) => setNewPatientName(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button onClick={handleAddPatient} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Patient List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activePatients.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No active patients</p>
              <p className="text-sm">Add a patient to get started</p>
            </div>
          ) : (
            activePatients.map((patient) => (
              <Card key={patient.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{patient.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Age: {patient.age} | Time: {patient.appointmentTime}
                    </p>
                    <Badge variant="secondary" className="mt-1">
                      {patient.status}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => startExam(patient.id)}
                    size="sm"
                    variant="default"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Start Exam
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivePatientsPanel;