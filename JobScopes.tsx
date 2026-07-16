import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui";
import { Search, Plus, Edit, Trash, BookOpen, User } from "lucide-react";
import { useStore, JobScope } from "./store";
import { Button } from "./ui";
import { Input } from "./ui";
import { Textarea } from "./ui";
import { Label } from "./ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui";

export default function JobScopes() {
  const { jobScopes, currentUser, saveJobScope, updateJobScope, deleteJobScope, employees } = useStore();
  const isAdmin = currentUser?.role === 'admin';
  
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterRole, setFilterRole] = useState("All");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Omit<JobScope, 'id' | 'created_at'>>({
    title: "",
    department: "All",
    role: "All",
    description: ""
  });

  // Extract unique departments and roles from employees for the dropdowns
  const uniqueDepartments = ["All", ...Array.from(new Set(employees.map(e => e.department))).filter(Boolean)];
  const uniqueRoles = ["All", ...Array.from(new Set(employees.map(e => e.role))).filter(Boolean)];
  
  const formRoles = formData.department === 'All' 
    ? employees.map(e => e.role)
    : employees.filter(e => e.department === formData.department).map(e => e.role);
  const uniqueFormRoles = Array.from(new Set(formRoles)).filter(Boolean);

  // For staff, we might want to default their filters to their own department/role
  // but let them see others if they want.

  const filteredScopes = jobScopes.filter(js => {
    const matchesSearch = js.title.toLowerCase().includes(searchTerm.toLowerCase()) || js.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === "All" || js.department === filterDept || js.department === "All";
    const matchesRole = filterRole === "All" || js.role === filterRole || js.role === "All";
    
    // If not admin, they can optionally only be shown their relevant scopes by default, 
    // but the dropdown allows them to see others.
    
    return matchesSearch && matchesDept && matchesRole;
  });

  const handleOpenDialog = (scope?: JobScope) => {
    if (scope) {
      setEditingId(scope.id);
      setFormData({
        title: scope.title,
        department: scope.department,
        role: scope.role,
        description: scope.description
      });
    } else {
      setEditingId(null);
      setFormData({
        title: "",
        department: "All",
        role: "All",
        description: ""
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.description) return;
    
    if (editingId) {
      await updateJobScope(editingId, formData);
    } else {
      await saveJobScope(formData);
    }
    setIsDialogOpen(false);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Standard Operating Procedures</h1>
          <p className="text-muted-foreground mt-1">Job scopes, responsibilities, and guidelines for each department and role.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search guidelines..." 
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && (<select 
            value={filterDept} 
            onChange={e => setFilterDept(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {uniqueDepartments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
          </select>)}
          {isAdmin && (<select 
            value={filterRole} 
            onChange={e => setFilterRole(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {uniqueRoles.map(r => <option key={r} value={r}>{r === 'All' ? 'All Roles' : r}</option>)}
          </select>)}
          
          {isAdmin && (
            <Button onClick={() => handleOpenDialog()} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> New SOP
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredScopes.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border border-dashed">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No operating procedures found matching your criteria.</p>
          </div>
        ) : (
          filteredScopes.map((scope) => (
            <Card key={scope.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
              <CardHeader className="pb-4 bg-muted/30">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg leading-tight">{scope.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md font-medium">
                        Dept: {scope.department}
                      </span>
                      <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md font-medium">
                        Role: {scope.role}
                      </span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleOpenDialog(scope)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => deleteJobScope(scope.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <div className="text-sm whitespace-pre-wrap text-foreground/90">
                  {scope.description}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit SOP' : 'Create New SOP'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g. Daily Store Opening Procedure"
                autoComplete="off"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Target Department</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.department} 
                  onChange={(e) => setFormData({...formData, department: e.target.value})} 
                >
                  <option value="All">All Departments</option>
                  {uniqueDepartments.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Target Role</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})} 
                >
                  <option value="All">All Roles</option>
                  {uniqueFormRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Detailed Procedure / Job Scope</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Provide detailed instructions, checklists, or scope of responsibilities..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.title || !formData.description}>
              {editingId ? 'Save Changes' : 'Create SOP'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
