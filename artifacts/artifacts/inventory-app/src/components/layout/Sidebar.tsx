import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  ArrowRightLeft, 
  ScanLine, 
  FileBarChart, 
  Bell, 
  Settings,
  LogOut,
  Moon,
  Sun,
  Hexagon,
  Layers,
  MapPin,
  ShoppingCart,
  Users,
  Archive,
  Cpu
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useGetMe, useListAlerts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Sidebar() {
  const [location] = useLocation();
  const { data: user } = useGetMe({ query: { retry: false } });
  const { data: alerts } = useListAlerts({ type: undefined });
  const storedUser = useAuth((s) => s.user);
  const { theme, setTheme } = useTheme();
  const logout = useAuth((state) => state.logout);

  const activeAlertsCount = alerts?.length || 0;

  const isActive = (path: string) => location === path || location.startsWith(`${path}/`);

  const NavItem = ({ href, icon: Icon, label, badge }: { href: string, icon: any, label: string, badge?: number }) => (
    <Link href={href} className="w-full">
      <Button 
        variant={isActive(href) ? "secondary" : "ghost"} 
        className={`w-full justify-start ${isActive(href) ? "font-semibold" : "font-normal text-muted-foreground"}`}
      >
        <Icon className="mr-2 h-4 w-4" />
        <span className="flex-1 text-left">{label}</span>
        {badge !== undefined && badge > 0 && (
          <Badge variant="destructive" className="ml-auto">{badge}</Badge>
        )}
      </Button>
    </Link>
  );

  return (
    <div className="flex flex-col h-full border-r bg-sidebar">
      <div className="p-4 flex items-center space-x-2 border-b border-sidebar-border/50">
        <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
          <Hexagon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="font-bold text-lg text-sidebar-foreground tracking-tight">IndustrialOps</div>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-1">
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" badge={activeAlertsCount > 0 ? activeAlertsCount : undefined} />
          <NavItem href="/products" icon={Package} label="Products" />
          <NavItem href="/transactions" icon={ArrowRightLeft} label="Transactions" />
          <NavItem href="/scan" icon={ScanLine} label="Scan Barcode" />
        </div>

        <div className="mt-6 mb-2 px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Analysis</div>
        <div className="space-y-1">
          <NavItem href="/reports" icon={FileBarChart} label="Reports" />
          <NavItem href="/alerts" icon={Bell} label="Alerts" badge={activeAlertsCount} />
          <NavItem href="/reorders" icon={ShoppingCart} label="Reorder Suggestions" />
          <NavItem href="/equipment" icon={Cpu} label="Equipment Register" />
        </div>

        <div className="mt-6 mb-2 px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">Configuration</div>
        <div className="space-y-1">
          <NavItem href="/settings/categories" icon={Layers} label="Categories" />
          <NavItem href="/settings/locations" icon={MapPin} label="Locations" />
          {(storedUser?.role === "admin" || user?.role === "admin") && (
            <NavItem href="/users" icon={Users} label="User Management" />
          )}
          {(storedUser?.role === "admin" || user?.role === "admin") && (
            <NavItem href="/archive" icon={Archive} label="Yearly Archive" />
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start px-2 py-6 h-auto">
              <div className="flex flex-col items-start text-left flex-1">
                <span className="text-sm font-semibold text-sidebar-foreground">{user?.name || 'User'}</span>
                <span className="text-xs text-sidebar-foreground/70 capitalize">{user?.role?.replace('_', ' ') || 'Role'}</span>
              </div>
              <Settings className="h-4 w-4 text-sidebar-foreground/50 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              Toggle Theme
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
