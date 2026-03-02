// QR Code display component with download functionality

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Download, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const QRCodeDisplay = ({ 
  qrCode, 
  barcode, 
  token, 
  uid, 
  size = 'medium',
  showDownload = true,
  showCopy = true,
  className = '' 
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const sizeClasses = {
    small: 'w-24 h-24',
    medium: 'w-32 h-32',
    large: 'w-48 h-48'
  };
  
  const handleDownload = (type) => {
    const link = document.createElement('a');
    const filename = `${type}-${token}-${Date.now()}`;
    
    if (type === 'qr' && qrCode?.dataUrl) {
      link.href = qrCode.dataUrl;
      link.download = `${filename}.svg`;
    } else if (type === 'barcode' && barcode?.dataUrl) {
      link.href = barcode.dataUrl;
      link.download = `${filename}.svg`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Downloaded successfully',
      description: `${type.toUpperCase()} code saved to your device`,
    });
  };
  
  const handleCopy = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: 'Copied to clipboard',
        description: `${type} copied successfully`,
      });
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Unable to copy to clipboard',
        variant: 'destructive'
      });
    }
  };
  
  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" />
          Patient Identification
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* QR Code */}
        {qrCode && (
          <div className="flex flex-col items-center space-y-2">
            <div className="p-2 bg-card border rounded-lg">
              <div 
                className={`${sizeClasses[size]} flex items-center justify-center`}
                dangerouslySetInnerHTML={{ __html: qrCode.svg }}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Scan at registration kiosk
            </p>
            {showDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload('qr')}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            )}
          </div>
        )}
        
      
        
        {/* Token Information */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Token ID:</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {token}
              </Badge>
              {showCopy && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(token, 'Token ID')}
                  className="h-8 w-8 p-0"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>
          
          {uid && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Patient UID:</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {uid}
                </Badge>
                {showCopy && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(uid, 'UID')}
                    className="h-8 w-8 p-0"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Instructions:</strong> Present this QR code at the registration kiosk when you arrive. 
            Your Token ID is valid for 24 hours from booking. Keep your UID for future visits.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeDisplay;