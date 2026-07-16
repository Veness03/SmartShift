import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { useStore } from "./store";
import { useAuthGuard } from "./useAuthGuard";
import { Button } from "./ui";
import { Download, Users, Briefcase, Clock, Activity as ActivityIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function Reports() {
  const { employees, shifts, leaves, timeEntries } = useStore();
  const { isAdmin } = useAuthGuard({ allowedRoles: ['admin'] });

  const totalShifts = shifts.length;
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
  const totalEmployees = employees.length;

  const getHoursWorked = (empId: string) => {
    return timeEntries
      .filter(t => t.employee_id === empId && t.punch_out)
      .reduce((total, entry) => {
        const start = new Date(entry.punch_in).getTime();
        const end = new Date(entry.punch_out!).getTime();
        return total + (end - start) / 3600000;
      }, 0);
  };

  const totalActualHours = employees.reduce((total, emp) => total + getHoursWorked(emp.id), 0);

  const departmentData = employees.reduce((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(departmentData).map(([name, value]) => ({ name, value }));

  const shiftData = [
    { name: 'Mon', count: shifts.filter(s => s.date === 'Monday').length },
    { name: 'Tue', count: shifts.filter(s => s.date === 'Tuesday').length },
    { name: 'Wed', count: shifts.filter(s => s.date === 'Wednesday').length },
    { name: 'Thu', count: shifts.filter(s => s.date === 'Thursday').length },
    { name: 'Fri', count: shifts.filter(s => s.date === 'Friday').length },
    { name: 'Sat', count: shifts.filter(s => s.date === 'Saturday').length },
    { name: 'Sun', count: shifts.filter(s => s.date === 'Sunday').length },
  ];

  const handleExportPDF = () => {
    window.print();
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">Admin access required to view reports.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">View company statistics and operational overviews.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours Tracked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActualHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">Based on clock-ins</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalShifts}</div>
            <p className="text-xs text-muted-foreground">Scheduled shifts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Across {Object.keys(departmentData).length} departments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leaves (Approved)</CardTitle>
            <ActivityIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedLeaves}</div>
            <p className="text-xs text-muted-foreground">Approved leave requests</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Shift Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={shiftData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#4f46e5" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Employees by Department</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
