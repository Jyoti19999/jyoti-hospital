import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Bug, Terminal } from 'lucide-react';
import useOptometristStore from '@/stores/optometrist';

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { getDebugState, activePatients, completedPatients } = useOptometristStore();

  const handleDebugLog = () => {
    getDebugState();
  };

  return (
    <Card className="mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                Debug Panel
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleDebugLog} size="sm" variant="outline">
                <Terminal className="h-4 w-4 mr-2" />
                Log State to Console
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  Active Patients 
                  <Badge variant="secondary">{activePatients.length}</Badge>
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {activePatients.map(patient => (
                    <div key={patient.id} className="text-xs p-2 bg-muted rounded">
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-muted-foreground">ID: {patient.id}</div>
                    </div>
                  ))}
                  {activePatients.length === 0 && (
                    <div className="text-xs text-muted-foreground">No active patients</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  Completed Patients 
                  <Badge variant="secondary">{completedPatients.length}</Badge>
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {completedPatients.map(patient => (
                    <div key={patient.id} className="text-xs p-2 bg-muted rounded">
                      <div className="font-medium">{patient.name}</div>
                      <div className="text-muted-foreground">ID: {patient.id}</div>
                    </div>
                  ))}
                  {completedPatients.length === 0 && (
                    <div className="text-xs text-muted-foreground">No completed patients</div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
              <p className="font-medium mb-1">Future API Integration:</p>
              <p>• Add Patient: POST /api/patients</p>
              <p>• Complete Exam: POST /api/exams</p>
              <p>• Get Queue: GET /api/optometrist/queue</p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default DebugPanel;