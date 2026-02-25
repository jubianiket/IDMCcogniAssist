
"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Database, Globe, Layers, AlertCircle, Paperclip, X, FileText, Image as ImageIcon, FileSpreadsheet, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { comprehensiveIDMCInsights } from "@/ai/flows/comprehensive-idmc-insights";
import { contextualIDMCAnswers } from "@/ai/flows/contextual-idmc-answers";
import { idmcQuestionAnswering } from "@/ai/flows/idmc-question-answering";
import { idmcAttachmentAnalysis } from "@/ai/flows/attachment-analysis";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type MessageType = {
  role: "user" | "ai";
  content: string;
  sources?: string[];
  mode?: string;
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
};

type Attachment = {
  file: File;
  dataUri: string;
  type: string;
};

export function ChatInterface() {
  const [messages, setMessages] = useState<MessageType[]>([
    {
      role: "ai",
      content: "Hello! I am your IDMC CogniAssistant. I can help you with Informatica Data Management Cloud (IDMC) documentation, integration patterns, data quality, or governance questions. You can also upload screenshots, architecture diagrams, or even Excel/Word docs for analysis! How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<"standard" | "contextual" | "comprehensive">("comprehensive");
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingAttachment({
        file,
        dataUri: reader.result as string,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setPendingAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-6 h-6 text-blue-500" />;
    if (type === 'application/pdf') return <FileText className="w-6 h-6 text-red-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <FileSpreadsheet className="w-6 h-6 text-green-600" />;
    if (type.includes('word') || type.includes('officedocument.wordprocessingml')) return <FileText className="w-6 h-6 text-blue-700" />;
    return <File className="w-6 h-6 text-muted-foreground" />;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !pendingAttachment) || isLoading) return;

    const userMessage = input.trim();
    const currentAttachment = pendingAttachment;
    
    setInput("");
    setPendingAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    setMessages((prev) => [
      ...prev, 
      { 
        role: "user", 
        content: userMessage || (currentAttachment ? `Analyzing ${currentAttachment.file.name}...` : ""),
        attachment: currentAttachment ? {
          url: currentAttachment.dataUri,
          type: currentAttachment.type,
          name: currentAttachment.file.name
        } : undefined
      }
    ]);
    setIsLoading(true);

    try {
      let aiResponse = "";
      let sources: string[] | undefined;

      if (currentAttachment) {
        const result = await idmcAttachmentAnalysis({ 
          question: userMessage || "Analyze this file and explain its relevance to IDMC.",
          attachmentDataUri: currentAttachment.dataUri,
          attachmentType: currentAttachment.type
        });
        aiResponse = result.answer;
      } else if (activeMode === "comprehensive") {
        const result = await comprehensiveIDMCInsights({ question: userMessage });
        aiResponse = result.answer;
      } else if (activeMode === "contextual") {
        const result = await contextualIDMCAnswers({ question: userMessage });
        aiResponse = result.answer;
        sources = result.sourceLinks;
      } else {
        const result = await idmcQuestionAnswering({ question: userMessage });
        aiResponse = result.answer;
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", content: aiResponse, sources, mode: currentAttachment ? "attachment-analysis" : activeMode },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { 
          role: "ai", 
          content: "I encountered an error processing your request. Please try again or check your connection." 
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto px-4 pb-4">
      <div className="flex-1 overflow-hidden relative mt-4">
        <ScrollArea className="h-full pr-4" ref={scrollRef}>
          <div className="flex flex-col gap-6 py-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex flex-col max-w-[85%] group animate-in fade-in slide-in-from-bottom-2 duration-300",
                  message.role === "user" ? "ml-auto" : "mr-auto"
                )}
              >
                <div className={cn(
                  "flex items-center gap-2 mb-1 px-1",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}>
                  {message.role === "ai" ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-white">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] text-white">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    {message.role === "ai" ? "Assistant" : "You"}
                  </span>
                  {message.mode && (
                    <Badge variant="outline" className="text-[8px] py-0 px-1.5 h-4 bg-muted/30">
                      {message.mode}
                    </Badge>
                  )}
                </div>
                <div className={message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"}>
                  {message.attachment && (
                    <div className="mb-3 p-2 bg-background/20 rounded-lg border border-white/10 flex items-center gap-3 overflow-hidden">
                      {message.attachment.type.startsWith('image/') ? (
                        <img 
                          src={message.attachment.url} 
                          alt="Attachment" 
                          className="w-12 h-12 object-cover rounded border border-white/20" 
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center">
                          {getFileIcon(message.attachment.type)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold opacity-70 uppercase">Attachment</span>
                        <span className="text-xs truncate font-medium">{message.attachment.name}</span>
                      </div>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Sources:</p>
                      <ul className="flex flex-wrap gap-2">
                        {message.sources.map((source, sIdx) => (
                          <li key={sIdx}>
                            <a 
                              href={source} 
                              target="_blank" 
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-secondary text-secondary-foreground text-[10px] hover:underline transition-all"
                            >
                              <Globe className="w-3 h-3" />
                              Documentation
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col max-w-[85%] mr-auto">
                <div className="flex items-center gap-2 mb-1 px-1">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Assistant Thinking</span>
                </div>
                <div className="chat-bubble-ai min-w-[60px]">
                  <div className="flex gap-1 py-1">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-4 bg-background border rounded-2xl p-4 shadow-lg focus-within:ring-2 ring-primary/20 transition-all">
        {pendingAttachment && (
          <div className="mb-3 flex items-center gap-3 p-2 bg-muted/50 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-200">
            {pendingAttachment.type.startsWith('image/') ? (
              <img 
                src={pendingAttachment.dataUri} 
                alt="Pending" 
                className="w-10 h-10 object-cover rounded border" 
              />
            ) : (
              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                {getFileIcon(pendingAttachment.type)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{pendingAttachment.file.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Ready to upload</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={removeAttachment}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex gap-4 mb-4 overflow-x-auto pb-2 scrollbar-hide">
          <Button 
            variant={activeMode === "comprehensive" ? "default" : "outline"} 
            size="sm" 
            className="rounded-full text-xs shrink-0"
            onClick={() => setActiveMode("comprehensive")}
            disabled={!!pendingAttachment}
          >
            <Layers className="w-3 h-3 mr-1.5" />
            Comprehensive Multi-Model
          </Button>
          <Button 
            variant={activeMode === "contextual" ? "default" : "outline"} 
            size="sm" 
            className="rounded-full text-xs shrink-0"
            onClick={() => setActiveMode("contextual")}
            disabled={!!pendingAttachment}
          >
            <Database className="w-3 h-3 mr-1.5" />
            Contextual Knowledge
          </Button>
          <Button 
            variant={activeMode === "standard" ? "default" : "outline"} 
            size="sm" 
            className="rounded-full text-xs shrink-0"
            onClick={() => setActiveMode("standard")}
            disabled={!!pendingAttachment}
          >
            <Sparkles className="w-3 h-3 mr-1.5" />
            Standard Answer
          </Button>
        </div>
        <div className="flex items-end gap-2">
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl h-10 w-10 shrink-0 text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={pendingAttachment ? "Describe what to analyze in the file..." : "Ask anything about IDMC..."}
            className="min-h-[60px] max-h-[200px] border-none focus-visible:ring-0 resize-none p-0 bg-transparent"
          />
          <Button 
            size="icon" 
            disabled={(!input.trim() && !pendingAttachment) || isLoading} 
            onClick={() => handleSubmit()}
            className="rounded-xl h-10 w-10 shrink-0 shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
             <AlertCircle className="w-3 h-3" />
             {pendingAttachment ? "Multimodal mode enabled." : "AI-generated content can occasionally contain inaccuracies."}
          </div>
        </div>
      </div>
    </div>
  );
}
