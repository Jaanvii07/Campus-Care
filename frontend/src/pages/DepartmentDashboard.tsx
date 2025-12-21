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
import { Clock, CheckCircle2, LogOut, RefreshCw, Image as ImageIcon, Loader2, ThumbsUp } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "in-progress" | "resolved";
  createdAt: string;
  student: { email: string };
  location: string;
  assignmentNotes?: string;
  resolutionNotes?: string;
  imageUrl?: string;
  upvoteCount: number;
  hasUpvoted: boolean;
}

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
    // Validation check
    if (!selectedTask || !updateData.status) {
        console.error("Update blocked: Missing task or status");
        return;
    }
    
    setIsUpdating(true);
    try {
      const response = await api.put(`/complaints/${selectedTask.id}`, {
        status: updateData.status,
        resolutionNotes: updateData.notes,
      });
      
      // Update the list locally
      setTasks(tasks.map(t => (t.id === selectedTask.id ? { ...t, ...response.data } : t)));
      
      toast({ title: "Task Updated Successfully" });
      setIsUpdateDialogOpen(false);
    } catch (error) { 
        toast({ title: "Update Failed", description: "Please try again.", variant: "destructive" }); 
    } finally { 
        setIsUpdating(false); 
    }
  };

  const handleUpvote = async (taskId: string) => {
    setTasks(tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            hasUpvoted: !t.hasUpvoted,
            upvoteCount: t.hasUpvoted ? t.upvoteCount - 1 : t.upvoteCount + 1,
          };
        }
        return t;
      }));
    try {
      await api.post(`/complaints/${taskId}/upvote`);
    } catch (error) {
      toast({ title: "Error", description: "Could not register vote.", variant: "destructive" });
      // Revert if failed
      const response = await api.get('/complaints/department');
      setTasks(response.data);
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
              
              {/* THE FIX: Add a key here to force re-render when the task changes */}
              <div className="space-y-4 py-4" key={selectedTask?.id}>
                <div className="space-y-2">
                    <Label>Status</Label>
                    {/* THE FIX: Use 'value' instead of 'defaultValue' to control the state */}
                    <Select 
                        value={updateData.status} 
                        onValueChange={(v) => setUpdateData({ ...updateData, status: v })}
                    >
                        <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Resolution Notes</Label>
                    <Textarea 
                        value={updateData.notes} 
                        onChange={(e) => setUpdateData({ ...updateData, notes: e.target.value })} 
                        placeholder="Describe how the issue was resolved..."
                    />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleUpdate} disabled={isUpdating}>
                    {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Task'}
                </Button>
              </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
           <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Complaint Image</DialogTitle></DialogHeader>{viewImageUrl && <img src={viewImageUrl} alt="Complaint visual" className="rounded-md object-contain max-h-[70vh] w-auto mx-auto"/>}</DialogContent>
        </Dialog>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold flex items-center gap-2"><RefreshCw className="w-6 h-6 text-primary" />Assigned Tasks</h2>
          {tasks.length === 0 ? (
            <Card className="glass-card p-12 text-center"><p>No tasks are currently assigned to your department.</p></Card>
          ) : tasks.map((task) => (
            <Card key={task.id} className="glass-card-hover">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{task.title}</CardTitle>
                    <CardDescription>From: {task.student?.email || 'N/A'}</CardDescription>
                  </div>
                  <div className="flex gap-2 items-start">
                    {task.imageUrl && (<Button variant="outline" size="icon" onClick={() => { setViewImageUrl(task.imageUrl); setIsImageDialogOpen(true); }}><ImageIcon className="w-4 h-4" /></Button>)}
                    <Button variant="hero" onClick={() => { 
                        setSelectedTask(task); 
                        // Initialize the form state when opening the dialog
                        setUpdateData({ status: task.status, notes: task.resolutionNotes || "" }); 
                        setIsUpdateDialogOpen(true); 
                    }}>
                        <RefreshCw className="w-4 h-4 mr-2" />Update
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{task.description}</p>
                <p className="text-sm font-semibold mt-2">Location: <span className="font-normal">{task.location}</span></p>
                  {/* ✅ CORRECT: Use the image from the current task */}
                {task.imageUrl && <img src={task.imageUrl} alt="Complaint visual" className="mt-2 rounded-md max-h-40 border"/>}        
                <div className="flex justify-between items-center">
                    <Badge className={`${getStatusColor(task.status)} gap-1`}>{getStatusIcon(task.status)}{task.status}</Badge>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{task.upvoteCount === 1 ? "1 person" : `${task.upvoteCount} people`}</span>
                      <Button variant={task.hasUpvoted ? "default" : "outline"} size="sm" onClick={() => handleUpvote(task.id)}>
                        <ThumbsUp className={cn("w-4 h-4 mr-2", task.hasUpvoted && "fill-white")} />
                        {task.upvoteCount}
                      </Button>
                    </div>
                </div>

                {task.assignmentNotes && <p className="text-sm italic text-primary mt-2">Admin Notes: {task.assignmentNotes}</p>}
                {task.resolutionNotes && <p className="text-sm font-semibold text-success mt-2">Resolution: {task.resolutionNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentDashboard;