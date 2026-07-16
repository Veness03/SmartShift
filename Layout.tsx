import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Calendar, LayoutDashboard, Users, User, LogOut, Bell, Menu, FileText, BarChart3, Check, DollarSign, Moon, Sun, Star, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui";
import { useStore } from "./store";
import { useTheme } from "./ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui";
import { useAuthGuard } from "./useAuthGuard";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { notifications, markNotificationRead, logout } = useStore();
  const { currentUser } = useAuthGuard();
  const { theme, setTheme } = useTheme();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  let navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Roster Planner", href: "/roster", icon: Calendar },
    { name: "Leaves", href: "/leaves", icon: FileText },
    { name: "Performance", href: "/appraisals", icon: Star },
    { name: "SOPs & Scopes", href: "/sops", icon: BookOpen },
  ];

  if (currentUser?.role === 'admin') {
    navigation.splice(1, 0, { name: "Employees", href: "/employees", icon: Users });
    navigation.push({ name: "Reports", href: "/reports", icon: BarChart3 });
    navigation.push({ name: "Payroll", href: "/payroll", icon: DollarSign });
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b sticky top-0 z-50">
        <div className="flex items-center gap-2 text-primary">
          <Calendar className="h-6 w-6" />
          <span className="font-bold text-lg">SmartShift</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0
      `}>
        <div className="h-16 flex items-center gap-2 px-6 border-b border-slate-100 shrink-0">
          <div className="bg-primary p-1.5 rounded-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">SmartShift</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-primary/20 text-primary-foreground' 
                    : 'text-muted-foreground hover:bg-background hover:text-foreground'}
                `}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-3 px-3 py-3">
            <div className="h-9 w-9 rounded-full bg-primary/30 flex items-center justify-center text-primary-foreground font-bold">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-semibold truncate text-foreground">{currentUser?.name}</div>
              <div className="text-xs text-muted-foreground truncate capitalize">{currentUser?.role}</div>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50 mt-1" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 shrink-0 hidden md:flex">
          <div className="text-sm text-muted-foreground font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-4">
            
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground mr-1"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? notifications.slice(0, 10).map((n) => (
                    <div key={n.id} className={`flex items-start gap-3 p-3 text-sm ${!n.is_read ? 'bg-background' : ''}`}>
                      <div className="flex-1">
                        <p className={`text-foreground ${!n.is_read ? 'font-medium' : ''}`}>{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      {!n.is_read && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => markNotificationRead(n.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-8 w-8 rounded-full bg-primary/30 flex items-center justify-center text-primary-foreground font-bold">
              {currentUser?.name.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}
