import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle2, AlertCircle, LogOut, Loader2, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
// We use CDN paths for icons to fix the Vite bug
import api from "@/lib/api";

// --- THE FIX ---
// This code block correctly points to the icon images on a public CDN,
// bypassing the Vite build issue that breaks the map.
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});
// --- END FIX ---

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  createdAt: string;
  updatedAt: string;
  department?: string;
  imageUrl?: string;
  resolutionNotes?: string;
  assignmentNotes?: string;
  latitude?: number;
  longitude?: number;
}

// Helper component to handle map clicks
const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (loc: { lat: number, lng: number }) => void }) => {
  const [position, setPosition] = useState<LatLngExpression | null>(null);
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });
  return position === null ? null : (
    <Marker position={position}><Popup>New Complaint Location</Popup></Marker>
  );
};


const StudentDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [history, setHistory] = useState<Complaint[]>([]);
  const [newComplaint, setNewComplaint] = useState({ title: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  
  // Set a default center for the map
  const defaultMapCenter: LatLngExpression = [22.7196, 75.8577]; // Change to your campus lat/long

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints/student');
      const activeComplaints = response.data.filter((c: Complaint) => c.status === 'pending' || c.status === 'in-progress');
      const historyComplaints = response.data.filter((c: Complaint) => c.status === 'resolved' || c.status === 'rejected');
      setComplaints(activeComplaints);
      setHistory(historyComplaints);
    } catch (error: any) {
      console.error("Failed to fetch complaints:", error);
    }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', newComplaint.title);
    formData.append('description', newComplaint.description);
    if (selectedFile) formData.append('image', selectedFile);
    if (location) {
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
    }
    try {
      const response = await api.post('/complaints', formData);
      setComplaints([response.data, ...complaints]);
      setNewComplaint({ title: "", description: "" });
      setSelectedFile(null);
      setLocation(null);
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      toast({ title: "Complaint Submitted Successfully" });
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.response?.data?.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File Too Large", description: "Maximum file size is 5MB.", variant: "destructive"});
        event.target.value = ""; return;
      }
      setSelectedFile(file);
    }
  };

  const handleLogout = () => { localStorage.removeItem('token'); toast({ title: "Logged Out" }); navigate("/login"); };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning/20 text-warning border-warning/50";
      case "in-progress": return "bg-primary/20 text-primary border-primary/50";
      case "resolved": return "bg-success/20 text-success border-success/50";
      case "rejected": return "bg-destructive/20 text-destructive border-destructive/50";
      default: return "bg-muted";
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <AlertCircle className="w-4 h-4" />;
      case "in-progress": return <Clock className="w-4 h-4" />;
      case "resolved": return <CheckCircle2 className="w-4 h-4" />;
      case "rejected": return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold"><span className="text-gradient">Student Dashboard</span></h1>
          <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
        </div>
        <Tabs defaultValue="submit">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="submit" className="gap-2"><Plus className="w-4 h-4" />Submit</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2"><Clock className="w-4 h-4" />Active</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><CheckCircle2 className="w-4 h-4" />History</TabsTrigger>
          </TabsList>

          <TabsContent value="submit">
            <Card className="glass-card-hover">
              <CardHeader><CardTitle>Submit New Complaint</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label htmlFor="title">Title *</Label><Input id="title" value={newComplaint.title} onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })} required /></div>
                  <div><Label htmlFor="description">Description *</Label><Textarea id="description" value={newComplaint.description} onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Photo (Optional)</Label>
                    <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer file:text-primary file:font-semibold"/>
                    <p className="text-xs text-muted-foreground">Max 5MB. Images only.</p>
                    {selectedFile && <p className="text-xs text-green-500">Selected: {selectedFile.name}</p>}
                  </div>
                  
                  {/* --- NORMAL MAP SECTION --- */}
                  <div className="space-y-2">
                    <Label>Pin the Location (Optional)</Label>
                    <p className="text-xs text-muted-foreground">Click on the map to set the exact location.</p>
                    <div className="h-[300px] rounded-md overflow-hidden border">
                      <MapContainer 
                        center={defaultMapCenter}
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <LocationPicker onLocationSelect={setLocation} />
                      </MapContainer>
                    </div>
                  </div>
                  {/* --- END OF MAP SECTION --- */}

                  <Button type="submit" variant="hero" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Complaint'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints" className="space-y-4">
             <h2 className="text-xl font-semibold">Active Complaints</h2>
             {complaints.length === 0 ? (<Card className="p-4 text-center text-muted-foreground">No active complaints.</Card>) :
              complaints.map((c) => (
              <Card key={c.id} className="glass-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div><CardTitle>{c.title}</CardTitle><CardDescription>Submitted: {new Date(c.createdAt).toLocaleDateString()}</CardDescription></div>
                    <Badge className={`${getStatusColor(c.status)} gap-1`}>{getStatusIcon(c.status)}{c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{c.description}</p>
                  {c.imageUrl && <img src={`http://localhost:5001${c.imageUrl}`} alt="Complaint visual" className="mt-2 rounded-md max-h-60 w-auto border"/>}
                  
                  {/* --- NORMAL MAP VIEWER --- */}
                  {c.latitude && c.longitude && (
                    <div className="h-[200px] rounded-md overflow-hidden border mt-4">
                      <MapContainer center={[c.latitude, c.longitude]} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} dragging={false} zoomControl={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[c.latitude, c.longitude]}><Popup>{c.title}</Popup></Marker>
                      </MapContainer>
                    </div>
                  )}
                  {/* --- END MAP VIEWER --- */}

                  {c.department && <p className="text-primary mt-2 font-semibold">Assigned: {c.department}</p>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-semibold">Complaint History</h2>
            {history.length === 0 ? (<Card className="p-4 text-center text-muted-foreground">No resolved or rejected complaints.</Card>) :
             history.map((c) => (
              <Card key={c.id} className={c.status === 'resolved' ? 'glass-card bg-success/10' : 'glass-card bg-destructive/10'}>
                 <CardHeader>
                  <div className="flex justify-between items-start">
                    <div><CardTitle>{c.title}</CardTitle><CardDescription>Status changed: {new Date(c.updatedAt).toLocaleDateString()}</CardDescription></div>
                    <Badge className={`${getStatusColor(c.status)} gap-1`}>{getStatusIcon(c.status)}{c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{c.description}</p>
                  {c.imageUrl && <img src={`http://localhost:5001${c.imageUrl}`} alt="Complaint visual" className="mt-2 rounded-md max-h-60 w-auto border"/>}
                  
                  {/* --- NORMAL MAP VIEWER --- */}
                  {c.latitude && c.longitude && (
                    <div className="h-[200px] rounded-md overflow-hidden border mt-4">
                      <MapContainer center={[c.latitude, c.longitude]} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false} dragging={false} zoomControl={false}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[c.latitude, c.longitude]}><Popup>{c.title}</Popup></Marker>
                      </MapContainer>
                    </div>
                  )}
                  {/* --- END MAP VIEWER --- */}

                  {c.status === 'rejected' && c.rejectionReason && (<p className="text-destructive mt-2 text-sm"><b>Reason:</b> {c.rejectionReason}</p>)}
                  {c.status === 'resolved' && c.resolutionNotes && (<p className="text-success mt-2 text-sm"><b>Resolution:</b> {c.resolutionNotes}</p>)}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;