import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui";
import { useStore } from "./store";
import { useAuthGuard } from "./useAuthGuard";
import { Button } from "./ui";
import { Download, DollarSign, FileSpreadsheet, Edit2, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui";
import { Label } from "./ui";
import { Input } from "./ui";

export default function Payroll() {
  const { employees, timeEntries, updateEmployee, payrollRecords, savePayrollRecord, updatePayrollRecord } = useStore();
  const { isAdmin } = useAuthGuard({ allowedRoles: ['admin'] });

  const [activeTab, setActiveTab] = useState<'run' | 'settings'>('run');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [editSettingOpen, setEditSettingOpen] = useState(false);
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [editType, setEditType] = useState<'hourly' | 'monthly'>('hourly');
  const [editRate, setEditRate] = useState<number | string>('');
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [payrollEditOpen, setPayrollEditOpen] = useState(false);
  const [payrollEditData, setPayrollEditData] = useState<any>(null);

  const handleEditSettingClick = (emp: any) => {
    setSaveError(null);
    setEditEmpId(emp.id);
    setEditType(emp.salary_type || 'hourly');
    let rate = emp.salary_type === 'monthly' ? emp.monthly_salary : emp.hourly_rate;
    if (rate === 0 || rate === '0' || !rate) {
        rate = '';
    }
    setEditRate(rate);
    setEditSettingOpen(true);
  };

  const handleSaveSetting = async () => {
    if (!editEmpId) return;
    setLoading(true);
    setSaveError(null);
    try {
      await updateEmployee(editEmpId, { 
        salary_type: editType,
        ...(editType === 'hourly' ? { hourly_rate: Number(editRate) || 0 } : { monthly_salary: Number(editRate) || 0 })
      });
      setEditSettingOpen(false);
    } catch (e: any) {
      console.error(e);
      setSaveError(e.message || "Failed to save settings. Please ensure database columns exist.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Role', 'Salary Type', 'Hours Worked', 'Base Pay ($)', 'Bonus ($)', 'Deductions ($)', 'Net Pay ($)', 'Status'];
    const csvRows = payrollData.map(item => [
      item.name,
      item.role,
      item.salary_type || 'hourly',
      item.salary_type === 'monthly' ? 'N/A' : item.hours.toFixed(2),
      item.basePay.toFixed(2),
      item.bonus.toFixed(2),
      item.deductions.toFixed(2),
      item.netPay.toFixed(2),
      item.status
    ]);
    
    const csvContent = [headers.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll-${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getHoursWorkedInMonth = (empId: string, monthStr: string) => {
    return timeEntries
      .filter(t => t.employee_id === empId && t.punch_out && t.punch_in.startsWith(monthStr))
      .reduce((total, t) => {
        const start = new Date(t.punch_in).getTime();
        const end = new Date(t.punch_out!).getTime();
        return total + (end - start) / (1000 * 60 * 60);
      }, 0);
  };

  const payrollData = useMemo(() => {
    return employees.map(emp => {
      const existingRecord = payrollRecords.find(p => p.employee_id === emp.id && p.period === selectedMonth);
      let hours = existingRecord ? existingRecord.total_hours : getHoursWorkedInMonth(emp.id, selectedMonth);
      hours = Number(hours.toFixed(2));
      
      let basePay = 0;
      if (existingRecord) {
        basePay = existingRecord.base_pay;
      } else {
        if (emp.salary_type === 'monthly') {
          basePay = emp.monthly_salary || 0;
        } else {
          basePay = Number((hours * (emp.hourly_rate || 25)).toFixed(2));
        }
      }

      const bonus = existingRecord?.bonus || 0;
      const deductions = existingRecord?.deductions || 0;
      const netPay = existingRecord?.net_pay || (basePay + bonus - deductions);
      const status = existingRecord?.status || 'Pending';
      const recordId = existingRecord?.id;

      return {
        ...emp,
        recordId,
        hours,
        basePay,
        bonus,
        deductions,
        netPay,
        status,
        isGenerated: !!existingRecord
      };
    });
  }, [employees, payrollRecords, selectedMonth, timeEntries]);

  const totalPayroll = payrollData.reduce((sum, item) => sum + item.netPay, 0);
  const totalPending = payrollData.filter(i => i.status === 'Pending').reduce((sum, item) => sum + item.netPay, 0);
  const totalPaid = payrollData.filter(i => i.status === 'Paid').reduce((sum, item) => sum + item.netPay, 0);

  const handleEditPayroll = (data: any) => {
    setPayrollEditData({ ...data });
    setPayrollEditOpen(true);
  };

  const handleSavePayrollData = async () => {
    if (!payrollEditData) return;
    setLoading(true);
    try {
      const basePay = Number(payrollEditData.basePay) || 0;
      const bonus = Number(payrollEditData.bonus) || 0;
      const deductions = Number(payrollEditData.deductions) || 0;
      const netPay = basePay + bonus - deductions;
      
      await savePayrollRecord({
        employee_id: payrollEditData.id,
        period: selectedMonth,
        total_hours: payrollEditData.hours,
        base_pay: basePay,
        bonus: bonus,
        deductions: deductions,
        net_pay: netPay,
        status: payrollEditData.status
      });
      setPayrollEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (recordId: string) => {
    try {
      await updatePayrollRecord(recordId, { status: 'Paid' });
    } catch(e) {
      console.error(e);
    }
  };

  if (!isAdmin) {
    return <div className="p-8 text-center text-muted-foreground">Admin access required to view payroll.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:m-0 print:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-muted-foreground">Manage advanced employee salaries and process payroll.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border print:hidden">
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'run' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('run')}
        >
          Payroll Processing
        </button>
        <button 
          className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'settings' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('settings')}
        >
          Salary Settings
        </button>
      </div>

      {activeTab === 'run' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Label className="whitespace-nowrap">Payroll Period</Label>
              <Input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-48" />
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Net Payroll</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalPayroll.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">For {selectedMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">${totalPending.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Requires processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processed (Paid)</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">${totalPaid.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Successfully paid out</p>
              </CardContent>
            </Card>
          </div>

          <Card className="print:block">
            <CardHeader>
              <CardTitle>Payroll List - {selectedMonth}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted border-b whitespace-nowrap">
                      <tr>
                        <th className="px-4 py-3 font-medium">Employee</th>
                        <th className="px-4 py-3 font-medium text-right">Hours</th>
                        <th className="px-4 py-3 font-medium text-right">Base Pay</th>
                        <th className="px-4 py-3 font-medium text-right">Bonus</th>
                        <th className="px-4 py-3 font-medium text-right">Deductions</th>
                        <th className="px-4 py-3 font-medium text-right">Net Pay</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {payrollData.map(item => (
                        <tr key={item.id} className="hover:bg-muted">
                          <td className="px-4 py-3 font-medium whitespace-nowrap">{item.name}</td>
                          <td className="px-4 py-3 text-right font-mono">{item.salary_type === "monthly" ? "-" : `${item.hours.toFixed(2)}h`}</td>
                          <td className="px-4 py-3 text-right font-mono">${item.basePay.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-600">+${item.bonus.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono text-red-500">-${item.deductions.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-bold text-primary">${item.netPay.toFixed(2)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${item.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right print:hidden whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => handleEditPayroll(item)} className="mr-2 h-8 w-8 p-0" title="Adjust Payroll">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {item.isGenerated && item.status !== 'Paid' && (
                              <Button variant="outline" size="sm" onClick={() => handleMarkPaid(item.recordId)} className="h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                                Mark Paid
                              </Button>
                            )}
                            {!item.isGenerated && (
                              <Button variant="outline" size="sm" onClick={() => handleEditPayroll(item)} className="h-8">
                                Process
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Salary Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Employee</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {employees.map(emp => (
                      <tr key={emp.id} className="hover:bg-muted">
                        <td className="px-4 py-3 font-medium">{emp.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{emp.role}</td>
                        <td className="px-4 py-3 capitalize">{emp.salary_type || 'Hourly'}</td>
                        <td className="px-4 py-3 text-right font-mono">
                          ${((emp.salary_type === 'monthly' ? emp.monthly_salary : emp.hourly_rate) || 25).toFixed(2)}
                          {emp.salary_type === 'monthly' ? '/mo' : '/hr'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEditSettingClick(emp)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit Setting
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salary Setting Dialog */}
      <Dialog open={editSettingOpen} onOpenChange={setEditSettingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Salary Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {saveError && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{saveError}</div>}
            <div className="space-y-2">
              <Label>Salary Type</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={editType}
                onChange={(e) => setEditType(e.target.value as any)}
              >
                <option value="hourly">Hourly Rate</option>
                <option value="monthly">Monthly Salary</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{editType === 'hourly' ? 'Hourly Rate ($/hr)' : 'Monthly Salary ($/mo)'}</Label>
              <Input 
                type="number" 
                min="0" 
                step="0.5" 
                value={editRate} 
                onChange={(e) => setEditRate(e.target.value)} 
                required 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSettingOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSaveSetting} disabled={loading}>{loading ? 'Saving...' : 'Save Settings'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll Edit/Process Dialog */}
      <Dialog open={payrollEditOpen} onOpenChange={setPayrollEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payroll - {payrollEditData?.name}</DialogTitle>
          </DialogHeader>
          {payrollEditData && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total Hours Worked</Label>
                  {payrollEditData.salary_type === 'monthly' ? (
                    <Input value="N/A" disabled className="bg-muted font-mono" />
                  ) : (
                    <Input type="number" value={payrollEditData.hours === 0 ? '' : payrollEditData.hours} disabled className="bg-muted font-mono" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Calculated Base Pay ($)</Label>
                  <Input 
                    type="number" 
                    value={payrollEditData.basePay === 0 ? '' : payrollEditData.basePay} 
                    onChange={(e) => setPayrollEditData({...payrollEditData, basePay: e.target.value === '' ? '' : parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bonuses / Allowances ($)</Label>
                  <Input 
                    type="number" 
                    value={payrollEditData.bonus === 0 ? '' : payrollEditData.bonus} 
                    onChange={(e) => setPayrollEditData({...payrollEditData, bonus: e.target.value === '' ? '' : parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Deductions ($)</Label>
                  <Input 
                    type="number" 
                    value={payrollEditData.deductions === 0 ? '' : payrollEditData.deductions} 
                    onChange={(e) => setPayrollEditData({...payrollEditData, deductions: e.target.value === '' ? '' : parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>
              <div className="pt-4 border-t flex justify-between items-center">
                <span className="font-bold">Net Pay:</span>
                <span className="text-xl font-bold text-primary font-mono">
                  ${((Number(payrollEditData.basePay) || 0) + (Number(payrollEditData.bonus) || 0) - (Number(payrollEditData.deductions) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayrollEditOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleSavePayrollData} disabled={loading}>{loading ? 'Saving...' : 'Save Payroll Record'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
