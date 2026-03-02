import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertTriangle } from 'lucide-react';

const OverrideReasonModal = ({ isOpen, onClose, onConfirm, affectedPatients = [] }) => {
  const [reason, setReason] = useState('');
  const [predefinedReason, setPredefinedReason] = useState('');

  const predefinedReasons = [
    'Emergency medical condition requiring immediate attention',
    'Patient experiencing severe discomfort or pain',
    'Time-sensitive pre-operative evaluation needed',
    'Follow-up for urgent case from previous visit',
    'Patient requested urgent consultation due to vision changes',
    'Doctor specifically requested priority for this patient',
    'Other (specify below)'
  ];

  const handleConfirm = () => {
    const finalReason = predefinedReason === 'Other (specify below)' ? reason : predefinedReason;
    
    if (!finalReason.trim()) {
      return; // Don't allow empty reason
    }
    
    onConfirm(finalReason);
    handleClose();
  };

  const handleClose = () => {
    setReason('');
    setPredefinedReason('');
    onClose();
  };

  const isReasonValid = predefinedReason && (predefinedReason !== 'Other (specify below)' || reason.trim());

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Override Next-in-Line Order
          </DialogTitle>
          <DialogDescription>
            You are about to manually override the current Next-in-Line order for your assigned patients. 
            This action will be logged and must include a valid medical reason.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Affected Patients:</Label>
            <div className="mt-2 space-y-1">
              {affectedPatients.map((patient, index) => (
                <div key={patient.queueEntryId || patient.id} className="text-sm bg-muted p-2 rounded">
                  <span className="font-medium">
                    {patient.patient ? 
                      `${patient.patient.firstName} ${patient.patient.lastName}` : 
                      (patient.fullName || patient.name || 'N/A')
                    }
                  </span> 
                  <span className="text-muted-foreground"> 
                    ({patient.patientVisit?.appointment?.tokenNumber || patient.token || 'No Token'})
                  </span>
                  <span className="ml-2 text-xs">→ Position {index + 1}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Reason for Override:</Label>
            <RadioGroup 
              value={predefinedReason} 
              onValueChange={setPredefinedReason}
              className="space-y-2"
            >
              {predefinedReasons.map((reasonOption) => (
                <div key={reasonOption} className="flex items-start space-x-2">
                  <RadioGroupItem 
                    value={reasonOption} 
                    id={reasonOption}
                    className="mt-0.5"
                  />
                  <Label 
                    htmlFor={reasonOption} 
                    className="text-sm leading-relaxed cursor-pointer"
                  >
                    {reasonOption}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {predefinedReason === 'Other (specify below)' && (
            <div className="space-y-2">
              <Label htmlFor="custom-reason" className="text-sm font-medium">
                Please specify the reason:
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Enter detailed medical reason for the override..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> This override will be permanently logged in the audit trail 
              for compliance and review purposes. Only use this function when medically necessary.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!isReasonValid}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Confirm Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OverrideReasonModal;