import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Clock, CheckCircle2, LogOut, RefreshCw, Image as ImageIcon, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression, Icon } from 'leaflet';
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

interface Task {
  id: string;
  title: string;
  description: string;
  status: "in-progress" | "resolved";
  createdAt: string;
  student: { email: string };
  assignmentNotes?: string;
  resolutionNotes?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

// Helper component to animate the map view
const ChangeView = ({ center, zoom }: { center: LatLngExpression, zoom: number }) => {
  const map = useMap();
  map.flyTo(center, zoom, {
    animate: true,
    duration: 1.5
  });
  return null;
};

const DepartmentDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [updateData, setUpdateData] = useState({ status: "", notes: "" });
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLngExpression | null>(null); // For "fly-to"
  const defaultMapCenter: LatLngExpression = [22.7196, 75.8577]; // Your campus center

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/complaints/department');
        setTasks(response.data);
      } catch (error: any) { console.error("Failed to fetch tasks:", error); } 
      finally { setIsLoading(false); }
    };
    fetchTasks();
  }, []);

  const handleUpdate = async () => {
    if (!selectedTask || !updateData.status) return;
    setIsUpdating(true);
    try {
      const response = await api.put(`/complaints/${selectedTask.id}`, {
        status: updateData.status as "in-progress" | "resolved",
        resolutionNotes: updateData.notes,
      });
      setTasks(tasks.map(t => (t.id === selectedTask.id ? response.data : t)));
      toast({ title: "Task Updated" });
      setIsUpdateDialogOpen(false);
    } catch (error) { toast({ title: "Update Failed", variant: "destructive" }); } 
    finally { setIsUpdating(false); }
  };

  const handleLogout = () => { localStorage.removeItem('token'); toast({ title: "Logged Out" }); navigate("/login"); };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress": return "bg-primary/20 text-primary border-primary/50";
      case "resolved": return "bg-success/20 text-success border-success/50";
      default: return "bg-muted";
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress": return <Clock className="w-4 h-4" />;
      case "resolved": return <CheckCircle2 className="w-4 h-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold"><span className="text-gradient">Department Dashboard</span></h1>
            <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
        </div>

        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
            <DialogContent className="glass-card">
              <DialogHeader><DialogTitle>Update Task Status</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2"><Label>Status</Label><Select defaultValue={selectedTask?.status} onValueChange={(v) => setUpdateData({ ...updateData, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="resolved">Resolved</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Resolution Notes</Label><Textarea defaultValue={selectedTask?.resolutionNotes} onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleUpdate} disabled={isUpdating}>{isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Task'}</Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
           <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Complaint Image</DialogTitle></DialogHeader>{viewImageUrl && <img src={`http://localhost:5001${viewImageUrl}`} alt="Complaint visual" className="rounded-md object-contain max-h-[70vh] w-auto mx-auto"/>}</DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task List Column */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2"><RefreshCw className="w-6 h-6 text-primary" />Assigned Tasks</h2>
            {tasks.length === 0 ? (
              <Card className="glass-card p-12 text-center"><p>No tasks are currently assigned to your department.</p></Card>
            ) : tasks.map((task) => (
              <Card 
                key={task.id} 
                className="glass-card-hover cursor-pointer"
                onClick={() => {
                  if (task.latitude && task.longitude) {
                    setMapCenter([task.latitude, task.longitude]);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{task.title}</CardTitle>
                      <CardDescription>From: {task.student?.email || 'N/A'}</CardDescription>
                    </div>
                    <div className="flex gap-2 items-start">
                      {task.imageUrl && (<Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setViewImageUrl(task.imageUrl); setIsImageDialogOpen(true); }}><ImageIcon className="w-4 h-4" /></Button>)}
                      <Button variant="hero" onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setUpdateData({ status: task.status, notes: task.resolutionNotes || "" }); setIsUpdateDialogOpen(true); }}><RefreshCw className="w-4 h-4 mr-2" />Update</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <Badge className={`${getStatusColor(task.status)} gap-1`}>{getStatusIcon(task.status)}{task.status}</Badge>
                  {task.assignmentNotes && <p className="text-sm italic text-primary mt-2">Admin Notes: {task.assignmentNotes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Map Column */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <h2 className="text-2xl font-semibold">Task Map</h2>
            <Card className="glass-card">
              <CardContent className="p-0 h-[600px] rounded-lg overflow-hidden">
                <MapContainer center={defaultMapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {tasks.map(t => t.latitude && t.longitude ? (
                    <Marker key={t.id} position={[t.latitude, t.longitude]}><Popup>{t.title}</Popup></Marker>
                  ) : null)}
                  {mapCenter && <ChangeView center={mapCenter} zoom={18} />}
                </MapContainer>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DepartmentDashboard;