import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import useOptometristStore from '@/stores/optometrist';

const PatientDetailsModal = () => {
  const { selectedPatient, isModalOpen, closeModal, completeExam } = useOptometristStore();
  
  const [testResults, setTestResults] = useState({
    visualAcuityOD: '',
    visualAcuityOS: '',
    iopOD: '',
    iopOS: '',
    pupilResponse: '',
    colorVision: '',
    visualFields: '',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPatient) {
      completeExam(selectedPatient.id, testResults);
      setTestResults({
        visualAcuityOD: '',
        visualAcuityOS: '',
        iopOD: '',
        iopOS: '',
        pupilResponse: '',
        colorVision: '',
        visualFields: '',
        notes: ''
      });
    }
  };

  const handleClose = () => {
    closeModal();
    setTestResults({
      visualAcuityOD: '',
      visualAcuityOS: '',
      iopOD: '',
      iopOS: '',
      pupilResponse: '',
      colorVision: '',
      visualFields: '',
      notes: ''
    });
  };

  if (!selectedPatient) return null;

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Examination - {selectedPatient.name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visual-acuity-od">Visual Acuity OD</Label>
              <Select 
                value={testResults.visualAcuityOD} 
                onValueChange={(value) => setTestResults(prev => ({ ...prev, visualAcuityOD: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20/20">20/20</SelectItem>
                  <SelectItem value="20/25">20/25</SelectItem>
                  <SelectItem value="20/30">20/30</SelectItem>
                  <SelectItem value="20/40">20/40</SelectItem>
                  <SelectItem value="20/50">20/50</SelectItem>
                  <SelectItem value="20/70">20/70</SelectItem>
                  <SelectItem value="20/100">20/100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visual-acuity-os">Visual Acuity OS</Label>
              <Select 
                value={testResults.visualAcuityOS} 
                onValueChange={(value) => setTestResults(prev => ({ ...prev, visualAcuityOS: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20/20">20/20</SelectItem>
                  <SelectItem value="20/25">20/25</SelectItem>
                  <SelectItem value="20/30">20/30</SelectItem>
                  <SelectItem value="20/40">20/40</SelectItem>
                  <SelectItem value="20/50">20/50</SelectItem>
                  <SelectItem value="20/70">20/70</SelectItem>
                  <SelectItem value="20/100">20/100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="iop-od">IOP OD (mmHg)</Label>
              <Input
                id="iop-od"
                type="number"
                placeholder="12-21"
                value={testResults.iopOD}
                onChange={(e) => setTestResults(prev => ({ ...prev, iopOD: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="iop-os">IOP OS (mmHg)</Label>
              <Input
                id="iop-os"
                type="number"
                placeholder="12-21"
                value={testResults.iopOS}
                onChange={(e) => setTestResults(prev => ({ ...prev, iopOS: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pupil-response">Pupil Response</Label>
            <Select 
              value={testResults.pupilResponse} 
              onValueChange={(value) => setTestResults(prev => ({ ...prev, pupilResponse: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select response" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="sluggish">Sluggish</SelectItem>
                <SelectItem value="non-reactive">Non-reactive</SelectItem>
                <SelectItem value="asymmetric">Asymmetric</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color-vision">Color Vision</Label>
            <Select 
              value={testResults.colorVision} 
              onValueChange={(value) => setTestResults(prev => ({ ...prev, colorVision: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="red-green-deficiency">Red-Green Deficiency</SelectItem>
                <SelectItem value="blue-yellow-deficiency">Blue-Yellow Deficiency</SelectItem>
                <SelectItem value="complete-colorblind">Complete Colorblind</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visual-fields">Visual Fields</Label>
            <Select 
              value={testResults.visualFields} 
              onValueChange={(value) => setTestResults(prev => ({ ...prev, visualFields: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full</SelectItem>
                <SelectItem value="peripheral-defects">Peripheral Defects</SelectItem>
                <SelectItem value="central-scotoma">Central Scotoma</SelectItem>
                <SelectItem value="quadrant-defect">Quadrant Defect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional observations or notes..."
              value={testResults.notes}
              onChange={(e) => setTestResults(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              Complete Consultation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PatientDetailsModal;