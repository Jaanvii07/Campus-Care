import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Loader2, AlertTriangle, BarChart3, CheckCircle, Clock } from 'lucide-react';
import api from '@/lib/api';

interface StatsData {
  total: number;
  statusCounts: {
    pending?: number;
    'in-progress'?: number;
    resolved?: number;
    rejected?: number;
  };
  departmentCounts: { name: string; count: number }[];
}

const PIE_COLORS = {
    pending: '#f59e0b', // amber-500
    'in-progress': '#3b82f6', // blue-500
    resolved: '#22c55e', // green-500
    rejected: '#ef4444', // red-500
};

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/complaints/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return <div className="p-8 text-center text-destructive">Failed to load analytics data. Please try again.</div>;
  }
  
  const pieData = Object.entries(stats.statusCounts).map(([name, value]) => ({ name, value: value || 0 })).filter(d => d.value > 0);
  const hasDepartmentData = stats.departmentCounts && stats.departmentCounts.length > 0;
  const hasStatusData = pieData && pieData.length > 0;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold"><span className="text-gradient">Analytics Dashboard</span></h1>
          <Link to="/admin"><Button variant="outline">← Back to Admin Panel</Button></Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Total</CardTitle><BarChart3 className="h-5 w-5 text-muted-foreground"/></CardHeader><CardContent><div className="text-4xl font-bold">{stats.total}</div></CardContent></Card>
          <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Pending</CardTitle><AlertTriangle className="h-5 w-5 text-warning"/></CardHeader><CardContent><div className="text-4xl font-bold text-warning">{stats.statusCounts.pending || 0}</div></CardContent></Card>
          <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>In Progress</CardTitle><Clock className="h-5 w-5 text-primary"/></CardHeader><CardContent><div className="text-4xl font-bold text-primary">{stats.statusCounts['in-progress'] || 0}</div></CardContent></Card>
          <Card className="glass-card"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle>Resolved</CardTitle><CheckCircle className="h-5 w-5 text-success"/></CardHeader><CardContent><div className="text-4xl font-bold text-success">{stats.statusCounts.resolved || 0}</div></CardContent></Card>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-card col-span-2 md:col-span-1">
            <CardHeader><CardTitle>Complaints by Department</CardTitle></CardHeader>
            <CardContent>
              {hasDepartmentData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.departmentCounts} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted) / 0.3)'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
                    <Bar dataKey="count" name="Complaints" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No complaints have been assigned to departments yet.</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="glass-card col-span-2 md:col-span-1">
            <CardHeader><CardTitle>Complaints by Status</CardTitle></CardHeader>
            <CardContent>
              {hasStatusData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return ( <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central"> {`${(percent * 100).toFixed(0)}%`}</text> );
                      }}>
                       {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as keyof typeof PIE_COLORS]} />
                       ))}
                    </Pie>
                    <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))'}} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No complaints found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;