import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, UserCog, LogOut, Image as ImageIcon, Loader2, BarChart2, Users, ThumbsUp } from "lucide-react";
import { CampusMap, getZone } from "@/components/ui/CampusMap"; // <-- IMPORT THE NEW MAP & HELPER
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "in-progress" | "resolved";
  createdAt: string;
  student: { email: string };
  department: string;
  location: string;
  assignmentNotes?: string;
  imageUrl?: string;
  resolutionNotes?: string;
  upvoteCount: number;
  hasUpvoted: boolean;
}

// You can move this to a shared file if you want
const locations = [
  { value: "library-main", label: "Library - Main Building" },
  { value: "library-floor-1", label: "Library - 1st Floor" },
  { value: "admin-101", label: "Admin Building - Room 101" },
  { value: "admin-quad", label: "Admin Building - Central Quad" },
  { value: "hostel-a-104", label: "Hostel A - Room 104" },
  { value: "hostel-a-common", label: "Hostel A - Common Room" },
  { value: "hostel-b-202", label: "Hostel B - Room 202" },
  { value: "it-lab-1", label: "IT Center - Lab 1" },
];

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [highlightedLocation, setHighlightedLocation] = useState<string | null>(null); 

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

  // --- NEW UPVOTE HANDLER ---
  const handleUpvote = async (complaintId: string) => {
    setComplaints(complaints.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            hasUpvoted: !c.hasUpvoted,
            upvoteCount: c.hasUpvoted ? c.upvoteCount - 1 : c.upvoteCount + 1,
          };
        }
        return c;
      }));
    try {
      await api.post(`/complaints/${complaintId}/upvote`);
    } catch (error) {
      toast({ title: "Error", description: "Could not register vote.", variant: "destructive" });
      setComplaints(complaints.map(c => { // Revert on error
        if (c.id === complaintId) {
          return { ...c, hasUpvoted: !c.hasUpvoted, upvoteCount: c.hasUpvoted ? c.upvoteCount + 1 : c.upvoteCount - 1 };
        }
        return c;
      }));
    }
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

  const inProgressCount = complaints.filter(c => c.status === "in-progress").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;
  
  // --- NEW: Filter complaints based on the hovered zone ---
  const highlightedZone = getZone(highlightedLocation);
  const problemsForZone = highlightedZone
    ? complaints.filter(c => getZone(c.location) === highlightedZone && c.status === 'in-progress')
    : [];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold"><span className="text-gradient">Admin Dashboard</span></h1>
            <p className="text-muted-foreground mt-1">Monitor all campus complaints</p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/users"><Button variant="outline"><Users className="w-4 h-4 mr-2" />Manage Users</Button></Link>
            <Link to="/admin/analytics"><Button variant="outline"><BarChart2 className="w-4 h-4 mr-2" />View Analytics</Button></Link>
            <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="glass-card"><CardHeader className="pb-3"><CardDescription>Total Complaints</CardDescription><CardTitle className="text-3xl">{complaints.length}</CardTitle></CardHeader></Card>
          <Card className="glass-card"><CardHeader className="pb-3"><CardDescription>In Progress</CardDescription><CardTitle className="text-3xl text-primary">{inProgressCount}</CardTitle></CardHeader></Card>
          <Card className="glass-card"><CardHeader className="pb-3"><CardDescription>Resolved</CardDescription><CardTitle className="text-3xl text-success">{resolvedCount}</CardTitle></CardHeader></Card>
        </div>

        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
           <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Complaint Image</DialogTitle></DialogHeader>{viewImageUrl && <img src={viewImageUrl} alt="Complaint visual" className="rounded-md object-contain max-h-[70vh] w-auto mx-auto"/>}</DialogContent>
        </Dialog>

        {/* --- UPDATED TWO-COLUMN LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaint List Column */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2"><UserCog className="w-6 h-6 text-primary" />All Complaints (Monitor)</h2>
            {complaints.length === 0 ? (
             <Card className="glass-card p-12 text-center"><p className="text-lg text-muted-foreground">No complaints found.</p></Card>
            ) : complaints.map((complaint) => (
              <Card 
                key={complaint.id} 
                className="glass-card-hover cursor-pointer"
                onMouseEnter={() => setHighlightedLocation(complaint.location)}
                onMouseLeave={() => setHighlightedLocation(null)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-start gap-3"><CardTitle className="text-xl">{complaint.title}</CardTitle><Badge className={`${getStatusColor(complaint.status)} flex items-center gap-1`}>{getStatusIcon(complaint.status)}{complaint.status}</Badge></div>
                      <CardDescription>By: {complaint.student?.email || 'N/A'} on {new Date(complaint.createdAt).toLocaleDateString()}</CardDescription>
                    </div>
                    <div className="flex gap-2 items-start">
                       {complaint.imageUrl && (<Button variant="outline" size="icon" onClick={() => { setViewImageUrl(complaint.imageUrl); setIsImageDialogOpen(true); }}><ImageIcon className="w-4 h-4" /></Button>)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{complaint.description}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                      <div><Label className="text-xs text-muted-foreground">Location</Label><p className="font-semibold">{locations.find(l => l.value === complaint.location)?.label || complaint.location}</p></div>
                      <div><Label className="text-xs text-muted-foreground">Department</Label><p className="font-semibold text-primary">{complaint.department}</p></div>
                  </div>
                {complaint.imageUrl && <img src={complaint.imageUrl} alt="Complaint visual" className="mt-4 rounded-md max-h-40 border"/>}
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant={complaint.hasUpvoted ? "default" : "outline"} size="sm" onClick={() => handleUpvote(complaint.id)}>
                      <ThumbsUp className={cn("w-4 h-4 mr-2", complaint.hasUpvoted && "fill-white")} />
                      {complaint.upvoteCount}
                    </Button>
                    <span className="text-xs text-muted-foreground">{complaint.upvoteCount === 1 ? "1 person" : `${complaint.upvoteCount} people`} have this issue</span>
                  </div>
                  {complaint.resolutionNotes && <p className="text-xs text-success mt-1">Resolution: {complaint.resolutionNotes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Map Column */}
          <div className="space-y-4 lg:sticky lg:top-6">
            <h2 className="text-2xl font-semibold">Campus Map</h2>
            <Card className="glass-card">
              <CardContent className="p-4">
                <CampusMap 
                  interactive={true} // Allow hover on map
                  highlightedLocation={highlightedLocation}
                  onZoneHover={setHighlightedLocation} // Link map hover to state
                />
                <p className="text-xs text-muted-foreground mt-2">Areas are color-coded by the responsible department.</p>
              </CardContent>
            </Card>

            {/* --- NEW "PROBLEM POP-OUT" CARD --- */}
            {highlightedZone && (
              <Card className="glass-card animate-in fade-in">
                <CardHeader>
                  <CardTitle>Issues in: <span className="text-primary">{highlightedZone}</span></CardTitle>
                </CardHeader>
                <CardContent>
                  {problemsForZone.length > 0 ? (
                    <ul className="space-y-2">
                      {problemsForZone.map(p => (
                        <li key={p.id} className="text-sm flex justify-between">
                          <span>{p.title}</span>
                          <span className="flex items-center gap-1 text-muted-foreground"><ThumbsUp className="w-3 h-3" /> {p.upvoteCount}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active complaints for this zone.</p>
                  )}
                </CardContent>
              </Card>
            )}
            {/* --- END "PROBLEM POP-OUT" CARD --- */}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;