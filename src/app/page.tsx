import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatInterface } from "@/components/chat-interface";
import { AppHeader } from "@/components/app-header";

/**
 * Vercel and Firebase App Hosting configuration
 * Increased timeout for long-running AI flows
 */
export const maxDuration = 60;

export default function Home() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-hidden relative">
            <ChatInterface />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
