import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

const TestRegister = () => {
  const [testResult, setTestResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/registers/eto', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResult('✅ Register API connection successful!');
        toast.success('Register API is working!');
      } else {
        setTestResult('❌ Register API connection failed');
        toast.error('Register API connection failed');
      }
    } catch (error) {
      setTestResult('❌ Network error: ' + error.message);
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Register API Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testConnection} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Register API'}
        </Button>
        
        {testResult && (
          <div className="p-3 bg-gray-100 rounded-md">
            <p className="text-sm">{testResult}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestRegister;