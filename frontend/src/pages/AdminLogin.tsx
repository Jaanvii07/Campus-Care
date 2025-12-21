import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react"; // Changed icon to Shield for Admin
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const AdminLogin = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Note: implicitly uses '/api' prefix via api.ts
      const response = await api.post('/auth/login/admin', { email, password });
      
      // 🔍 DEBUG: See what the admin response looks like
      console.log("🔥 ADMIN LOGIN RESPONSE:", response.data);

      // 1. Store the token
      localStorage.setItem('token', response.data.token);

      // 2. Store user info (The Fix: Handle both nested and flat data)
      if (response.data.user) {
        // Format A: { token: '...', user: { role: 'admin', ... } }
        localStorage.setItem('user', JSON.stringify(response.data.user));
      } else {
        // Format B: Fallback if data is flat or named differently
        // We manually ensure the role is set to 'admin' just in case
        const adminData = { ...response.data, role: 'admin' };
        localStorage.setItem('user', JSON.stringify(adminData));
      }

      toast({ title: "Admin Login Successful" });
      
      // 3. Navigate to the Admin Dashboard
      navigate('/admin'); 

    } catch (error: any) {
      console.error("Admin Login Error:", error);
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid admin credentials",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Darker background for Admin to distinguish it */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800 opacity-50" />
      <Link to="/" className="absolute top-6 left-6"><Button variant="ghost" className="text-white hover:text-white/80">← Back to Home</Button></Link>
      
      <Card className="glass-card w-full max-w-md relative z-10 animate-slide-up border-slate-700 bg-slate-900/50 text-white">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold text-white">Admin Portal</CardTitle>
          <CardDescription className="text-slate-400">Secure access for administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@campus.edu" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="bg-slate-800 border-slate-700 text-white"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  className="bg-slate-800 border-slate-700 text-white"
                />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : <><ShieldCheck className="w-4 h-4 mr-2" /> Access Admin Dashboard</>}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-x-2">
            <Link to="/login/student" className="font-semibold text-slate-400 underline-offset-4 hover:text-white hover:underline">Student Portal</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;