import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tags, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';

const AddStaffType = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [staffTypes, setStaffTypes] = useState([]);
  const [newType, setNewType] = useState('');

  useEffect(() => {
    fetchStaffTypes();
  }, []);

  const fetchStaffTypes = async () => {
    try {
      const response = await axios.get('/api/v1/staff-types');
      setStaffTypes(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load staff types",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/v1/staff-types', {
        type: newType.trim()
      });

      toast({
        title: "Success",
        description: "Staff type added successfully"
      });

      setNewType('');
      fetchStaffTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to add staff type",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this staff type?')) {
      return;
    }

    try {
      await axios.delete(`/api/v1/staff-types/${id}`);
      
      toast({
        title: "Success",
        description: "Staff type deleted successfully"
      });

      fetchStaffTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete staff type",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Add New Staff Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5" />
            Add New Staff Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Staff Type</Label>
              <Input
                id="type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="e.g., ot-admin, receptionist1"
                required
              />
              <p className="text-xs text-gray-500">
                Enter a unique staff type identifier (lowercase, use hyphens for spaces)
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Tags className="w-4 h-4 mr-2" />
                  Add Staff Type
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Staff Types */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Staff Types ({staffTypes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {staffTypes.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No staff types found</p>
            ) : (
              staffTypes.map((type) => (
                <div
                  key={type.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Tags className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{type.type}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStaffType;
