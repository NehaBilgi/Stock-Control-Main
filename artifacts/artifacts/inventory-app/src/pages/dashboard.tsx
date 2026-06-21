import React from "react";
import { Link } from "wouter";
import { 
  useGetDashboardStats, 
  useGetMonthlyConsumption,
  useGetCategoryBreakdown,
  useGetRecentTransactions,
  useGetTopConsumedProducts,
  useListAlerts
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Package, ArrowRightLeft, DollarSign, TrendingDown, Clock, ShieldAlert } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Button } from "react-day-picker";

function StatCard({ title, value, icon: Icon, subtitle, loading, alert }: any) {
  return (
    <Card className={`relative overflow-hidden ${alert ? 'border-l-4 border-l-destructive' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24 mb-1" />
        ) : (
          <div className={`text-2xl font-bold ${alert ? 'text-destructive' : ''}`}>{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: monthlyData } = useGetMonthlyConsumption({ months: 6 });
  const { data: categoryData } = useGetCategoryBreakdown();
  const { data: recentTx } = useGetRecentTransactions({ limit: 5 });
  const { data: topConsumed } = useGetTopConsumedProducts({ limit: 5, days: 30 });
  const { data: alerts } = useListAlerts();

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">System overview and critical metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Products" 
          value={stats?.totalProducts || 0} 
          icon={Package} 
          subtitle="Unique active SKUs"
          loading={statsLoading} 
        />
        <StatCard 
          title="Total Value" 
          value={`₹${(stats?.totalValue || 0).toLocaleString('en-IN')}`} 
          icon={DollarSign} 
          subtitle="Current inventory valuation"
          loading={statsLoading} 
        />
        <StatCard 
          title="Transactions Today" 
          value={stats?.totalTransactionsToday || 0} 
          icon={ArrowRightLeft} 
          subtitle="Daily volume"
          loading={statsLoading} 
        />
        <StatCard 
          title="Low/Out of Stock" 
          value={(stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0)} 
          icon={TrendingDown} 
          subtitle="Items requiring attention"
          alert={(stats?.lowStockCount || 0) + (stats?.outOfStockCount || 0) > 0}
          loading={statsLoading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Monthly Consumption</CardTitle>
            <CardDescription>Stock in vs Stock out over last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {monthlyData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '4px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Bar dataKey="totalStockIn" name="Stock In" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="totalStockOut" name="Stock Out" fill="hsl(var(--chart-4))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Value by Category</CardTitle>
            <CardDescription>Inventory valuation distribution</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {categoryData && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="totalValue"
                    nameKey="categoryName"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest movements in the warehouse</CardDescription>
            </div>
            <Link href="/transactions"><Button variant="outline" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTx?.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'stock_in' ? 'bg-chart-3/20 text-chart-3' : 'bg-chart-4/20 text-chart-4'}`}>
                      {tx.type === 'stock_in' ? <ArrowRightLeft className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm leading-none">{tx.productName}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(tx.transactionDate).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.type === 'stock_in' ? 'text-chart-3' : 'text-chart-4'}`}>
                      {tx.type === 'stock_in' ? '+' : '-'}{tx.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{tx.issuedTo || tx.department || 'Warehouse'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="w-4 h-4 mr-2 text-warning" />
              Active Alerts
            </CardTitle>
            <CardDescription>System warnings and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts?.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-3 border-l-2 border-l-warning bg-muted/50 rounded-r-md">
                  <p className="text-xs font-semibold mb-1 text-warning">{alert.type.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-sm font-medium">{alert.productName}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                </div>
              ))}
              {(!alerts || alerts.length === 0) && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  No active alerts. All clear.
                </div>
              )}
            </div>
            {alerts && alerts.length > 5 && (
              <div className="mt-4 pt-4 border-t text-center">
                <Link href="/alerts" className="text-xs text-primary hover:underline font-medium">
                  View all {alerts.length} alerts
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
