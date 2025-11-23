import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
// Note: AppSidebar is not imported, causing the highlighted error

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-accent/20">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;