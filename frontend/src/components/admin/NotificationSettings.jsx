import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { Play, Trash2, Upload, Volume2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NotificationSettings = () => {
    const { token } = useAuth();
    const [audios, setAudios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedType, setSelectedType] = useState('emergency');
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileDescription, setFileDescription] = useState('');
    const [playingAudio, setPlayingAudio] = useState(null);

    const NOTIFICATION_TYPES = [
        { value: 'emergency', label: 'Emergency' },
        { value: 'completion', label: 'Queue Completion' },
        { value: 'warning', label: 'Warning' },
        { value: 'info', label: 'Information' },
        { value: 'appointment', label: 'Appointment Priority' },
        { value: 'observation', label: 'Observation/Dilation' }
    ];

    useEffect(() => {
        fetchAudios();
    }, []);

    const fetchAudios = async () => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${baseUrl}/admin/notification-audios`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setAudios(data.audios);
            }
        } catch (error) {
            console.error('Error fetching audios:', error);
            toast.error('Failed to load audio settings');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('audio/')) {
                toast.error('Please select an audio file');
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('audio', selectedFile);
        formData.append('type', selectedType);
        formData.append('description', fileDescription);

        // Check if there's already a default for this type, if not, make this default
        const hasDefault = audios.some(a => a.type === selectedType && a.isDefault);
        if (!hasDefault) {
            formData.append('isDefault', 'true');
        }

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${baseUrl}/admin/notification-audios`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Audio uploaded successfully');
                setSelectedFile(null);
                setFileDescription('');
                // Reset file input
                const fileInput = document.getElementById('audio-upload');
                if (fileInput) fileInput.value = '';
                fetchAudios();
            } else {
                toast.error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload audio');
        } finally {
            setUploading(false);
        }
    };

    const playAudio = (filename) => {
        if (playingAudio) {
            playingAudio.pause();
            setPlayingAudio(null);
        }

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
        const audio = new Audio(`${baseUrl}/uploads/notifications/${filename}`);
        audio.play();
        setPlayingAudio(audio);

        audio.onended = () => setPlayingAudio(null);
    };

    const setAsDefault = async (id, type) => {
        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${baseUrl}/admin/notification-audios/${id}/set-default`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ type })
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Default audio updated');
                fetchAudios();
            } else {
                toast.error(data.error || 'Failed to update default');
            }
        } catch (error) {
            console.error('Error updating default:', error);
            toast.error('Failed to update default audio');
        }
    };

    const deleteAudio = async (id) => {
        if (!confirm('Are you sure you want to delete this audio file?')) return;

        try {
            const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
            const response = await fetch(`${baseUrl}/admin/notification-audios/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();
            if (data.success) {
                toast.success('Audio deleted');
                fetchAudios();
            } else {
                toast.error(data.error || 'Failed to delete');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Failed to delete audio');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Notification Sounds</h1>
                        <p className="text-gray-600 mt-1">Manage custom audio files for different notification types</p>
                    </div>
                </div>

                <Card className="shadow-sm border-0">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                            <Volume2 className="h-5 w-5 text-blue-600" />
                            Audio Management
                        </CardTitle>
                        <CardDescription>Upload and configure notification sounds for various events</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid gap-6">
                            {/* Upload Section */}
                            <div className="flex flex-col gap-4 p-4 border rounded-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                                <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                                    <Upload className="w-5 h-5 text-blue-600" /> Upload New Audio
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Notification Type</Label>
                                        <Select value={selectedType} onValueChange={setSelectedType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {NOTIFICATION_TYPES.map(type => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description (Optional)</Label>
                                        <Input
                                            placeholder="e.g., Loud Alarm for Emergency"
                                            value={fileDescription}
                                            onChange={(e) => setFileDescription(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Audio File (MP3, WAV)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="audio-upload"
                                                type="file"
                                                accept="audio/*"
                                                onChange={handleFileSelect}
                                                className="flex-1"
                                            />
                                            <Button
                                                onClick={handleUpload}
                                                disabled={!selectedFile || uploading}
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                {uploading ? 'Uploading...' : 'Upload'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* List Section */}
                            <Tabs defaultValue="emergency" className="w-full">
                                <div className="sticky top-0 z-50 bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-4 -mx-6 px-6 pt-2">
                                    <TabsList className="flex flex-wrap h-auto bg-white shadow-md border">
                                        {NOTIFICATION_TYPES.map(type => (
                                            <TabsTrigger
                                                key={type.value}
                                                value={type.value}
                                                className="flex-1 min-w-[100px] data-[state=active]:bg-blue-500 data-[state=active]:text-white"
                                            >
                                                {type.label}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </div>

                                {NOTIFICATION_TYPES.map(type => (
                                    <TabsContent key={type.value} value={type.value} className="mt-4">
                                        <div className="space-y-2">
                                            {audios.filter(a => a.type === type.value).length === 0 ? (
                                                <div className="text-center py-12 text-gray-500">
                                                    <Volume2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                                    <p>No custom audio files for this type</p>
                                                </div>
                                            ) : (
                                                audios.filter(a => a.type === type.value).map(audio => (
                                                    <div key={audio.id} className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${audio.isDefault ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50'}`}>
                                                        <div className="flex items-center gap-3">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-9 w-9 hover:bg-blue-100"
                                                                onClick={() => playAudio(audio.filename)}
                                                            >
                                                                <Play className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                            <div>
                                                                <p className="font-medium text-sm text-gray-900">{audio.name}</p>
                                                                <p className="text-xs text-gray-500">{audio.description || 'No description'}</p>
                                                            </div>
                                                            {audio.isDefault && (
                                                                <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {!audio.isDefault && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                                                                    onClick={() => setAsDefault(audio.id, type.value)}
                                                                >
                                                                    Set Active
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => deleteAudio(audio.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default NotificationSettings;
