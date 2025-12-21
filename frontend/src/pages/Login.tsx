import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { jwtDecode } from "jwt-decode"; // <--- ADD THIS IMPORT

const Login = () => {
  const { toast } = useToast();
  // navigate is unused for the final redirect, but kept for links if needed
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await api.post('/auth/login/student', { email, password });
      
      // 1. Get the Token
      const token = response.data.token;
      if (!token) throw new Error("No token received from server");
      
      localStorage.setItem('token', token);

      // 2. THE FIX: Handle Missing User Object
      // If the backend doesn't send 'user', we extract it from the token
      let user = response.data.user;

      if (!user) {
        console.log("⚠️ User object missing in response. Decoding token...");
        try {
          const decoded: any = jwtDecode(token);
          // Construct the user object manually from the token
          user = {
            id: decoded.id || decoded.userId,
            email: decoded.email || decoded.sub,
            role: decoded.role || decoded.type || 'student' 
          };
        } catch (err) {
          console.error("Token decode failed:", err);
        }
      }

      // 3. Save the User Object (Crucial for useAuth)
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        toast({ title: "Login Successful" });
        
        // 4. Force Redirect to Dashboard
        window.location.href = '/student';
      } else {
        throw new Error("Could not retrieve user details.");
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials or server error.",
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
          <CardTitle className="text-3xl font-bold"><span className="text-gradient">Student Portal</span></CardTitle>
          <CardDescription className="text-base">Sign in with your student account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="student@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing In...</> : <><User className="w-4 h-4 mr-2" /> Sign In as Student</>}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">New student? </span>
            <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              Register here
            </Link>
          </div>

          <div className="mt-6 text-center text-sm space-x-2">
            <Link to="/login/admin" className="font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline">Admin Portal</Link>
            <span>•</span>
            <Link to="/login/department" className="font-semibold text-muted-foreground underline-offset-4 hover:text-primary hover:underline">Staff Portal</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;