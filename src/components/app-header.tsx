"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Info, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-2 px-2">
          <div className="bg-primary p-1 rounded-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-headline font-bold text-xl tracking-tight hidden sm:block">
            IDMC <span className="text-accent">CogniAssistant</span>
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Info className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            About IDMC Assistant
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Settings
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}