import React from "react";
import { Sidebar } from "./Sidebar";
import { ThemeProvider } from "next-themes";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <aside className="w-64 hidden md:block shrink-0">
          <Sidebar />
        </aside>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
