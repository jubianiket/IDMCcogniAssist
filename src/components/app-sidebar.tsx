"use client";

import * as React from "react";
import {
  History,
  MessageSquare,
  Plus,
  Search,
  BookOpen,
  LayoutDashboard,
  ExternalLink,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="p-4">
        <Button className="w-full justify-start gap-2 font-medium" variant="default">
          <Plus className="w-4 h-4" />
          <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
        </Button>
        <div className="relative mt-4 group-data-[collapsible=icon]:hidden">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search threads..." className="pl-8 bg-background/50 border-none focus-visible:ring-1" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">History</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[
                "What is IDMC?",
                "Cloud Data Integration best practices",
                "How to setup CDGC?",
                "Informatica CLAIRE features",
              ].map((item, i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton tooltip={item} isActive={i === 0}>
                    <MessageSquare className="w-4 h-4" />
                    <span className="truncate">{item}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarSeparator />
        
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Resources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="IDMC Docs">
                  <a href="https://docs.informatica.com" target="_blank">
                    <BookOpen className="w-4 h-4" />
                    <span>Documentation</span>
                    <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Architecture">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Architecture Patterns</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:px-1">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs shrink-0">
            JD
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold truncate">Jane Doe</span>
            <span className="text-xs text-muted-foreground truncate">Enterprise Admin</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}