import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react";
import campusHero from "@/assets/campus-hero.jpg";

const Home = () => {
  const features = [
    {
      icon: AlertCircle,
      title: "Quick Reporting",
      description: "Report campus issues instantly with photo uploads and detailed descriptions",
      color: "text-accent"
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Monitor your complaint status with live updates and notifications",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Department Management",
      description: "Efficient assignment and resolution by specialized departments",
      color: "text-warning"
    },
    {
      icon: CheckCircle,
      title: "Transparent Process",
      description: "Complete visibility from submission to resolution",
      color: "text-success"
    }
  ];

  const stats = [
    { label: "Issues Resolved", value: "1,200+", color: "text-success" },
    { label: "Active Users", value: "500+", color: "text-primary" },
    { label: "Avg Response Time", value: "< 24h", color: "text-accent" },
    { label: "Departments", value: "8", color: "text-warning" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${campusHero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)'
          }}
        />
        <div className="relative container mx-auto px-4 py-24 sm:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
            <h1 className="text-5xl sm:text-7xl font-bold">
              <span className="text-gradient">CampusCare</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Smart Campus Issue Management System
            </p>
            <p className="text-lg text-foreground/80 max-w-3xl mx-auto">
              Report, track, and resolve campus issues seamlessly. From broken furniture to lab equipment - we ensure every complaint reaches the right department.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/login">
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center space-y-2 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className={`text-4xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose CampusCare?
            </h2>
            <p className="text-lg text-muted-foreground">
              A comprehensive solution designed specifically for campus issue management
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="glass-card-hover p-6 space-y-4 animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                  <div className={`w-12 h-12 rounded-lg bg-secondary/50 flex items-center justify-center ${feature.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-30" />
        <div className="relative container mx-auto px-4 text-center">
          <Card className="glass-card max-w-3xl mx-auto p-12 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to Transform Your Campus?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join hundreds of students and staff members who are already experiencing better campus management
            </p>
            <Link to="/login">
              <Button variant="hero" size="lg">
                Start Managing Issues Today
              </Button>
            </Link>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;
