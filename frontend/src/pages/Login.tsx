import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useNavigate } from "react-router-dom";
import { Shield, User, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

type UserRole = "student" | "admin" | "department";

const Login = () => {
  const [activeTab, setActiveTab] = useState<UserRole>("student");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent, role: UserRole) => {
    e.preventDefault();
    
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem(`${role}-email`) as HTMLInputElement).value;
    const password = (form.elements.namedItem(`${role}-password`) as HTMLInputElement).value;

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.role !== role) {
        toast({
          title: "Login Failed",
          description: `You are trying to log in as a ${role}, but your account is a ${response.data.role}. Please use the correct tab.`,
          variant: "destructive",
        });
        return;
      }

      localStorage.setItem('token', response.data.token);

      toast({
        title: "Login Successful",
        description: `Redirecting to ${role} dashboard...`,
      });
      
      setTimeout(() => {
        if (role === 'student') navigate('/student');
        if (role === 'admin') navigate('/admin');
        if (role === 'department') navigate('/department');
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-20" />
      <Link to="/" className="absolute top-6 left-6">
        <Button variant="ghost">← Back to Home</Button>
      </Link>
      
      <Card className="glass-card w-full max-w-md relative z-10 animate-slide-up">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">
            <span className="text-gradient">CampusCare</span>
          </CardTitle>
          <CardDescription className="text-base">
            Sign in to manage campus issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UserRole)} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="student" className="flex items-center gap-2"> <User className="w-4 h-4" /> <span className="hidden sm:inline">Student</span> </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2"> <Shield className="w-4 h-4" /> <span className="hidden sm:inline">Admin</span> </TabsTrigger>
              <TabsTrigger value="department" className="flex items-center gap-2"> <Building2 className="w-4 h-4" /> <span className="hidden sm:inline">Staff</span> </TabsTrigger>
            </TabsList>

            {(['student', 'admin', 'department'] as UserRole[]).map((role) => (
              <TabsContent key={role} value={role} className="space-y-4">
                <form onSubmit={(e) => handleLogin(e, role)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${role}-email`}>Email</Label>
                    <Input id={`${role}-email`} name={`${role}-email`} type="email" placeholder="your-email@example.com" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`${role}-password`}>Password</Label>
                    <Input id={`${role}-password`} name={`${role}-password`} type="password" placeholder="••••••••" required />
                  </div>
                  <Button type="submit" className="w-full" variant="default">
                    Sign In as {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>

          {/* ADD THIS NEW SECTION */}
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Need to create a new user? </span>
            <Link to="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              Register here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;