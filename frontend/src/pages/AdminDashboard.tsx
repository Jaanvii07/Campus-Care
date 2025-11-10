import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock, UserCog, LogOut, Send, Image as ImageIcon, Loader2, XCircle, BarChart2, Users } from "lucide-react";
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

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "resolved" | "rejected";
  createdAt: string;
  student: { email: string };
  department?: string;
  assignmentNotes?: string;
  imageUrl?: string;
  resolutionNotes?: string;
  latitude?: number;
  longitude?: number;
}

// Helper component to animate the map view
const ChangeView = ({ center, zoom }: { center: LatLngExpression, zoom: number }) => {
  const map = useMap();
  map.flyTo(center, zoom, {
    animate: true,
    duration: 1.5 // 1.5 second animation
  });
  return null;
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintToModify, setComplaintToModify] = useState<Complaint | null>(null);
  const [assignmentData, setAssignmentData] = useState({ department: "", notes: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [mapCenter, setMapCenter] = useState<LatLngExpression | null>(null); // For "fly-to"
  const defaultMapCenter: LatLngExpression = [22.7196, 75.8577]; // Your campus center
  
  useEffect(() => {
    const fetchComplaints = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/complaints');
        setComplaints(response.data);
      } catch (error: any) { console.error("Failed to fetch complaints:", error); } 
      finally { setIsLoading(false); }
    };
    fetchComplaints();
  }, []);

  const departments = ["Maintenance", "IT Services", "Hostel", "Library", "Security", "Cleaning", "Academic"];

  const handleAssign = async () => {
    if (!complaintToModify || !assignmentData.department) {
        toast({ title: "Error", description: "Please select a department.", variant: "destructive" });
        return;
    }
    setIsAssigning(true);
    try {
      const response = await api.put(`/complaints/${complaintToModify.id}`, {
        department: assignmentData.department,
        assignmentNotes: assignmentData.notes,
        status: "in-progress",
      });
      setComplaints(complaints.map(c => (c.id === complaintToModify.id ? response.data : c)));
      toast({ title: "Complaint Assigned" });
      setIsAssignDialogOpen(false);
    } catch (error) { toast({ title: "Assignment Failed", variant: "destructive" }); } 
    finally { setIsAssigning(false); }
  };

  const handleReject = async () => {
    if (!complaintToModify || !rejectionReason) {
        toast({ title: "Error", description: "A reason for rejection is required.", variant: "destructive" });
        return;
    }
    setIsRejecting(true);
    try {
      const response = await api.put(`/complaints/${complaintToModify.id}`, {
        status: "rejected",
        rejectionReason: rejectionReason,
      });
      setComplaints(complaints.map(c => (c.id === complaintToModify.id ? response.data : c)));
      toast({ title: "Complaint Rejected" });
      setIsRejectDialogOpen(false);
    } catch (error) { toast({ title: "Rejection Failed", variant: "destructive" }); } 
    finally { setIsRejecting(false); }
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

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  const pendingCount = complaints.filter(c => c.status === "pending").length;
  const inProgressCount = complaints.filter(c => c.status === "in-progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold"><span className="text-gradient">Admin Dashboard</span></h1>
            <p className="text-muted-foreground mt-1">Manage and assign campus complaints</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/users"><Button variant="outline"><Users className="w-4 h-4 mr-2" />Manage Users</Button></Link>
            <Link to="/admin/analytics"><Button variant="outline"><BarChart2 className="w-4 h-4 mr-2" />View Analytics</Button></Link>
            <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="glass-card"><CardHeader className="pb-3"><CardDescription>Pending</CardDescription><CardTitle className="text-3xl text-warning">{pendingCount}</CardTitle></CardHeader></Card>
          <Card className="glass-card"><CardHeader className="pb-3"><CardDescription>In Progress</CardDescription><CardTitle className="text-3xl text-primary">{inProgressCount}</CardTitle></CardHeader></Card>
          <Card className="glass-card"><CardHeader className="pb-3"><CardDescription>Resolved</CardDescription><CardTitle className="text-3xl text-success">{resolvedCount}</CardTitle></CardHeader></Card>
        </div>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader><DialogTitle>Assign Complaint</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Department *</Label><Select onValueChange={(v) => setAssignmentData({ ...assignmentData, department: v })}><SelectTrigger><SelectValue placeholder="Choose a department" /></SelectTrigger><SelectContent>{departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Assignment Notes</Label><Textarea placeholder="Add instructions..." onChange={(e) => setAssignmentData({ ...assignmentData, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
              <Button variant="hero" onClick={handleAssign} disabled={isAssigning}>{isAssigning ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Assigning...</> : 'Assign'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogContent className="glass-card">
            <DialogHeader><DialogTitle>Reject Complaint</DialogTitle><DialogDescription>Provide a reason for rejection. This will be sent to the student.</DialogDescription></DialogHeader>
            <div className="py-4"><Label htmlFor="rejection-reason">Reason *</Label><Textarea id="rejection-reason" placeholder="e.g., Duplicate..." onChange={(e) => setRejectionReason(e.target.value)} /></div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={isRejecting}>{isRejecting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Rejecting...</> : 'Reject Complaint'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
           <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Complaint Image</DialogTitle></DialogHeader>{viewImageUrl && <img src={`http://localhost:5001${viewImageUrl}`} alt="Complaint visual" className="rounded-md object-contain max-h-[70vh] w-auto mx-auto"/>}</DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Complaint List Column */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2"><UserCog className="w-6 h-6 text-primary" />All Complaints</h2>
            {complaints.length === 0 ? (
              <Card className="glass-card p-12 text-center"><p>No complaints found.</p></Card>
            ) : complaints.map((complaint) => (
              <Card 
                key={complaint.id} 
                className="glass-card-hover cursor-pointer"
                onClick={() => {
                  if (complaint.latitude && complaint.longitude) {
                    setMapCenter([complaint.latitude, complaint.longitude]);
                  }
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start gap-3"><CardTitle className="text-xl">{complaint.title}</CardTitle><Badge className={`${getStatusColor(complaint.status)} flex items-center gap-1`}>{getStatusIcon(complaint.status)}{complaint.status}</Badge></div>
                      <CardDescription>By: {complaint.student?.email || 'N/A'}</CardDescription>
                    </div>
                    <div className="flex gap-2 items-start">
                      {complaint.imageUrl && (<Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); setViewImageUrl(complaint.imageUrl); setIsImageDialogOpen(true); }}><ImageIcon className="w-4 h-4" /></Button>)}
                      {complaint.status === "pending" && (
                          <>
                            <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); setComplaintToModify(complaint); setIsRejectDialogOpen(true); }}><XCircle className="w-4 h-4" /></Button>
                            <Button variant="hero" onClick={(e) => { e.stopPropagation(); setComplaintToModify(complaint); setAssignmentData({ department: "", notes: "" }); setIsAssignDialogOpen(true); }}><Send className="w-4 h-4 mr-2" />Assign</Button>
                          </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{complaint.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Map Column */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <h2 className="text-2xl font-semibold">Complaint Map</h2>
            <Card className="glass-card">
              <CardContent className="p-0 h-[600px] rounded-lg overflow-hidden">
                <MapContainer center={defaultMapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {complaints.map(c => c.latitude && c.longitude ? (
                    <Marker key={c.id} position={[c.latitude, c.longitude]}><Popup>{c.title}</Popup></Marker>
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

export default AdminDashboard;