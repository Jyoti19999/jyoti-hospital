import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  MessageSquare, 
  Users, 
  Building2, 
  Send, 
  Search,
  Phone,
  Mail,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import useTpaStore from '@/stores/tpa/tpaStore';

const TPACommunication = () => {
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const {
    isAuthenticated,
    currentUser,
    communications,
    addCommunication
  } = useTpaStore();
  
  if (!isAuthenticated) {
    navigate('/tpa-login');
    return null;
  }
  
  const handleSendMessage = (recipient) => {
    if (message.trim()) {
      addCommunication('general', message, recipient);
      toast({
        title: "Message Sent",
        description: `Message sent to ${recipient}`,
      });
      setMessage('');
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="bg-white shadow-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link to="/tpa-dashboard">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-foreground">Communication Hub</h1>
                <p className="text-sm text-muted-foreground">Manage communications with stakeholders</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="messages" className="space-y-6">
          <TabsList>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="compose">Compose</TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Recent Communications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {communications.map((comm) => (
                    <div key={comm.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <span className="font-medium">{comm.from} → {comm.to}</span>
                        </div>
                        <Badge className="bg-traffic-low text-white">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {comm.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-2">{comm.message}</p>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(comm.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Hospital Contacts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Apollo Hospital', 'Fortis Hospital', 'Max Hospital'].map((hospital) => (
                      <div key={hospital} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <span className="font-medium">{hospital}</span>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Insurance Partners</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Star Health Insurance', 'HDFC ERGO', 'Bajaj Allianz'].map((insurer) => (
                      <div key={insurer} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <span className="font-medium">{insurer}</span>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="compose">
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                />
                <div className="flex space-x-2">
                  <Button onClick={() => handleSendMessage('Hospital')}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Hospital
                  </Button>
                  <Button onClick={() => handleSendMessage('Insurance Company')}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to Insurer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TPACommunication;