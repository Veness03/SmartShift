import React, { useState } from "react";
import { Button } from "./ui";
import { Input } from "./ui";
import { Badge } from "./ui";
import { Search, Plus, Filter, MoreHorizontal, Trash, Edit } from "lucide-react";
import { useStore } from "./store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui";
import { Label } from "./ui";

import { useAuthGuard } from "./useAuthGuard";

export default function Employees() {
  const [search, setSearch] = useState("");
  const { employees, registerEmployee, deleteEmployee, updateEmployee } = useStore();
  const { currentUser, isAdmin } = useAuthGuard({ allowedRoles: ['admin'] });
  const [departmentFilter, setDepartmentFilter] = useState("All");
  
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", role: "", department: "", status: "Active", salary_type: "hourly" as "hourly" | "monthly", hourly_rate: "" as number | "", monthly_salary: "" as number | "", annual_leave_quota: 14, sick_leave_quota: 14 });
  const [editData, setEditData] = useState({ salary_type: "hourly" as "hourly" | "monthly", hourly_rate: "" as number | "", monthly_salary: "" as number | "", role: "", department: "", annual_leave_quota: 14, sick_leave_quota: 14 });
  
  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department)))];

  const filteredEmployees = employees.filter(emp => 
    (departmentFilter === "All" || emp.department === departmentFilter) &&
    (emp.name.toLowerCase().includes(search.toLowerCase()) || 
     emp.department.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await registerEmployee(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        department: formData.department,
        status: formData.status,
        salary_type: formData.salary_type,
        hourly_rate: Number(formData.hourly_rate) || 0,
        monthly_salary: Number(formData.monthly_salary) || 0,
        annual_leave_quota: formData.annual_leave_quota,
        sick_leave_quota: formData.sick_leave_quota,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`
      });
      setOpen(false);
      setFormData({ name: "", email: "", password: "", role: "", department: "", status: "Active", salary_type: "hourly", hourly_rate: "", monthly_salary: "", annual_leave_quota: 14, sick_leave_quota: 14 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (employee: any) => {
    setEditEmployeeId(employee.id);
    setEditData({ salary_type: employee.salary_type ?? "hourly", hourly_rate: employee.hourly_rate || "", monthly_salary: employee.monthly_salary || "", role: employee.role, department: employee.department, annual_leave_quota: employee.annual_leave_quota ?? 14, sick_leave_quota: employee.sick_leave_quota ?? 14 });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmployeeId) return;
    setLoading(true);
    try {
      await updateEmployee(editEmployeeId, { ...editData, hourly_rate: Number(editData.hourly_rate) || 0, monthly_salary: Number(editData.monthly_salary) || 0 });
      setEditOpen(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage your team members and their roles.</p>
        </div>
        
        {isAdmin && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="employee@example.com" autoComplete="off" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input id="password" type="password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Min 6 characters" autoComplete="new-password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Job Title</Label>
                <Input id="role" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Manager" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input id="department" required value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Sales" />
              </div>
              <div className="space-y-2">
                <Label>Salary Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.salary_type}
                  onChange={(e) => setFormData({...formData, salary_type: e.target.value as "hourly" | "monthly"})}
                >
                  <option value="hourly">Hourly Rate</option>
                  <option value="monthly">Monthly Salary</option>
                </select>
              </div>
              {formData.salary_type === 'hourly' ? (
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input id="hourly_rate" type="number" required value={formData.hourly_rate} onChange={e => setFormData({...formData, hourly_rate: e.target.value ? parseFloat(e.target.value) : ""})} min="0" step="0.5" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="monthly_salary">Monthly Salary ($)</Label>
                  <Input id="monthly_salary" type="number" required value={formData.monthly_salary} onChange={e => setFormData({...formData, monthly_salary: e.target.value ? parseFloat(e.target.value) : ""})} min="0" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Leave Quota</Label>
                  <Input type="number" required value={formData.annual_leave_quota} onChange={e => setFormData({...formData, annual_leave_quota: parseInt(e.target.value) || 0})} min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Sick Leave Quota</Label>
                  <Input type="number" required value={formData.sick_leave_quota} onChange={e => setFormData({...formData, sick_leave_quota: parseInt(e.target.value) || 0})} min="0" />
                </div>
              </div>
              {error && (
                <div className="text-sm font-medium text-destructive">{error}</div>
              )}
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {isAdmin && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Employee Settings</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input required value={editData.role} onChange={e => setEditData({...editData, role: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input required value={editData.department} onChange={e => setEditData({...editData, department: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Salary Type</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={editData.salary_type}
                  onChange={(e) => setEditData({...editData, salary_type: e.target.value as "hourly" | "monthly"})}
                >
                  <option value="hourly">Hourly Rate</option>
                  <option value="monthly">Monthly Salary</option>
                </select>
              </div>
              {editData.salary_type === 'hourly' ? (
                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input type="number" required value={editData.hourly_rate} onChange={e => setEditData({...editData, hourly_rate: e.target.value ? parseFloat(e.target.value) : ""})} min="0" step="0.5" />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Monthly Salary ($)</Label>
                  <Input type="number" required value={editData.monthly_salary} onChange={e => setEditData({...editData, monthly_salary: e.target.value ? parseFloat(e.target.value) : ""})} min="0" />
                </div>
              )}
                            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Annual Leave Quota</Label>
                  <Input type="number" required value={editData.annual_leave_quota} onChange={e => setEditData({...editData, annual_leave_quota: parseInt(e.target.value) || 0})} min="0" />
                </div>
                <div className="space-y-2">
                  <Label>Sick Leave Quota</Label>
                  <Input type="number" required value={editData.sick_leave_quota} onChange={e => setEditData({...editData, sick_leave_quota: parseInt(e.target.value) || 0})} min="0" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search employees..." 
            className="pl-9" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select 
            className="flex h-10 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            {departments.map(dep => (
              <option key={dep} value={dep}>{dep === "All" ? "All Departments" : dep}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-bold text-muted-foreground bg-muted/30 uppercase tracking-widest border-b border-border">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                {isAdmin && <th className="px-6 py-4">Rate / Salary</th>}
                {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={employee.avatar} alt={employee.name} className="h-10 w-10 rounded-full object-cover border border-border" />
                      <div>
                        <div className="font-medium text-foreground">{employee.name}</div>
                        <div className="text-xs text-muted-foreground">ID: EMP-{employee.id.substring(0, 8).toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-foreground">{employee.role}</td>
                  <td className="px-6 py-4 text-muted-foreground">{employee.department}</td>
                  <td className="px-6 py-4">
                    <Badge variant={employee.status === 'Active' ? 'default' : 'secondary'} className={employee.status === 'Active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}>
                      {employee.status}
                    </Badge>
                  </td>
                  {isAdmin && <td className="px-6 py-4 font-mono text-emerald-600">{employee.salary_type === "monthly" ? `$$${employee.monthly_salary || 0}/month` : `$$${employee.hourly_rate || 0}/hr`}</td>}
                  {isAdmin && (
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(employee)}>
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteEmployee(employee.id)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployees.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              {employees.length === 0 ? "No employees added yet." : "No employees found matching your search."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
