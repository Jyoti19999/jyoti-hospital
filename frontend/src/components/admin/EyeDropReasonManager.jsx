import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

const EyeDropReasonManager = () => {
    const [reasons, setReasons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [newReason, setNewReason] = useState('');
    const [editingReason, setEditingReason] = useState(null);
    const [editReasonText, setEditReasonText] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReasons();
    }, []);

    const fetchReasons = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${import.meta.env.VITE_API_URL}/eye-drop-reasons`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });


            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to fetch reasons');
            }

            const data = await response.json();
            setReasons(data.data || []);
        } catch (error) {
            setError(error.message);
            toast.error('Failed to load eye drop reasons: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddReason = async () => {
        if (!newReason.trim()) {
            toast.error('Please enter a reason');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/eye-drop-reasons`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: newReason.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add reason');
            }

            toast.success('Eye drop reason added successfully');
            setNewReason('');
            setShowAddDialog(false);
            fetchReasons();
        } catch (error) {
            toast.error(error.message || 'Failed to add reason');
        }
    };

    const handleEditReason = async () => {
        if (!editReasonText.trim()) {
            toast.error('Please enter a reason');
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/eye-drop-reasons/${editingReason.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: editReasonText.trim() })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update reason');
            }

            toast.success('Eye drop reason updated successfully');
            setShowEditDialog(false);
            setEditingReason(null);
            setEditReasonText('');
            fetchReasons();
        } catch (error) {
            toast.error(error.message || 'Failed to update reason');
        }
    };

    const handleDeleteReason = async (id, reason) => {
        if (!confirm(`Are you sure you want to delete "${reason}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/eye-drop-reasons/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete reason');
            }

            toast.success('Eye drop reason deleted successfully');
            fetchReasons();
        } catch (error) {
            toast.error(error.message || 'Failed to delete reason');
        }
    };

    const openEditDialog = (reason) => {
        setEditingReason(reason);
        setEditReasonText(reason.reason);
        setShowEditDialog(true);
    };

    return (
        <Card className="shadow-sm border-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center space-x-2 text-gray-900">
                            <Eye className="h-5 w-5 text-blue-600" />
                            <span>Eye Drop Reasons Management</span>
                        </CardTitle>
                        <CardDescription className="text-gray-600 mt-1">
                            Manage reasons for administering eye drops to patients
                        </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            onClick={fetchReasons}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setShowAddDialog(true)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Reason
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                        <span className="ml-3 text-gray-500">Loading reasons...</span>
                    </div>
                ) : reasons.length === 0 ? (
                    <div className="text-center py-12">
                        <Eye className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No eye drop reasons added yet</p>
                        <p className="text-gray-400 text-sm mt-1">Click "Add Reason" to create your first reason</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {reasons.map((reason, index) => (
                            <div
                                key={reason.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                                    </div>
                                    <span className="font-medium text-gray-900">{reason.reason}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        onClick={() => openEditDialog(reason)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        onClick={() => handleDeleteReason(reason.id, reason.reason)}
                                        variant="outline"
                                        size="sm"
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Add Reason Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Eye Drop Reason</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="newReason">Reason</Label>
                            <Input
                                id="newReason"
                                value={newReason}
                                onChange={(e) => setNewReason(e.target.value)}
                                placeholder="e.g., Dilated Fundus Examination"
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowAddDialog(false);
                                setNewReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddReason}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Add Reason
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Reason Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Eye Drop Reason</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="editReason">Reason</Label>
                            <Input
                                id="editReason"
                                value={editReasonText}
                                onChange={(e) => setEditReasonText(e.target.value)}
                                placeholder="e.g., Dilated Fundus Examination"
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowEditDialog(false);
                                setEditingReason(null);
                                setEditReasonText('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleEditReason}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Update Reason
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default EyeDropReasonManager;
