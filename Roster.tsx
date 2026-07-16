import React, { useState } from "react";
import { Button } from "./ui";
import { Card } from "./ui";
import { Plus, Trash2, Download, Wand2, XOctagon, RefreshCw, Check } from "lucide-react";
import { useStore } from "./store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui";
import { Label } from "./ui";
import { Input } from "./ui";
import { useAuthGuard } from "./useAuthGuard";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Roster() {
  const { employees, shifts, shiftTrades, addShift, deleteShift, requestTrade, updateTradeStatus } = useStore();
  const { currentUser, isAdmin } = useAuthGuard();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ employeeId: "", day: "", type: "morning", startTime: "08:00", endTime: "16:00" });

  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeData, setTradeData] = useState({ shiftId: "", receiverId: "" });

  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [myShiftsOnly, setMyShiftsOnly] = useState(!isAdmin);

  const departments = ["All", ...Array.from(new Set(employees.map(e => e.department)))];

  const currentEmployee = employees.find(e => e.user_id === currentUser?.id || e.name === currentUser?.name);
  const filteredEmployees = employees.filter(emp => 
    (departmentFilter === "All" || emp.department === departmentFilter) &&
    (!myShiftsOnly || emp.id === currentEmployee?.id)
  );

  const getShiftForEmployeeAndDay = (employeeId: string, day: string) => {
    return shifts.find(s => s.employee_id === employeeId && s.date === day);
  };

  const getShiftColor = (type: string) => {
    switch (type) {
      case 'morning': return 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 text-blue-900 shadow-sm font-medium';
      case 'evening': return 'bg-gradient-to-br from-amber-50 to-orange-100 border-orange-200 text-orange-900 shadow-sm font-medium';
      case 'night': return 'bg-gradient-to-br from-slate-800 to-gray-900 border-slate-700 text-slate-100 shadow-sm font-medium';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!formData.employeeId || !formData.day) return;
    const typeLabel = formData.type.charAt(0).toUpperCase() + formData.type.slice(1);
    addShift({
      employee_id: formData.employeeId,
      date: formData.day,
      type: formData.type,
      shift: `${typeLabel} (${formData.startTime} - ${formData.endTime})`
    });
    setOpen(false);
  };

  const handleTradeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || !tradeData.receiverId || !tradeData.shiftId) return;
    await requestTrade({
      shift_id: tradeData.shiftId,
      requester_id: currentEmployee.id,
      receiver_id: tradeData.receiverId
    });
    setTradeOpen(false);
  };

  const handleCellClick = (employeeId: string, day: string) => {
    const existing = getShiftForEmployeeAndDay(employeeId, day);
    if (isAdmin) {
      if (existing) {
        deleteShift(existing.id);
      } else {
        setFormData({ employeeId, day, type: "morning", startTime: "08:00", endTime: "16:00" });
        setOpen(true);
      }
    } else {
      if (existing && existing.employee_id === currentEmployee?.id) {
        // Staff clicking their own shift -> open trade modal
        setTradeData({ shiftId: existing.id, receiverId: "" });
        setTradeOpen(true);
      }
    }
  };

  const exportToExcel = () => {
    const headers = ["Employee", "Role", "Department", ...daysOfWeek];
    const rows = employees.map(emp => {
      const rowData = [ `"${emp.name}"`, `"${emp.role}"`, `"${emp.department}"` ];
      daysOfWeek.forEach(day => {
        const shift = getShiftForEmployeeAndDay(emp.id, day);
        rowData.push(shift ? `"${shift.shift}"` : '""');
      });
      return rowData.join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "roster_schedule.csv");
    document.body.appendChild(link);
    link.click();
  };

  
  


  
  const [autoFillOpen, setAutoFillOpen] = useState(false);
  const [autoFillConfig, setAutoFillConfig] = useState({
    days: "mon-fri", // 'mon-fri', 'all', 'weekends'
    shiftType: "morning", // 'morning', 'afternoon', 'night', 'rotating'
    overwrite: false
  });

  const handleAdvancedAutoFill = async () => {
    if (!isAdmin) return;
    
    let targetDays = [];
    if (autoFillConfig.days === "mon-fri") targetDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    else if (autoFillConfig.days === "weekends") targetDays = ["Saturday", "Sunday"];
    else targetDays = daysOfWeek;

    const shiftTypes = [
      { type: "morning", label: "Morning (08:00 - 16:00)" },
      { type: "afternoon", label: "Afternoon (16:00 - 00:00)" },
      { type: "night", label: "Night (00:00 - 08:00)" }
    ];

    for (const emp of filteredEmployees) {
      let shiftIndex = 0;
      for (let i = 0; i < targetDays.length; i++) {
        const day = targetDays[i];
        const existing = getShiftForEmployeeAndDay(emp.id, day);
        
        if (existing && !autoFillConfig.overwrite) continue;
        if (existing && autoFillConfig.overwrite) {
          await deleteShift(existing.id);
        }

        let assignedType = autoFillConfig.shiftType;
        let assignedLabel = "";

        if (assignedType === "rotating") {
           // simple rotation per day for the employee
           const t = shiftTypes[shiftIndex % shiftTypes.length];
           assignedType = t.type;
           assignedLabel = t.label;
           shiftIndex++;
        } else {
           const t = shiftTypes.find(x => x.type === assignedType) || shiftTypes[0];
           assignedLabel = t.label;
        }

        await addShift({ employee_id: emp.id, date: day, type: assignedType, shift: assignedLabel });
      }
    }
    setAutoFillOpen(false);
  };

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearWeek = async () => {
    if (!isAdmin) return;
    setIsClearing(true);
    try {
      for (const emp of filteredEmployees) {
        for (const day of daysOfWeek) {
          const existing = getShiftForEmployeeAndDay(emp.id, day);
          if (existing) await deleteShift(existing.id);
        }
      }
    } catch (e) {
      console.error("Failed to clear shifts:", e);
    } finally {
      setIsClearing(false);
      setClearConfirmOpen(false);
    }
  };

  const pendingTradesForMe = shiftTrades.filter(t => t.receiver_id === currentEmployee?.id && t.status === 'Pending');

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roster Planner</h1>
          <p className="text-muted-foreground">
            {isAdmin 
              ? "Manage weekly schedules and shifts. Click a cell to add or remove a shift." 
              : "View your weekly schedule. Click your shift to request a trade."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
          {isAdmin && (
            <>
              
              
              <Button variant="outline" size="sm" onClick={() => setAutoFillOpen(true)}>
                <Wand2 className="mr-2 h-4 w-4" />
                Advanced Auto-Fill
              </Button>
              <Button variant="outline" size="sm" onClick={() => setClearConfirmOpen(true)} className="text-red-600 hover:text-red-700">
                <XOctagon className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </>
          )}
        </div>
      </div>

      
      
      {/* Advanced Auto-Fill Dialog */}
      <Dialog open={autoFillOpen} onOpenChange={setAutoFillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Advanced Auto-Fill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Days</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={autoFillConfig.days}
                onChange={e => setAutoFillConfig({...autoFillConfig, days: e.target.value})}
              >
                <option value="mon-fri">Monday - Friday</option>
                <option value="weekends">Weekends Only</option>
                <option value="all">All Days</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Shift Assignment</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={autoFillConfig.shiftType}
                onChange={e => setAutoFillConfig({...autoFillConfig, shiftType: e.target.value})}
              >
                <option value="morning">Morning Only (08:00 - 16:00)</option>
                <option value="afternoon">Afternoon Only (16:00 - 00:00)</option>
                <option value="night">Night Only (00:00 - 08:00)</option>
                <option value="rotating">Rotating Shifts (Morning to Afternoon to Night)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="overwrite" 
                checked={autoFillConfig.overwrite}
                onChange={e => setAutoFillConfig({...autoFillConfig, overwrite: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="overwrite">Overwrite existing shifts</Label>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2">
              This will apply to all employees currently displayed in the view.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAutoFillOpen(false)}>Cancel</Button>
            <Button onClick={handleAdvancedAutoFill}>Run Auto-Fill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Week Confirmation Dialog */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clear All Shifts</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to clear all shifts for the currently displayed employees? This action cannot be undone.
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setClearConfirmOpen(false)} disabled={isClearing}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={handleClearWeek} disabled={isClearing}>
              {isClearing ? 'Clearing...' : 'Yes, clear shifts'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {pendingTradesForMe.length > 0 && !isAdmin && (
        <Card className="p-4 border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-900 mb-2">Pending Trade Requests</h3>
          <div className="space-y-2">
            {pendingTradesForMe.map(trade => {
              const requester = employees.find(e => e.id === trade.requester_id);
              const shift = shifts.find(s => s.id === trade.shift_id);
              return (
                <div key={trade.id} className="flex items-center justify-between bg-card p-3 rounded border border-amber-100 shadow-sm">
                  <div className="text-sm">
                    <span className="font-medium">{requester?.name}</span> wants to give you their <span className="font-medium">{shift?.type}</span> shift on <span className="font-medium">{shift?.date}</span>.
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-red-600 h-8" onClick={() => updateTradeStatus(trade.id, 'Rejected')}><XOctagon className="h-4 w-4 mr-1" /> Reject</Button>
                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700" onClick={() => updateTradeStatus(trade.id, 'Approved')}><Check className="h-4 w-4 mr-1" /> Accept</Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Trade Modal for Staff */}
      <Dialog open={tradeOpen} onOpenChange={setTradeOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Shift Trade</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTradeRequest} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Coworker to take your shift</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={tradeData.receiverId}
                onChange={(e) => setTradeData({...tradeData, receiverId: e.target.value})}
                required
              >
                <option value="">Select Coworker</option>
                {employees.filter(e => e.id !== currentEmployee?.id).map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setTradeOpen(false)}>Cancel</Button>
              <Button type="submit">Send Request</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Admin Add Shift Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Shift</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddShift} className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                required
              >
                <option value="">Select Employee</option>
                {filteredEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Day</Label>
              <Input 
                value={formData.day}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value;
                  let startTime = formData.startTime;
                  let endTime = formData.endTime;
                  if (type === "morning") { startTime = "08:00"; endTime = "16:00"; }
                  if (type === "evening") { startTime = "16:00"; endTime = "00:00"; }
                  if (type === "night") { startTime = "00:00"; endTime = "08:00"; }
                  setFormData({...formData, type, startTime, endTime});
                }}
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input 
                  type="time" 
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input 
                  type="time" 
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="flex-1 overflow-hidden flex flex-col border border-border">
        {/* Toolbar */}
        <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card">
          <div className="flex items-center gap-4">
            <div className="text-sm font-medium">
              Current Week Template
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={myShiftsOnly ? "default" : "outline"} 
              size="sm" 
              className="text-xs h-8"
              onClick={() => setMyShiftsOnly(!myShiftsOnly)}
            >
              My Shifts
            </Button>
            {isAdmin && (
              <select 
                className="flex h-8 w-32 md:w-40 rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                {departments.map(dep => (
                  <option key={dep} value={dep}>{dep === "All" ? "All Departments" : dep}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="min-w-[1000px] w-full">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] border-b border-border sticky top-0 bg-card z-10 rounded-t-2xl">
              <div className="p-3 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-r border-border bg-muted/30">Employee</div>
              {daysOfWeek.map(day => (
                <div key={day} className="p-3 text-xs font-bold text-center border-r border-border last:border-0 bg-muted/30">
                  {day}
                </div>
              ))}
            </div>

            {/* Employee Rows */}
            <div className="divide-y divide-border">
              {filteredEmployees.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  No employees found matching criteria.
                </div>
              )}
              {filteredEmployees.map(employee => (
                <div key={employee.id} className="grid grid-cols-[200px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] hover:bg-accent/30 transition-colors group">
                  <div className="p-3 border-r border-border flex items-center gap-3">
                    <img src={employee.avatar || `https://ui-avatars.com/api/?name=Unknown`} alt={employee.name} className="h-8 w-8 rounded-full bg-secondary object-cover" />
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium truncate">{employee.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{employee.role}</div>
                    </div>
                  </div>
                  
                  {daysOfWeek.map(day => {
                    const shift = getShiftForEmployeeAndDay(employee.id, day);
                    const isMyShift = shift?.employee_id === currentEmployee?.id;
                    const canEdit = isAdmin || isMyShift;
                    
                    const isPendingTrade = shiftTrades.find(t => t.shift_id === shift?.id && t.status === 'Pending');

                    return (
                      <div 
                        key={`${employee.id}-${day}`} 
                        className={`p-2 border-r border-border last:border-0 min-h-[80px] relative group/cell ${canEdit ? 'cursor-pointer hover:bg-accent/50' : ''}`}
                        onClick={() => handleCellClick(employee.id, day)}
                      >
                        {shift ? (
                          <div className={`text-xs p-2 rounded-md border ${getShiftColor(shift.type)} h-full flex flex-col justify-center relative ${isPendingTrade ? 'opacity-60 border-dashed' : ''}`}>
                            <div className="font-semibold">{shift.shift.split(' ')[0]}</div>
                            <div className="opacity-80 text-[10px]">{shift.shift.split(' ').slice(1).join(' ')}</div>
                            
                            {isPendingTrade && (
                              <div className="absolute top-1 right-1">
                                <RefreshCw className="h-3 w-3 text-amber-500 animate-spin" />
                              </div>
                            )}

                            {isAdmin && !isPendingTrade && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100">
                                <Trash2 className="h-3 w-3" />
                              </div>
                            )}
                            {!isAdmin && isMyShift && !isPendingTrade && (
                              <div className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100">
                                <RefreshCw className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        ) : (
                          isAdmin && (
                            <div className="opacity-0 group-hover/cell:opacity-100 absolute inset-0 flex items-center justify-center transition-opacity">
                              <Plus className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
