import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';
import {
  Save, Eye, Trash2, Plus, Image as ImageIcon, Type, MapPin,
  Phone, Mail, Globe, Hash, Upload, ArrowLeft, Undo, Redo,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Printer, FileDown
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

// Paper sizes in pixels at 96 DPI
const PAPER_SIZES = {
  'A4': { width: 794, height: 400, label: 'A4 (210mm × 297mm)' },
  'Letter': { width: 816, height: 400, label: 'Letter (8.5" × 11")' },
  'Legal': { width: 816, height: 450, label: 'Legal (8.5" × 14")' },
  'A5': { width: 559, height: 350, label: 'A5 (148mm × 210mm)' },
};

const FONT_FAMILIES = [
  'Arial',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Helvetica',
  'Tahoma',
  'Trebuchet MS',
  'Comic Sans MS',
  'Impact'
];

const ELEMENT_TYPES = [
  { id: 'logo', label: 'Logo', icon: ImageIcon },
  { id: 'hospitalName', label: 'Hospital Name', icon: Type },
  { id: 'address', label: 'Address', icon: MapPin },
  { id: 'phone', label: 'Phone', icon: Phone },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'website', label: 'Website', icon: Globe },
  { id: 'registrationNo', label: 'Registration No', icon: Hash },
  { id: 'text', label: 'Custom Text', icon: Type },
];

function LetterheadDesignerComponent() {
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [elements, setElements] = useState([]);
  const [paperSize, setPaperSize] = useState('A4');
  const [headerHeight, setHeaderHeight] = useState(400);
  const [selectedElement, setSelectedElement] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showPreview, setShowPreview] = useState(false);
  const canvasRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    fetchTemplates();
  }, []);


  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      // Calculate available width (8 columns out of 12, minus gaps and padding)
      const availableWidth = (window.innerWidth * 0.67) - 100; // 67% for 8 columns, minus padding
      const pageWidth = PAPER_SIZES[paperSize].width;
      const newScale = Math.min(availableWidth / pageWidth, 1);
      setScale(newScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [paperSize]);


  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/letterhead/templates`, {
        withCredentials: true
      });
      setTemplates(response.data);
    } catch (error) {
      toast.error('Failed to load templates');
    }
  };

  const addElement = (type) => {
    const canvasWidth = PAPER_SIZES[paperSize].width;
    const canvasHeight = headerHeight;
    const elementWidth = type === 'logo' ? 120 : 300;
    const elementHeight = type === 'logo' ? 120 : 40;

    // Calculate initial position, ensuring it stays within canvas
    let initialY = 50 + (elements.length * 40);
    if (initialY + elementHeight > canvasHeight) {
      initialY = Math.max(0, canvasHeight - elementHeight - 10);
    }

    let initialX = 0;
    if (initialX + elementWidth > canvasWidth) {
      initialX = Math.max(0, canvasWidth - elementWidth - 10);
    }

    const newElement = {
      id: `element-${Date.now()}`,
      type,
      x: initialX,
      y: initialY,
      width: elementWidth,
      height: elementHeight,
      fontSize: 16,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      color: '#000000',
      backgroundColor: 'transparent',
      content: type === 'text' ? 'Sample Text' : '',
      align: 'left'
    };
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id, updates) => {
    setElements(elements.map(el => {
      if (el.id === id) {
        const updated = { ...el, ...updates };

        // Apply boundary constraints
        const canvasWidth = PAPER_SIZES[paperSize].width;
        const canvasHeight = headerHeight;

        // Ensure element stays within canvas bounds
        if (updated.x < 0) updated.x = 0;
        if (updated.y < 0) updated.y = 0;
        if (updated.x + updated.width > canvasWidth) {
          updated.x = Math.max(0, canvasWidth - updated.width);
        }
        if (updated.y + updated.height > canvasHeight) {
          updated.y = Math.max(0, canvasHeight - updated.height);
        }

        // Ensure minimum size
        if (updated.width < 20) updated.width = 20;
        if (updated.height < 20) updated.height = 20;

        // Ensure element doesn't exceed canvas when resized
        if (updated.x + updated.width > canvasWidth) {
          updated.width = canvasWidth - updated.x;
        }
        if (updated.y + updated.height > canvasHeight) {
          updated.height = canvasHeight - updated.y;
        }

        return updated;
      }
      return el;
    }));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) setSelectedElement(null);
  };

  const handleCanvasMouseDown = (e) => {
    // Don't handle if clicking on a resize handle
    if (e.target.classList.contains('resize-handle')) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    // Account for scale transform
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;


    // Check if clicking on an element
    const clickedElement = elements.find(el =>
      x >= el.x && x <= el.x + el.width &&
      y >= el.y && y <= el.y + el.height
    );

    if (clickedElement) {
      setSelectedElement(clickedElement.id);
      setIsDragging(true);
      setDragOffset({
        x: x - clickedElement.x,
        y: y - clickedElement.y
      });
    } else {
      setSelectedElement(null);
    }
  };

  const handleResizeMouseDown = (e, handle) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
  };

  const handleCanvasMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    // Account for scale transform
    const mouseX = (e.clientX - rect.left) / scale;
    const mouseY = (e.clientY - rect.top) / scale;

    // Get canvas boundaries
    const canvasWidth = PAPER_SIZES[paperSize].width;
    const canvasHeight = headerHeight;

    if (isResizing && selectedElement && resizeHandle) {
      const element = elements.find(el => el.id === selectedElement);
      if (!element) return;

      let newWidth = element.width;
      let newHeight = element.height;
      let newX = element.x;
      let newY = element.y;

      switch (resizeHandle) {
        case 'se': // bottom-right
          newWidth = Math.max(20, Math.min(mouseX - element.x, canvasWidth - element.x));
          newHeight = Math.max(20, Math.min(mouseY - element.y, canvasHeight - element.y));
          break;
        case 'sw': // bottom-left
          const maxWidthSW = element.x + element.width;
          newWidth = Math.max(20, Math.min(element.x + element.width - mouseX, maxWidthSW));
          newHeight = Math.max(20, Math.min(mouseY - element.y, canvasHeight - element.y));
          newX = Math.max(0, mouseX);
          if (newX === 0) newWidth = element.x + element.width;
          break;
        case 'ne': // top-right
          newWidth = Math.max(20, Math.min(mouseX - element.x, canvasWidth - element.x));
          const maxHeightNE = element.y + element.height;
          newHeight = Math.max(20, Math.min(element.y + element.height - mouseY, maxHeightNE));
          newY = Math.max(0, mouseY);
          if (newY === 0) newHeight = element.y + element.height;
          break;
        case 'nw': // top-left
          const maxWidthNW = element.x + element.width;
          const maxHeightNW = element.y + element.height;
          newWidth = Math.max(20, Math.min(element.x + element.width - mouseX, maxWidthNW));
          newHeight = Math.max(20, Math.min(element.y + element.height - mouseY, maxHeightNW));
          newX = Math.max(0, mouseX);
          newY = Math.max(0, mouseY);
          if (newX === 0) newWidth = element.x + element.width;
          if (newY === 0) newHeight = element.y + element.height;
          break;
      }

      updateElement(selectedElement, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });
    } else if (isDragging && selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (!element) return;

      // Calculate new position
      let newX = mouseX - dragOffset.x;
      let newY = mouseY - dragOffset.y;

      // Constrain to canvas boundaries
      newX = Math.max(0, Math.min(newX, canvasWidth - element.width));
      newY = Math.max(0, Math.min(newY, canvasHeight - element.height));

      updateElement(selectedElement, { x: newX, y: newY });
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (selectedElement) {
        updateElement(selectedElement, { content: event.target.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        name: templateName,
        description: templateDescription,
        elements,
        pageSettings: {
          paperSize: paperSize,
          size: paperSize,
          orientation: 'portrait',
          canvasWidth: PAPER_SIZES[paperSize].width,
          canvasHeight: headerHeight
        }
      };

      if (currentTemplate) {
        await axios.put(`${API_URL}/letterhead/templates/${currentTemplate.id}`, templateData, {
          withCredentials: true
        });
        toast.success('Template updated successfully');
      } else {
        await axios.post(`${API_URL}/letterhead/templates`, templateData, {
          withCredentials: true
        });
        toast.success('Template created successfully');
      }

      fetchTemplates();
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = (template) => {
    setCurrentTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setElements(template.elements || []);
    setPaperSize(template.pageSettings?.paperSize || 'A4');
    setHeaderHeight(template.pageSettings?.canvasHeight || 400);
    setSelectedElement(null);
  };

  const resetForm = () => {
    setCurrentTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setElements([]);
    setPaperSize('A4');
    setHeaderHeight(400);
    setSelectedElement(null);
  };

  const deleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await axios.delete(`${API_URL}/letterhead/templates/${id}`, {
        withCredentials: true
      });
      toast.success('Template deleted successfully');
      fetchTemplates();
      if (currentTemplate?.id === id) {
        resetForm();
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const renderElement = (element) => {
    const isSelected = selectedElement === element.id;
    const style = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      fontSize: `${element.fontSize}px`,
      fontFamily: element.fontFamily || 'Arial',
      fontWeight: element.fontWeight || 'normal',
      fontStyle: element.fontStyle || 'normal',
      textDecoration: element.textDecoration || 'none',
      color: element.color || '#000000',
      backgroundColor: element.backgroundColor || 'transparent',
      textAlign: element.align || 'left',
      cursor: 'move',
      border: isSelected ? '2px solid #3b82f6' : '1px dashed rgba(0,0,0,0.1)',
      padding: '4px',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      wordWrap: 'break-word'
    };

    const resizeHandleStyle = {
      position: 'absolute',
      width: '8px',
      height: '8px',
      backgroundColor: '#3b82f6',
      border: '1px solid white',
      borderRadius: '50%',
      zIndex: 10
    };

    if (element.type === 'logo') {
      return (
        <div key={element.id} style={style}>
          {element.content ? (
            <img src={element.content} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 w-full">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          {isSelected && (
            <>
              <div
                className="resize-handle"
                style={{ ...resizeHandleStyle, top: '-4px', left: '-4px', cursor: 'nw-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
              />
              <div
                className="resize-handle"
                style={{ ...resizeHandleStyle, top: '-4px', right: '-4px', cursor: 'ne-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
              />
              <div
                className="resize-handle"
                style={{ ...resizeHandleStyle, bottom: '-4px', left: '-4px', cursor: 'sw-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
              />
              <div
                className="resize-handle"
                style={{ ...resizeHandleStyle, bottom: '-4px', right: '-4px', cursor: 'se-resize' }}
                onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
              />
            </>
          )}
        </div>
      );
    }

    const displayText = element.content || ELEMENT_TYPES.find(t => t.id === element.type)?.label || 'Text';

    return (
      <div key={element.id} style={style}>
        {displayText}
        {isSelected && (
          <>
            <div
              className="resize-handle"
              style={{ ...resizeHandleStyle, top: '-4px', left: '-4px', cursor: 'nw-resize' }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            />
            <div
              className="resize-handle"
              style={{ ...resizeHandleStyle, top: '-4px', right: '-4px', cursor: 'ne-resize' }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            />
            <div
              className="resize-handle"
              style={{ ...resizeHandleStyle, bottom: '-4px', left: '-4px', cursor: 'sw-resize' }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            />
            <div
              className="resize-handle"
              style={{ ...resizeHandleStyle, bottom: '-4px', right: '-4px', cursor: 'se-resize' }}
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            />
          </>
        )}
      </div>
    );
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  const renderPreviewElement = (element) => {
    const style = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: `${element.width}px`,
      height: `${element.height}px`,
      fontSize: `${element.fontSize}px`,
      fontFamily: element.fontFamily || 'Arial',
      fontWeight: element.fontWeight || 'normal',
      fontStyle: element.fontStyle || 'normal',
      textDecoration: element.textDecoration || 'none',
      color: element.color || '#000000',
      backgroundColor: element.backgroundColor || 'transparent',
      textAlign: element.align || 'left',
      padding: '4px',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      wordWrap: 'break-word'
    };

    if (element.type === 'logo') {
      return (
        <div key={element.id} style={style}>
          {element.content ? (
            <img src={element.content} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 w-full">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>
      );
    }

    // Sample data for preview
    const sampleData = {
      hospitalName: 'OptiCare Eye Hospital',
      address: '123 Medical Center, Healthcare District, City - 123456',
      phone: '+91 98765 43210',
      email: 'info@opticare.com',
      website: 'www.opticare.com',
      registrationNo: 'REG/2024/12345'
    };

    const displayText = element.content || sampleData[element.type] || ELEMENT_TYPES.find(t => t.id === element.type)?.label || 'Text';

    return (
      <div key={element.id} style={style}>
        {displayText}
      </div>
    );
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const previewContent = previewRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Letterhead Preview - ${templateName || 'Untitled'}</title>
          <style>
            @page {
              size: ${paperSize === 'A4' ? 'A4' : paperSize === 'Letter' ? 'letter' : 'legal'};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${previewContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleDownloadPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: paperSize === 'A4' ? 'a4' : paperSize === 'Letter' ? 'letter' : 'legal'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${templateName || 'letterhead'}-preview.pdf`);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
    }
  };

  return (
    <SuperAdminLayout pageTitle="Letterhead Designer">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Letterhead Designer</h1>
              <p className="text-gray-600 mt-1">Visual canvas-based letterhead designer</p>
            </div>
          </div>

          {/* Main Content with Tabs */}
          <Tabs defaultValue="designer" className="space-y-6">
            <div className="sticky top-0 z-50 bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-4 -mx-6 px-6 pt-2">
              <TabsList className="grid w-full grid-cols-3 bg-white p-1 rounded-lg shadow-md border max-w-md">
                <TabsTrigger value="designer" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Designer
                </TabsTrigger>
                <TabsTrigger value="templates" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Templates
                </TabsTrigger>
                <TabsTrigger value="preview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Preview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="designer">
              <div className="grid grid-cols-12 gap-4">
                {/* Left Sidebar - Templates */}
                <div className="col-span-2">
                  <Card className="shadow-sm border-0">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <CardTitle className="text-lg text-gray-900">Templates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-4">
                      <Button onClick={resetForm} variant="outline" size="sm" className="w-full border-blue-300 hover:bg-blue-50">
                        <Plus className="h-4 w-4 mr-2" />
                        New Template
                      </Button>
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {templates.map(template => (
                          <div
                            key={template.id}
                            className={`p-3 border rounded cursor-pointer hover:bg-blue-50 transition-colors ${currentTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                              }`}
                            onClick={() => loadTemplate(template)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{template.name}</p>
                                {template.isDefault && (
                                  <span className="text-xs text-green-600">Default</span>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTemplate(template.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {templates.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">No templates yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Center - Canvas */}
                <div className="col-span-8">
                  <Card className="shadow-sm border-0">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg text-gray-900">Design Canvas</CardTitle>
                          <div className="flex gap-2 items-center flex-wrap">
                            <Input
                              value={templateName}
                              onChange={(e) => setTemplateName(e.target.value)}
                              placeholder="Template Name"
                              className="w-48"
                            />
                            <Button onClick={saveTemplate} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                              <Save className="h-4 w-4 mr-2" />
                              Save
                            </Button>
                            <Button variant="outline" onClick={() => setShowPreview(true)} className="border-blue-300 hover:bg-blue-50">
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Paper Size:</Label>
                    <Select value={paperSize} onValueChange={setPaperSize}>
                      <SelectTrigger className="w-44 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAPER_SIZES).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Label className="text-xs whitespace-nowrap">Header Height:</Label>
                    <Input
                      type="number"
                      value={headerHeight}
                      onChange={(e) => setHeaderHeight(parseInt(e.target.value) || 400)}
                      className="w-24 h-8"
                      min="100"
                      max="800"
                    />
                    <span className="text-xs text-gray-500">px</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                {/* Add Elements */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Add Elements</Label>
                  <div className="flex flex-wrap gap-2">
                    {ELEMENT_TYPES.map(type => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.id}
                          variant="outline"
                          size="sm"
                          onClick={() => addElement(type.id)}
                        >
                          <Icon className="h-4 w-4 mr-1" />
                          {type.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Canvas Wrapper */}
                <div
                  className="border rounded-lg bg-gray-100 py-4 flex flex-col items-center"
                  style={{
                    width: "100%",
                    overflowX: "visible",
                    overflowY: "hidden"
                  }}
                >
                  {/* Scale Container */}
                  <div
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: "top center",
                      width: PAPER_SIZES[paperSize].width + 40,
                      height: PAPER_SIZES[paperSize].height + 40,
                      display: "inline-block"
                    }}
                  >

                    {/* Actual Canvas */}
                    <div
                      ref={canvasRef}
                      className="relative bg-white shadow-lg"
                      style={{
                        width: `${PAPER_SIZES[paperSize].width}px`,
                        height: `${headerHeight}px`,
                        backgroundImage:
                          "linear-gradient(#f0f0f0 1px, transparent 1px), linear-gradient(90deg, #f0f0f0 1px, transparent 1px)",
                        backgroundSize: "20px 20px",
                        minWidth: `${PAPER_SIZES[paperSize].width}px`,
                        boxSizing: "border-box",
                        margin: "20px auto"
                      }}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    >
                      {/* Left boundary */}
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          width: "2px",
                          height: "100%",
                          backgroundColor: "rgba(59, 130, 246, 0.3)",
                          pointerEvents: "none",
                          zIndex: 1000
                        }}
                      />

                      {/* Right boundary */}
                      <div
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 0,
                          width: "2px",
                          height: "100%",
                          backgroundColor: "rgba(59, 130, 246, 0.3)",
                          pointerEvents: "none",
                          zIndex: 1000
                        }}
                      />

                      {/* Render Elements */}
                      {elements.map(element => renderElement(element))}
                    </div>

                    {/* Canvas Info */}
                    <div className="text-center mt-2 text-xs text-gray-500">
                      Canvas: {PAPER_SIZES[paperSize].width}px × {headerHeight}px (X: 0 to {PAPER_SIZES[paperSize].width})
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 text-center">
                  Click and drag elements to position them. Click an element to select and edit properties.
                </p>

              </div>
            </CardContent>

          </Card>
        </div>

        {/* Right Sidebar - Properties */}
        <div className="col-span-2 overflow-y-auto">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[calc(100vh-200px)]">
              {selectedElementData ? (
                <div className="space-y-4">
                  <div className="pb-3 border-b">
                    <Label className="text-xs text-gray-500">Element Type</Label>
                    <p className="font-semibold text-lg">
                      {ELEMENT_TYPES.find(t => t.id === selectedElementData.type)?.label}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Position & Size</Label>
                    <p className="text-xs text-gray-500 mb-2">X: 0 = Left edge, Y: 0 = Top edge</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">X (pixels from left)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedElementData.x)}
                          onChange={(e) => updateElement(selectedElement, { x: parseInt(e.target.value) || 0 })}
                          className="h-8"
                          min="0"
                          max={PAPER_SIZES[paperSize].width - selectedElementData.width}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Y (pixels from top)</Label>
                        <Input
                          type="number"
                          value={Math.round(selectedElementData.y)}
                          onChange={(e) => updateElement(selectedElement, { y: parseInt(e.target.value) || 0 })}
                          className="h-8"
                          min="0"
                          max={headerHeight - selectedElementData.height}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Width</Label>
                        <Input
                          type="number"
                          value={selectedElementData.width}
                          onChange={(e) => updateElement(selectedElement, { width: parseInt(e.target.value) || 100 })}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Height</Label>
                        <Input
                          type="number"
                          value={selectedElementData.height}
                          onChange={(e) => updateElement(selectedElement, { height: parseInt(e.target.value) || 30 })}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {selectedElementData.type !== 'logo' && (
                    <>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Typography</Label>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Font Family</Label>
                            <Select
                              value={selectedElementData.fontFamily || 'Arial'}
                              onValueChange={(v) => updateElement(selectedElement, { fontFamily: v })}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FONT_FAMILIES.map(font => (
                                  <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                    {font}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="text-xs">Font Size</Label>
                            <Input
                              type="number"
                              value={selectedElementData.fontSize}
                              onChange={(e) => updateElement(selectedElement, { fontSize: parseInt(e.target.value) || 16 })}
                              className="h-8"
                            />
                          </div>

                          <div>
                            <Label className="text-xs mb-1 block">Text Style</Label>
                            <div className="flex gap-1">
                              <Button
                                variant={selectedElementData.fontWeight === 'bold' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateElement(selectedElement, {
                                  fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold'
                                })}
                                className="flex-1"
                              >
                                <Bold className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={selectedElementData.fontStyle === 'italic' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateElement(selectedElement, {
                                  fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic'
                                })}
                                className="flex-1"
                              >
                                <Italic className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={selectedElementData.textDecoration === 'underline' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateElement(selectedElement, {
                                  textDecoration: selectedElementData.textDecoration === 'underline' ? 'none' : 'underline'
                                })}
                                className="flex-1"
                              >
                                <Underline className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div>
                            <Label className="text-xs mb-1 block">Text Alignment</Label>
                            <div className="flex gap-1">
                              <Button
                                variant={selectedElementData.align === 'left' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateElement(selectedElement, { align: 'left' })}
                                className="flex-1"
                              >
                                <AlignLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={selectedElementData.align === 'center' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateElement(selectedElement, { align: 'center' })}
                                className="flex-1"
                              >
                                <AlignCenter className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={selectedElementData.align === 'right' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateElement(selectedElement, { align: 'right' })}
                                className="flex-1"
                              >
                                <AlignRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Colors</Label>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs">Text Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={selectedElementData.color || '#000000'}
                                onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                                className="h-8 w-16"
                              />
                              <Input
                                type="text"
                                value={selectedElementData.color || '#000000'}
                                onChange={(e) => updateElement(selectedElement, { color: e.target.value })}
                                className="h-8 flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">Background Color</Label>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                value={selectedElementData.backgroundColor || '#ffffff'}
                                onChange={(e) => updateElement(selectedElement, { backgroundColor: e.target.value })}
                                className="h-8 w-16"
                              />
                              <Input
                                type="text"
                                value={selectedElementData.backgroundColor || 'transparent'}
                                onChange={(e) => updateElement(selectedElement, { backgroundColor: e.target.value })}
                                className="h-8 flex-1"
                                placeholder="transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {selectedElementData.type === 'text' && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Content</Label>
                      <Textarea
                        value={selectedElementData.content}
                        onChange={(e) => updateElement(selectedElement, { content: e.target.value })}
                        rows={4}
                        placeholder="Enter your text here..."
                      />
                    </div>
                  )}

                  {selectedElementData.type === 'logo' && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Logo Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="h-9"
                      />
                      {selectedElementData.content && (
                        <div className="mt-2 p-2 border rounded">
                          <img
                            src={selectedElementData.content}
                            alt="Logo preview"
                            className="max-h-20 mx-auto"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-4"
                    onClick={() => deleteElement(selectedElement)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Element
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">
                    Select an element on the canvas to edit its properties
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </TabsContent>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Letterhead Preview - {templateName || 'Untitled'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div
              ref={previewRef}
              className="bg-white shadow-2xl mx-auto"
              style={{
                width: `${PAPER_SIZES[paperSize].width}px`,
                minHeight: '1000px',
                position: 'relative'
              }}
            >
              {/* Letterhead Header */}
              <div
                className="relative border-b-2 border-gray-200"
                style={{
                  width: '100%',
                  height: `${headerHeight}px`,
                  position: 'relative'
                }}
              >
                {elements.map(element => renderPreviewElement(element))}
              </div>

              {/* Sample Document Content */}
              <div className="p-12">
                <div className="mb-6 text-right text-sm text-gray-600">
                  <p>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p>Ref No: OPT/2024/001234</p>
                </div>

                <div className="mb-6">
                  <p className="font-semibold">To,</p>
                  <p>Mr. John Doe</p>
                  <p>Patient ID: PAT123456</p>
                  <p>123 Patient Street</p>
                  <p>City, State - 123456</p>
                </div>

                <div className="mb-6">
                  <p className="font-semibold mb-2">Subject: Medical Report / Prescription</p>
                </div>

                <div className="mb-6 text-justify">
                  <p className="mb-3">Dear Patient,</p>
                  <p className="mb-3">
                    This is a sample document to demonstrate how your letterhead will appear on official documents
                    such as prescriptions, medical reports, discharge summaries, and invoices.
                  </p>
                  <p className="mb-3">
                    The letterhead design you created will be automatically applied to all printed documents,
                    maintaining a consistent and professional appearance across all hospital communications.
                  </p>
                </div>

                <div className="mb-6">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Description</th>
                        <th className="border border-gray-300 p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 p-2">Consultation Fee</td>
                        <td className="border border-gray-300 p-2 text-right">₹500.00</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 p-2">Diagnostic Tests</td>
                        <td className="border border-gray-300 p-2 text-right">₹1,200.00</td>
                      </tr>
                      <tr className="font-semibold">
                        <td className="border border-gray-300 p-2">Total</td>
                        <td className="border border-gray-300 p-2 text-right">₹1,700.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-12">
                  <p className="mb-1">Sincerely,</p>
                  <div className="mt-8">
                    <p className="font-semibold">Dr. Sarah Wilson</p>
                    <p className="text-sm text-gray-600">Senior Ophthalmologist</p>
                    <p className="text-sm text-gray-600">Reg. No: MED/2024/5678</p>
                  </div>
                </div>

                <div className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-500 text-center">
                  <p>This is a computer-generated document and does not require a signature.</p>
                  <p className="mt-1">For any queries, please contact us at the above mentioned details.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} className="border-blue-300 hover:bg-blue-50">
              <FileDown className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TabsContent value="templates">
        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-gray-900">All Templates</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                  {template.isDefault && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Default</span>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" onClick={() => loadTemplate(template)} className="bg-blue-600 hover:bg-blue-700">
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteTemplate(template.id)} className="text-red-600">
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="preview">
        <Card className="shadow-sm border-0">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-gray-900">Preview</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button onClick={() => setShowPreview(true)} className="bg-blue-600 hover:bg-blue-700">
                <Eye className="h-4 w-4 mr-2" />
                Open Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      </Tabs>
      </div>
      </div>
    </SuperAdminLayout>
  );
}

export default function LetterheadDesigner() {
  return <LetterheadDesignerComponent />;
}
