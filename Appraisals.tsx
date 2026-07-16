import React, { useState } from 'react';
import { useStore, Appraisal, Task } from './store';
import { Button, Input, Label, Textarea, Card, CardContent, CardHeader, CardTitle, Badge } from './ui';
import { Search, Plus, Edit, Trash, Star, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui';

export default function Appraisals() {
  const { appraisals, employees, currentUser, saveAppraisal, updateAppraisal, deleteAppraisal } = useStore();
  const isAdmin = currentUser?.role === 'admin';
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDeptFilter, setFormDeptFilter] = useState("All");
  
  const [activeTab, setActiveTab] = useState<'appraisals' | 'tasks'>('appraisals');
  
  // Task States
  const { tasks, saveTask, updateTask, deleteTask } = useStore();
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskFormData, setTaskFormData] = useState<Partial<Task>>({
    title: '', description: '', assignee_id: '', status: 'To Do', due_date: ''
  });
  
  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    const emp = employees.find(e => e.id === t.assignee_id);
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (isAdmin) {
      return matchesSearch;
    }
    const currentEmp = employees.find(e => e.user_id === currentUser?.id);
    return matchesSearch && t.assignee_id === currentEmp?.id;
  });
  
  const handleOpenTaskDialog = (task?: Task) => {
    if (task) {
      setEditingTaskId(task.id);
      setTaskFormData(task);
      const emp = employees.find(e => e.id === task.assignee_id);
      if (emp) setFormDeptFilter(emp.department);
    } else {
      setEditingTaskId(null);
      setTaskFormData({ title: '', description: '', assignee_id: '', status: 'To Do', due_date: '' });
      setFormDeptFilter("All");
    }
    setIsTaskDialogOpen(true);
  };
  
  const handleSaveTask = () => {
    if (!taskFormData.title || !taskFormData.assignee_id) return;
    if (editingTaskId) {
      updateTask(editingTaskId, taskFormData);
    } else {
      saveTask({
        ...taskFormData as Omit<Task, 'id'|'created_at'>,
        assigner_id: currentUser!.id,
        status: taskFormData.status || 'To Do'
      });
    }
    setIsTaskDialogOpen(false);
  };



  // Filter appraisals based on role and search term
  const filteredAppraisals = appraisals.filter((a) => {
    const emp = employees.find(e => e.id === a.employee_id);
    const matchesSearch = emp?.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.period.toLowerCase().includes(searchTerm.toLowerCase());
    if (isAdmin) {
      return matchesSearch;
    }
    const currentEmp = employees.find(e => e.user_id === currentUser?.id);
    return matchesSearch && a.employee_id === currentEmp?.id;
  });

  const [formData, setFormData] = useState<Partial<Appraisal>>({
    employee_id: '',
    period: '',
    rating: 3,
    comments: '',
    status: 'Finalized'
  });

  const uniqueDepartments = ["All", ...Array.from(new Set(employees.map(e => e.department))).filter(Boolean)];
  const formEmployees = formDeptFilter === "All" 
    ? employees 
    : employees.filter(e => e.department === formDeptFilter);

  const handleOpenDialog = (appraisal?: Appraisal) => {
    if (appraisal) {
      setEditingId(appraisal.id);
      setFormData(appraisal);
      const emp = employees.find(e => e.id === appraisal.employee_id);
      if (emp) setFormDeptFilter(emp.department);
    } else {
      setEditingId(null);
      setFormData({
        employee_id: '',
        period: '',
        rating: 3,
        comments: '',
        status: 'Finalized'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.employee_id || !formData.period) return;
    
    if (editingId) {
      updateAppraisal(editingId, formData);
    } else {
      saveAppraisal({
        ...formData as Omit<Appraisal, 'id'|'created_at'>,
        reviewer_id: currentUser!.id
      });
    }
    setIsDialogOpen(false);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance & Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage employee performance reviews, feedback, and track tasks.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or period..." 
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin && activeTab === 'appraisals' && (
            <Button onClick={() => handleOpenDialog()} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> New Appraisal
            </Button>
          )}
          {isAdmin && activeTab === 'tasks' && (
            <Button onClick={() => handleOpenTaskDialog()} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> New Task
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex border-b border-border">
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'appraisals' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('appraisals')}
        >
          Appraisals
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'tasks' ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('tasks')}
        >
          Task Tracking
        </button>
      </div>

      {activeTab === 'appraisals' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAppraisals.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border border-dashed">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No appraisals found matching your criteria.</p>
          </div>
        ) : (
          filteredAppraisals.map((appraisal) => {
            const emp = employees.find(e => e.id === appraisal.employee_id);
            const reviewer = employees.find(e => e.user_id === appraisal.reviewer_id) || { name: 'Admin' };
            return (
              <Card key={appraisal.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-4 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{emp?.name || 'Unknown Employee'}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1 font-medium">{appraisal.period}</div>
                    </div>
                    <Badge variant={appraisal.status === 'Finalized' ? 'default' : 'secondary'} className={appraisal.status === 'Finalized' ? 'bg-green-100 text-green-800' : ''}>
                      {appraisal.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Rating</div>
                    <div className="flex gap-1">{renderStars(appraisal.rating)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Reviewer</div>
                    <div className="text-sm">{reviewer.name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Comments</div>
                    <p className="text-sm text-foreground line-clamp-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                      {appraisal.comments || <span className="text-muted-foreground italic">No comments provided.</span>}
                    </p>
                  </div>
                  
                  {isAdmin && (
                    <div className="pt-4 mt-4 border-t border-border flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenDialog(appraisal)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteAppraisal(appraisal.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      )}
      
      {activeTab === 'tasks' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border border-dashed">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No tasks found matching your criteria.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const emp = employees.find(e => e.id === task.assignee_id);
            const assigner = employees.find(e => e.user_id === task.assigner_id) || { name: 'Admin' };
            const statusColors = {
              'To Do': 'bg-slate-100 text-slate-800',
              'In Progress': 'bg-blue-100 text-blue-800',
              'Done': 'bg-emerald-100 text-emerald-800'
            };
            return (
              <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-4 bg-muted/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <div className="text-sm text-muted-foreground mt-1 font-medium">{emp?.name || 'Unknown'}</div>
                    </div>
                    <Badge variant="secondary" className={statusColors[task.status as keyof typeof statusColors] || ''}>
                      {task.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Description</div>
                    <p className="text-sm text-foreground line-clamp-3">{task.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Due Date</div>
                      <div>{task.due_date || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Assigned By</div>
                      <div>{assigner.name}</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 mt-4 border-t border-border flex justify-end gap-2">
                    {isAdmin && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleOpenTaskDialog(task)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => deleteTask(task.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {!isAdmin && (
                      <select 
                        value={task.status}
                        onChange={(e) => updateTask(task.id, { status: e.target.value as any })}
                        className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Appraisal' : 'Create New Appraisal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <select 
                value={formDeptFilter} 
                onChange={(e) => {
                  setFormDeptFilter(e.target.value);
                  setFormData({...formData, employee_id: ''}); // reset employee when dept changes
                }}
                disabled={!!editingId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uniqueDepartments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Employee</Label>
              <select 
                value={formData.employee_id} 
                onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                disabled={!!editingId}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select employee</option>
                {formEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Review Period (e.g., Q1 2026, Annual 2025)</Label>
              <Input 
                value={formData.period} 
                onChange={(e) => setFormData({...formData, period: e.target.value})} 
                placeholder="Q1 2026"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Rating ({formData.rating}/5)</Label>
              <input 
                type="range" 
                min="1" 
                max="5" 
                step="1"
                value={formData.rating}
                onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Needs Improvement</span>
                <span>Exceeds Expectations</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Review Comments</Label>
              <Textarea 
                value={formData.comments} 
                onChange={(e) => setFormData({...formData, comments: e.target.value})} 
                placeholder="Enter detailed feedback..."
                className="h-32"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <select 
                value={formData.status} 
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Draft">Draft</option>
                <option value="Finalized">Finalized</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Note: Only 'Finalized' appraisals are visible to the employee.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formData.employee_id || !formData.period}>
              {editingId ? 'Save Changes' : 'Create Appraisal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingTaskId ? 'Edit Task' : 'Assign New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Task Title</Label>
              <Input 
                value={taskFormData.title} 
                onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})} 
                placeholder="e.g., Q3 Report Update"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <select 
                value={formDeptFilter} 
                onChange={(e) => {
                  setFormDeptFilter(e.target.value);
                  setTaskFormData({...taskFormData, assignee_id: ''});
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {uniqueDepartments.map(d => <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <select 
                value={taskFormData.assignee_id} 
                onChange={(e) => setTaskFormData({...taskFormData, assignee_id: e.target.value})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>Select employee</option>
                {formEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input 
                type="date"
                value={taskFormData.due_date} 
                onChange={(e) => setTaskFormData({...taskFormData, due_date: e.target.value})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={taskFormData.description} 
                onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})} 
                placeholder="Detailed instructions..."
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select 
                value={taskFormData.status} 
                onChange={(e) => setTaskFormData({...taskFormData, status: e.target.value as any})}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTask} disabled={!taskFormData.title || !taskFormData.assignee_id}>
              {editingTaskId ? 'Save Changes' : 'Assign Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
