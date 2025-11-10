import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";

type UserRole = "student" | "admin" | "department";

const Register = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole | "">("");
  const [department, setDepartment] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const departments = ["Maintenance", "IT Services", "Hostel", "Library", "Security", "Cleaning", "Academic"];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      toast({ title: "Error", description: "Please select a role.", variant: "destructive" });
      return;
    }
    if (role === 'department' && !department) {
      toast({ title: "Error", description: "Please select a department for the staff role.", variant: "destructive" });
      return;
    }

    try {
      await api.post('/auth/register', {
        email,
        password,
        role,
        department: role === 'department' ? department : undefined,
      });

      toast({
        title: "Registration Successful",
        description: `User ${email} has been created. They can now log in.`,
      });

      // Navigate back to the login page after successful registration
      navigate('/login');

    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
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
            <span className="text-gradient">Create New User</span>
          </CardTitle>
          <CardDescription className="text-base">
            Register a new account for the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="new.user@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select onValueChange={(value) => setRole(value as UserRole)}>
                <SelectTrigger id="role"><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="department">Department Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === 'department' && (
              <div className="space-y-2 animate-in fade-in">
                <Label htmlFor="department">Department</Label>
                <Select onValueChange={(value) => setDepartment(value)}>
                  <SelectTrigger id="department"><SelectValue placeholder="Select a department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <Button type="submit" className="w-full" variant="hero">
              Create User
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;