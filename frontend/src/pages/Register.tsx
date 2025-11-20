import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Call the new, public student-only registration route
      await api.post('/auth/register/student', {
        email,
        password,
      });

      toast({
        title: "Registration Successful",
        description: `Student account for ${email} created. Please log in.`,
      });
      navigate('/login'); // Go to student login page

    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-20" />
      <Link to="/login" className="absolute top-6 left-6">
        <Button variant="ghost">← Back to Login</Button>
      </Link>
      
      <Card className="glass-card w-full max-w-md relative z-10 animate-slide-up">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">
            <span className="text-gradient">Student Registration</span>
          </CardTitle>
          <CardDescription className="text-base">
            Create your student account to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="student.email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            
            <Button type="submit" className="w-full" variant="hero" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Creating Account...</> : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;