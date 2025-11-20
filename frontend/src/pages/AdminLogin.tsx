import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Loader2 } from "lucide-react";
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
      // Call the new ADMIN-specific login route
      const response = await api.post('/auth/login/admin', { email, password });
      
      // Store the token in localStorage so the 'AdminRoute' guard can see it
      localStorage.setItem('token', response.data.token);

      toast({ title: "Login Successful" });
      navigate('/admin');
    } catch (error: any) {
     toast({
      title: "Login Failed",
      description: error.response?.data?.message, // This will show "Access denied. Not an admin account."
      variant: "destructive",
    });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-20" />
      <Link to="/" className="absolute top-6 left-6"><Button variant="ghost">← Back to Home</Button></Link>
      
      <Card className="glass-card w-full max-w-md relative z-10 animate-slide-up">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold"><span className="text-gradient">Admin Portal</span></CardTitle>
          <CardDescription className="text-base">Sign in with your administrator account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</> : <><Shield className="w-4 h-4 mr-2" /> Sign In as Admin</>}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm space-x-2">
            <Link to="/login" className="font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline">Student Portal</Link>
            <span>•</span>
            <Link to="/login/department" className="font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline">Staff Portal</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;