import React, { useState } from "react";
import { Button } from "./ui";
import { Input } from "./ui";
import { Badge } from "./ui";
import { Calendar, Plus, Check, X, Plane, Stethoscope, Paperclip } from "lucide-react";
import { useStore } from "./store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui";
import { Label } from "./ui";
import { useAuthGuard } from "./useAuthGuard";
import { Card, CardContent } from "./ui";

export default function Leaves() {
  const { leaves, employees, addLeave, updateLeaveStatus } = useStore();
  const { currentUser, isAdmin } = useAuthGuard();
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [formData, setFormData] = useState({ employee_id: "", type: "Annual Leave", start_date: "", end_date: "", reason: "", document_url: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const getEmployee = (id: string) => employees.find(e => e.id === id);

  const currentEmployee = employees.find(e => e.user_id === currentUser?.id || e.name === currentUser?.name);

  const filteredLeaves = leaves.filter(leave => {
    if (statusFilter !== "All" && leave.status !== statusFilter) return false;
    if (!isAdmin && leave.employee_id !== currentEmployee?.id) return false;
    return true;
  });

  // Calculate Leave Balances for Staff
  const annualLeaveQuota = currentEmployee?.annual_leave_quota ?? 14;
  const sickLeaveQuota = currentEmployee?.sick_leave_quota ?? 14;
  
  const myAnnualTaken = leaves.filter(l => l.employee_id === currentEmployee?.id && l.type === 'Annual Leave' && l.status === 'Approved').length;
  const mySickTaken = leaves.filter(l => l.employee_id === currentEmployee?.id && l.type === 'Sick Leave' && l.status === 'Approved').length;

  

  

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMsg("File size should not exceed 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, document_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const finalEmployeeId = isAdmin ? formData.employee_id : currentEmployee?.id;
    
    if (!formData.start_date || !formData.end_date) return;
    if (!finalEmployeeId) {
      setErrorMsg("Employee record not found for your account. Please ask an admin to create an employee profile matching your name.");
      return;
    }
    
    try {
      await addLeave({
        employee_id: finalEmployeeId,
        type: formData.type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        reason: formData.reason,
        
        document_url: formData.document_url
      });
      setOpen(false);
      setFormData({ employee_id: "", type: "Annual Leave", start_date: "", end_date: "", reason: "", document_url: "" });
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved': return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 shadow-none border-0">Approved</Badge>;
      case 'Rejected': return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 shadow-none border-0">Rejected</Badge>;
      default: return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 shadow-none border-0">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground">Request time off and track your leave balances.</p>
        </div>
        {!isAdmin && (<Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && <div className="text-sm text-red-500 font-medium">{errorMsg}</div>}
              {isAdmin && (
                <div className="space-y-2">
                  <Label>Employee</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" required value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" required value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Input placeholder="Enter reason" value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
              </div>

              
              
              <div className="space-y-2">
                <Label>Supporting Document (Optional, max 2MB)</Label>
                <Input type="file" accept="image/*,.pdf" onChange={handleFileChange} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>)}
      </div>

      {!isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-primary/5 border-primary/10 shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Plane className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Annual Leave Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">{annualLeaveQuota - myAnnualTaken}</span>
                  <span className="text-sm text-muted-foreground font-medium">/ {annualLeaveQuota} days remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-rose-50 border-rose-100 shadow-none">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <Stethoscope className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-rose-600/70 uppercase tracking-wider">Sick Leave Balance</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-rose-700">{sickLeaveQuota - mySickTaken}</span>
                  <span className="text-sm text-rose-600/70 font-medium">/ {sickLeaveQuota} days remaining</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">{isAdmin ? "All Leave Requests" : "My Leave History"}</h2>
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-border">
          {filteredLeaves.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No leave requests found.
            </div>
          )}
          {filteredLeaves.map((leave) => {
            const emp = getEmployee(leave.employee_id);
            return (
              <div key={leave.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-start gap-4">
                  {isAdmin && (
                    <img src={emp?.avatar || `https://ui-avatars.com/api/?name=Unknown`} alt="" className="h-10 w-10 rounded-full object-cover shrink-0 bg-secondary" />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isAdmin && <span className="font-medium">{emp?.name || 'Unknown Employee'}</span>}
                      {getStatusBadge(leave.status)}
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {leave.type} <span className="text-muted-foreground font-normal mx-2">•</span> {leave.start_date} to {leave.end_date}
                    </div>
                    {leave.reason && (
                      <p className="text-sm text-muted-foreground mt-1">Reason: {leave.reason}</p>
                    )}
                    {leave.document_url && (
                      <div className="mt-2">
                        <a href={leave.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-primary hover:underline bg-primary/10 px-2 py-1 rounded">
                          <Paperclip className="h-3 w-3 mr-1" />
                          View Document
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                {isAdmin && leave.status === 'Pending' && (
                  <div className="flex items-center gap-2 md:self-center self-start mt-2 md:mt-0">
                    <Button variant="outline" size="sm" onClick={() => updateLeaveStatus(leave.id, 'Approved').catch(err => setErrorMsg(err.message))} className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200">
                      <Check className="mr-1 h-4 w-4" /> Approve
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => updateLeaveStatus(leave.id, 'Rejected').catch(err => setErrorMsg(err.message))} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                      <X className="mr-1 h-4 w-4" /> Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
