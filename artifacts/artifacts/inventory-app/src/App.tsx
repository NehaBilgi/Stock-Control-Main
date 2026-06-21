import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./lib/auth";
import { initializeApi } from "./lib/api-setup";
import NotFound from "@/pages/not-found";
import { Layout } from "@/components/layout/Layout";

// Import pages
import { Dashboard } from "@/pages/dashboard";
import { Login } from "@/pages/login";
import { Products } from "@/pages/products";
// We will create these shortly:
import { ProductForm } from "@/pages/products/form";
import { Transactions } from "@/pages/transactions";
import { TransactionForm } from "@/pages/transactions/form";
import { Categories } from "@/pages/settings/categories";
import { Locations } from "@/pages/settings/locations";
import { Alerts } from "@/pages/alerts";
import { Scan } from "@/pages/scan";
import { Reports } from "@/pages/reports";
import { Reorders } from "@/pages/reorders";
import { Users } from "@/pages/users";
import { ArchivePage } from "@/pages/archive";
import { Equipment } from "@/pages/equipment";

// Initialize API configuration
initializeApi();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, ...rest }: any) {
  const [location, setLocation] = useLocation();
  const token = useAuth((state) => state.token);

  useEffect(() => {
    if (!token) {
      setLocation("/login");
    }
  }, [token, setLocation]);

  if (!token) return null;

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  const [location, setLocation] = useLocation();
  const token = useAuth((state) => state.token);

  useEffect(() => {
    if (location === "/") {
      if (token) {
        setLocation("/dashboard");
      } else {
        setLocation("/login");
      }
    }
  }, [location, setLocation, token]);

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/products">
        <ProtectedRoute component={Products} />
      </Route>
      <Route path="/products/new">
        <ProtectedRoute component={ProductForm} />
      </Route>
      <Route path="/products/:id">
        <ProtectedRoute component={ProductForm} />
      </Route>
      <Route path="/transactions">
        <ProtectedRoute component={Transactions} />
      </Route>
      <Route path="/transactions/new">
        <ProtectedRoute component={TransactionForm} />
      </Route>
      <Route path="/scan">
        <ProtectedRoute component={Scan} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/reorders">
        <ProtectedRoute component={Reorders} />
      </Route>
      <Route path="/alerts">
        <ProtectedRoute component={Alerts} />
      </Route>
      <Route path="/settings/categories">
        <ProtectedRoute component={Categories} />
      </Route>
      <Route path="/settings/locations">
        <ProtectedRoute component={Locations} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={Users} />
      </Route>
      <Route path="/archive">
        <ProtectedRoute component={ArchivePage} />
      </Route>
      <Route path="/equipment">
        <ProtectedRoute component={Equipment} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
