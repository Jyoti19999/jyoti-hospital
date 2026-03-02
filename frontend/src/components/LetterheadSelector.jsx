import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { toast } from 'sonner';
import { Printer, FileDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export default function LetterheadSelector({ 
  open, 
  onClose, 
  onPrint, 
  onDownloadPDF,
  documentType = 'document' 
}) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/letterhead/templates`, {
        withCredentials: true
      });
      setTemplates(response.data.filter(t => t.isActive));
      
      // Set default template if available
      const defaultTemplate = response.data.find(t => t.isDefault && t.isActive);
      if (defaultTemplate) {
        setSelectedTemplate(defaultTemplate.id);
      }
    } catch (error) {
      toast.error('Failed to load letterhead templates');
    }
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      const templateId = selectedTemplate === 'default' ? null : selectedTemplate;
      await onPrint(templateId);
      onClose();
    } catch (error) {
      toast.error('Failed to print document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const templateId = selectedTemplate === 'default' ? null : selectedTemplate;
      await onDownloadPDF(templateId);
      onClose();
    } catch (error) {
      toast.error('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Letterhead Template</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <Label>Choose a letterhead template for this {documentType}</Label>
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Template</SelectItem>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                  {template.isDefault && ' (Default)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleDownloadPDF} disabled={loading}>
            <FileDown className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} disabled={loading}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
