import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { Users, UserCheck, UserX, Clock, CalendarCheck, Play, Square, Megaphone, Plus, Trash2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useStore } from "./store";
import { useAuthGuard } from "./useAuthGuard";
import { Button } from "./ui";
import { Input } from "./ui";
import { Textarea } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui";
import { Label } from "./ui";

export default function Dashboard() {
  const { employees, shifts, activities, leaves, announcements, timeEntries, addActivity, clockIn, clockOut, addAnnouncement, deleteAnnouncement } = useStore();
  const { currentUser, isAdmin } = useAuthGuard();
  
  const currentEmployee = employees.find(e => e.user_id === currentUser?.id || e.name === currentUser?.name);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openAnnouncement, setOpenAnnouncement] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentOpenTimeEntry = currentEmployee ? timeEntries.find(t => t.employee_id === currentEmployee.id && !t.punch_out) : null;
  const isPunchedIn = !!currentOpenTimeEntry;

  const handlePunch = async () => {
    if (!currentEmployee) return;
    try {
      if (isPunchedIn) {
        await clockOut(currentEmployee.id);
      } else {
        await clockIn(currentEmployee.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setAnnouncementError(null);
    try {
      await addAnnouncement({
        author_id: currentEmployee?.id || null,
        title: announcementForm.title,
        content: announcementForm.content
      });
      setOpenAnnouncement(false);
      setAnnouncementForm({ title: "", content: "" });
    } catch (e: any) {
      console.error(e);
      setAnnouncementError(e.message || "Failed to post announcement. Did you run the latest SQL update?");
    }
  };

  // Admin stats
  const totalHours = shifts.length * 8; 
  const onDutyCount = shifts.filter(s => s.type === 'morning').length;

  // Staff stats
  const myShifts = shifts.filter(s => s.employee_id === currentEmployee?.id);
  const myTotalHours = myShifts.length * 8;
  const myPendingLeaves = leaves.filter(l => l.employee_id === currentEmployee?.id && l.status === 'Pending').length;
  const myApprovedLeaves = leaves.filter(l => l.employee_id === currentEmployee?.id && l.status === 'Approved').length;

  // Dynamic Chart Data
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const data = days.map(day => ({
    name: day.substring(0, 3),
    hours: isAdmin 
      ? shifts.filter(s => s.date === day).length * 8
      : myShifts.filter(s => s.date === day).length * 8
  }));

  const formatTimeEntryDuration = (entry: any) => {
    const start = new Date(entry.punch_in).getTime();
    const end = entry.punch_out ? new Date(entry.punch_out).getTime() : currentTime.getTime();
    const diff = end - start;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isAdmin ? 'Overview' : `Welcome back, ${currentUser?.name.split(' ')[0]}`}
          </h1>
          <p className="text-muted-foreground mt-1">Here's what's happening today.</p>
        </div>

        {/* TIME CLOCK WIDGET */}
        {!isAdmin && (
          <div className="flex items-center gap-4 bg-card p-3 rounded-2xl border border-border shadow-sm">
            <div className="text-right">
              <div className="text-xl font-bold text-foreground tracking-tight leading-none mb-1">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              {isPunchedIn && currentOpenTimeEntry ? (
                <div className="text-xs font-mono text-emerald-600 font-medium">
                  {formatTimeEntryDuration(currentOpenTimeEntry)}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground font-medium">Not Clocked In</div>
              )}
            </div>
            <Button 
              size="lg"
              variant={isPunchedIn ? "destructive" : "default"}
              onClick={handlePunch}
              disabled={!currentEmployee}
              className={`w-32 rounded-xl shadow-sm ${!isPunchedIn ? 'bg-primary hover:bg-indigo-700' : ''}`}
            >
              {isPunchedIn ? (
                <><Square className="mr-2 h-4 w-4" fill="currentColor" /> Clock Out</>
              ) : (
                <><Play className="mr-2 h-4 w-4" fill="currentColor" /> Clock In</>
              )}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{isAdmin ? "Total Employees" : "My Weekly Shifts"}</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{isAdmin ? employees.length : myShifts.length}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              {isAdmin ? "+2 from last month" : "On track"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{isAdmin ? "On Duty Now" : "Pending Leaves"}</CardTitle>
            <UserCheck className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{isAdmin ? onDutyCount : myPendingLeaves}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAdmin ? "12 active shifts" : "Awaiting approval"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{isAdmin ? "On Leave" : "Approved Leaves"}</CardTitle>
            <UserX className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{isAdmin ? leaves.filter(l => l.status === 'Approved').length : myApprovedLeaves}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently away
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">{isAdmin ? "Total Hours" : "My Hours (Est)"}</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{isAdmin ? totalHours : myTotalHours}h</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">
              Scheduled this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Scheduled Hours Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                <Megaphone className="h-5 w-5 text-indigo-500" />
                Announcements
              </CardTitle>
              {isAdmin && (
                <Dialog open={openAnnouncement} onOpenChange={setOpenAnnouncement}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8">
                      <Plus className="h-4 w-4 mr-1" /> New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New Announcement</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddAnnouncement} className="space-y-4 mt-4">
                      {announcementError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                          {announcementError}
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Content</Label>
                        <Textarea value={announcementForm.content} onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})} required rows={4} />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpenAnnouncement(false)}>Cancel</Button>
                        <Button type="submit">Post Announcement</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {announcements.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-4">No announcements yet.</div>
                ) : (
                  announcements.slice(0, 3).map(ann => {
                    const author = employees.find(e => e.id === ann.author_id);
                    return (
                      <div key={ann.id} className="bg-muted rounded-xl p-4 border border-slate-100 relative group">
                        <div className="font-semibold text-foreground pr-8">{ann.title}</div>
                        <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{ann.content}</div>
                        <div className="text-xs text-muted-foreground mt-3 flex items-center justify-between">
                          <span>{author?.name || 'Admin'}</span>
                          <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                        </div>
                        {isAdmin && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-opacity"
                            onClick={() => deleteAnnouncement(ann.id)}
                            title="Delete announcement"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
