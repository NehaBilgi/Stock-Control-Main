import React from "react";
import { useListAlerts } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ShieldAlert, Info } from "lucide-react";

export function Alerts() {
  const { data: alerts, isLoading } = useListAlerts();

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">System Alerts</h1>
        <p className="text-muted-foreground mt-1">Active notifications and warnings requiring attention.</p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div>Loading alerts...</div>
        ) : alerts?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Info className="w-6 h-6" />
              </div>
              <p className="text-lg font-medium text-foreground">No Active Alerts</p>
              <p className="text-sm">All inventory parameters are within normal operating ranges.</p>
            </CardContent>
          </Card>
        ) : (
          alerts?.map((alert) => (
            <Card key={alert.id} className={`overflow-hidden border-l-4 ${alert.severity === 'critical' ? 'border-l-destructive' : alert.severity === 'warning' ? 'border-l-warning' : 'border-l-primary'}`}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className="mt-1">
                  {alert.severity === 'critical' ? (
                    <ShieldAlert className="w-5 h-5 text-destructive" />
                  ) : alert.severity === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-warning" />
                  ) : (
                    <Info className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'outline'} className={alert.severity === 'warning' ? 'bg-warning/10 text-warning border-warning/20' : ''}>
                      {alert.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="font-semibold text-foreground">{alert.productName}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                  <div className="font-mono bg-muted px-2 py-1 rounded">Stock: {alert.currentStock || 0}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
