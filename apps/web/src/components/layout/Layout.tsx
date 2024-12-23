import { Outlet } from "@tanstack/react-router";
import { Navbar } from "./Navbar";

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Outlet /> {/* This is where your page content will render */}
      </main>
    </div>
  );
}
