import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle2, LogOut, Loader2, ThumbsUp } from "lucide-react"; // Added ThumbsUp
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableCombobox } from "@/components/ui/SearchableCombobox";
import api from "@/lib/api";
import { cn } from "@/lib/utils"; // Import cn for conditional styling

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: "in-progress" | "resolved";
  createdAt: string;
  updatedAt: string;
  department: string;
  location: string;
  imageUrl?: string;
  resolutionNotes?: string;
  assignmentNotes?: string;
  upvoteCount: number;  // <-- NEW
  hasUpvoted: boolean; // <-- NEW
}

// --- Define your campus locations and departments ---
const departments = [
  { value: "Maintenance", label: "Maintenance (e.g., broken chairs, lights)" },
  { value: "IT Services", label: "IT Services (e.g., WiFi, printers)" },
  { value: "Hostel", label: "Hostel (e.g., room issues, water)" },
  { value: "Library", label: "Library" },
  { value: "Security", label: "Security" },
];

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
// --- End of definitions ---


const StudentDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]); // Active complaints
  const [history, setHistory] = useState<Complaint[]>([]); // Resolved complaints
  const [newComplaint, setNewComplaint] = useState({ title: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints/student');
      const activeComplaints = response.data.filter((c: Complaint) => c.status === 'in-progress');
      const historyComplaints = response.data.filter((c: Complaint) => c.status === 'resolved');
      setComplaints(activeComplaints);
      setHistory(historyComplaints);
    } catch (error: any) { console.error("Failed to fetch complaints:", error); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!department || !location) {
        toast({ title: "Error", description: "Please select both a department and a location.", variant: "destructive" });
        return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', newComplaint.title);
    formData.append('description', newComplaint.description);
    formData.append('department', department); 
    formData.append('location', location); 
    if (selectedFile) formData.append('image', selectedFile);

    try {
      const response = await api.post('/complaints', formData);
      // Manually add upvote data to the new complaint
      const newComplaintWithUpvote = { ...response.data, upvoteCount: 1, hasUpvoted: true };
      setComplaints([newComplaintWithUpvote, ...complaints]);
      
      setNewComplaint({ title: "", description: "" });
      setSelectedFile(null);
      setDepartment("");
      setLocation("");
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      
      toast({ title: "Complaint Submitted Successfully" });
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.response?.data?.message || "An error occurred", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- NEW UPVOTE HANDLER ---
  const handleUpvote = async (complaintId: string) => {
    // Optimistic UI Update: Update the state *before* the API call
    const updateLists = (list: Complaint[]) => 
      list.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            hasUpvoted: !c.hasUpvoted,
            upvoteCount: c.hasUpvoted ? c.upvoteCount - 1 : c.upvoteCount + 1,
          };
        }
        return c;
      });
    
    setComplaints(updateLists(complaints));
    setHistory(updateLists(history));

    // Send the API request in the background
    try {
      await api.post(`/complaints/${complaintId}/upvote`);
    } catch (error) {
      // If API fails, revert the optimistic update
      toast({ title: "Error", description: "Could not register vote.", variant: "destructive" });
      const revertLists = (list: Complaint[]) =>
        list.map(c => {
          if (c.id === complaintId) {
            return {
              ...c,
              hasUpvoted: !c.hasUpvoted,
              upvoteCount: c.hasUpvoted ? c.upvoteCount + 1 : c.upvoteCount - 1,
            };
          }
          return c;
        });
      setComplaints(revertLists(complaints));
      setHistory(revertLists(history));
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
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <Select onValueChange={setDepartment} value={department} required>
                      <SelectTrigger><SelectValue placeholder="Select a department" /></SelectTrigger>
                      <SelectContent>
                        {departments.map(dept => (
                          <SelectItem key={dept.value} value={dept.value}>{dept.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Room / Location *</Label>
                    <SearchableCombobox
                      options={locations}
                      value={location}
                      onChange={setLocation}
                      placeholder="Search room or location..."
                      emptyMessage="No location found."
                    />
                  </div>
                  <div><Label htmlFor="description">Description *</Label><Textarea id="description" value={newComplaint.description} onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })} required /></div>
                  <div className="space-y-2">
                    <Label htmlFor="image-upload">Photo (Optional)</Label>
                    <Input id="image-upload" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer file:text-primary file:font-semibold"/>
                    <p className="text-xs text-muted-foreground">Max 5MB. Images only.</p>
                    {selectedFile && <p className="text-xs text-green-500">Selected: {selectedFile.name}</p>}
                  </div>
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
                  <p className="text-sm font-semibold mt-2">Location: <span className="font-normal">{locations.find(l => l.value === c.location)?.label || c.location}</span></p>
                  {c.imageUrl && <img src={`http://localhost:5001${c.imageUrl}`} alt="Complaint visual" className="mt-2 rounded-md max-h-60 w-auto border"/>}
                  <p className="text-primary mt-2 font-semibold">Assigned: {c.department}</p>
                  
                  {/* --- NEW UPVOTE BUTTON --- */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button 
                      variant={c.hasUpvoted ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleUpvote(c.id)}
                    >
                      <ThumbsUp className={cn("w-4 h-4 mr-2", c.hasUpvoted && "fill-white")} />
                      {c.upvoteCount}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {c.upvoteCount === 1 ? "1 person has this issue" : `${c.upvoteCount} people have this issue`}
                    </span>
                  </div>
                  {/* --- END UPVOTE BUTTON --- */}

                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-semibold">Complaint History</h2>
            {history.length === 0 ? (<Card className="p-4 text-center text-muted-foreground">No resolved complaints.</Card>) :
             history.map((c) => (
              <Card key={c.id} className={'glass-card bg-success/10'}>
                 <CardHeader>
                  <div className="flex justify-between items-start">
                    <div><CardTitle>{c.title}</CardTitle><CardDescription>Status changed: {new Date(c.updatedAt).toLocaleDateString()}</CardDescription></div>
                    <Badge className={`${getStatusColor(c.status)} gap-1`}>{getStatusIcon(c.status)}{c.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{c.description}</p>
                  <p className="text-sm font-semibold mt-2">Location: <span className="font-normal">{locations.find(l => l.value === c.location)?.label || c.location}</span></p>
                  {c.imageUrl && <img src={`http://localhost:5001${c.imageUrl}`} alt="Complaint visual" className="mt-2 rounded-md max-h-60 w-auto border"/>}
                  {c.resolutionNotes && (<p className="text-success mt-2 text-sm"><b>Resolution:</b> {c.resolutionNotes}</p>)}
                  
                  {/* --- NEW UPVOTE COUNT (non-interactive) --- */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" className="pointer-events-none">
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {c.upvoteCount}
                    </Button>
                    <span className="text-xs text-muted-foreground">Total upvotes</span>
                  </div>
                  {/* --- END UPVOTE COUNT --- */}

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