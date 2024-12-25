import { Outlet } from "@tanstack/react-router";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <div >
        <Navbar />
      </div>
      <main className="mt-16">
        <Outlet /> 
      </main>
    </div>
  );
}
