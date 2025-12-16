import { Sidebar } from "./Sidebar";
import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

export function Layout() {
  return (
    <>
      <div className="flex h-screen bg-background">
        <div className="flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
