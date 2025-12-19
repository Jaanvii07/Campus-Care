import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Plus, Clock, CheckCircle2, LogOut, Loader2, ThumbsUp, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchableCombobox } from "@/components/ui/SearchableCombobox";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

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
  upvoteCount: number;
  hasUpvoted: boolean;
}

const departments = [
  { value: "Maintenance", label: "Maintenance" },
  { value: "IT Services", label: "IT Services" },
  { value: "Hostel", label: "Hostel" },
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

const StudentDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [history, setHistory] = useState<Complaint[]>([]);
  const [publicComplaints, setPublicComplaints] = useState<Complaint[]>([]); // Community Feed
  const [newComplaint, setNewComplaint] = useState({ title: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  
  // Filters for Community Tab
  const [filterDept, setFilterDept] = useState("all");
  const [filterLoc, setFilterLoc] = useState("");

  const fetchComplaints = async () => {
    try {
      // 1. Fetch MY complaints
      const myResponse = await api.get('/complaints/student');
      setComplaints(myResponse.data.filter((c: Complaint) => c.status === 'in-progress'));
      setHistory(myResponse.data.filter((c: Complaint) => c.status === 'resolved'));

      // 2. Fetch PUBLIC complaints (Community)
      const publicResponse = await api.get('/complaints/public');
      setPublicComplaints(publicResponse.data);
    } catch (error: any) { console.error("Failed to fetch data:", error); }
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
      const newComp = { ...response.data, upvoteCount: 0, hasUpvoted: false };
      
      setComplaints([newComp, ...complaints]);
      setPublicComplaints([newComp, ...publicComplaints]); // Add to public feed too

      setNewComplaint({ title: "", description: "" });
      setSelectedFile(null);
      setDepartment("");
      setLocation("");
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      toast({ title: "Complaint Submitted Successfully" });
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.response?.data?.message, variant: "destructive" });
    } finally { setIsSubmitting(false); }
  };

  const handleUpvote = async (complaintId: string) => {
    const updateList = (list: Complaint[]) => list.map(c => {
      if (c.id === complaintId) {
        return { ...c, hasUpvoted: !c.hasUpvoted, upvoteCount: c.hasUpvoted ? c.upvoteCount - 1 : c.upvoteCount + 1 };
      }
      return c;
    });

    setComplaints(updateList(complaints));
    setHistory(updateList(history));
    setPublicComplaints(updateList(publicComplaints));

    try {
      await api.post(`/complaints/${complaintId}/upvote`);
    } catch (error) {
      toast({ title: "Error", description: "Vote failed.", variant: "destructive" });
      fetchComplaints(); // Revert on error by re-fetching
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleLogout = () => { localStorage.removeItem('token'); toast({ title: "Logged Out" }); navigate("/login"); };

  // Filter Logic
  const filteredCommunity = publicComplaints.filter(c => {
    const matchesDept = filterDept === "all" || c.department === filterDept;
    const matchesLoc = filterLoc === "" || c.location === filterLoc;
    return matchesDept && matchesLoc;
  });

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold"><span className="text-gradient">Student Dashboard</span></h1>
          <Button variant="destructive" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
        </div>
        <Tabs defaultValue="community">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl">
            <TabsTrigger value="community" className="gap-2"><Users className="w-4 h-4" />Community</TabsTrigger>
            <TabsTrigger value="submit" className="gap-2"><Plus className="w-4 h-4" />New</TabsTrigger>
            <TabsTrigger value="complaints" className="gap-2"><Clock className="w-4 h-4" />My Active</TabsTrigger>
            <TabsTrigger value="history" className="gap-2"><CheckCircle2 className="w-4 h-4" />History</TabsTrigger>
          </TabsList>

          {/* --- NEW COMMUNITY TAB --- */}
          <TabsContent value="community" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 p-4 bg-secondary/20 rounded-lg border">
                <div className="flex-1">
                    <Label className="mb-2 block">Filter by Department</Label>
                    <Select onValueChange={setFilterDept} value={filterDept}>
                        <SelectTrigger><SelectValue placeholder="All Departments" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex-1">
                    <Label className="mb-2 block">Filter by Location</Label>
                    <SearchableCombobox options={locations} value={filterLoc} onChange={setFilterLoc} placeholder="Any Location" emptyMessage="No location found." />
                </div>
            </div>

            {filteredCommunity.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">No active issues found matching your filters.</Card>
            ) : filteredCommunity.map(c => (
                <Card key={c.id} className="glass-card">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div><CardTitle>{c.title}</CardTitle><CardDescription>{c.department} • {locations.find(l=>l.value===c.location)?.label || c.location}</CardDescription></div>
                            <Badge className="bg-primary/20 text-primary border-primary/50">In Progress</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-3">{c.description}</p>
                        <div className="flex items-center gap-2">
                            <Button variant={c.hasUpvoted ? "default" : "outline"} size="sm" onClick={() => handleUpvote(c.id)}>
                                <ThumbsUp className={cn("w-4 h-4 mr-2", c.hasUpvoted && "fill-white")} />{c.upvoteCount}
                            </Button>
                            <span className="text-xs text-muted-foreground">{c.upvoteCount === 1 ? "1 person" : `${c.upvoteCount} people`} facing this</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
          </TabsContent>

          <TabsContent value="submit">
            <Card className="glass-card-hover">
              <CardHeader><CardTitle>Report a New Issue</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label>Title *</Label><Input value={newComplaint.title} onChange={(e) => setNewComplaint({ ...newComplaint, title: e.target.value })} required /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><Label>Department *</Label><Select onValueChange={setDepartment} value={department}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent>{departments.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Location *</Label><SearchableCombobox options={locations} value={location} onChange={setLocation} placeholder="Select room..." emptyMessage="No location found." /></div>
                  </div>
                  <div><Label>Description *</Label><Textarea value={newComplaint.description} onChange={(e) => setNewComplaint({ ...newComplaint, description: e.target.value })} required /></div>
                  <div><Label>Photo (Optional)</Label><Input type="file" accept="image/*" onChange={handleFileChange} /></div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : 'Submit Complaint'}</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="complaints" className="space-y-4">
             <h2 className="text-xl font-semibold">My Active Complaints</h2>
             {complaints.length === 0 ? (<Card className="p-4 text-center text-muted-foreground">You have no active complaints.</Card>) :
              complaints.map((c) => (
              <Card key={c.id} className="glass-card">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div><CardTitle>{c.title}</CardTitle><CardDescription>{new Date(c.createdAt).toLocaleDateString()}</CardDescription></div>
                    <Badge className="bg-primary/20 text-primary border-primary/50">In Progress</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">{c.description}</p>
                  <p className="text-sm font-semibold mt-2">Location: {c.location}</p>
                  {c.imageUrl && <img src={`http://localhost:5001${c.imageUrl}`} alt="Evidence" className="mt-2 rounded-md max-h-40 border"/>}
                  <div className="mt-3 flex items-center gap-2"><Button variant="outline" size="sm" className="pointer-events-none"><ThumbsUp className="w-4 h-4 mr-2" />{c.upvoteCount}</Button></div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-semibold">My Resolved History</h2>
            {history.length === 0 ? (<Card className="p-4 text-center text-muted-foreground">No resolved complaints yet.</Card>) :
             history.map((c) => (
              <Card key={c.id} className="glass-card bg-success/10">
                 <CardHeader>
                  <div className="flex justify-between items-start">
                    <div><CardTitle>{c.title}</CardTitle><CardDescription>Resolved on: {new Date(c.updatedAt).toLocaleDateString()}</CardDescription></div>
                    <Badge className="bg-success/20 text-success border-success/50">Resolved</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-2">{c.description}</p>
                  {c.resolutionNotes && <p className="text-sm text-success font-semibold">Resolution: {c.resolutionNotes}</p>}
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