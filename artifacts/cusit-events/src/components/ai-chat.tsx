import { useState, useRef, useEffect, useCallback } from "react";
import { useListOpenaiConversations, useCreateOpenaiConversation, useDeleteOpenaiConversation, useListOpenaiMessages, getListOpenaiConversationsQueryKey, getListOpenaiMessagesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, X, MessageSquare, Plus, Trash2, ChevronLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LocalMessage = { role: "user" | "assistant"; content: string; streaming?: boolean };

export function AiChat() {
  const [open, setOpen] = useState(false);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [showConvList, setShowConvList] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useListOpenaiConversations({ query: { enabled: open } });
  const { data: serverMessages = [] } = useListOpenaiMessages(activeConvId ?? 0, { query: { enabled: !!activeConvId && open } });
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  useEffect(() => {
    if (serverMessages.length > 0 && !streaming) {
      setLocalMessages(serverMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
  }, [serverMessages, streaming]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const startNewConversation = useCallback(async () => {
    const conv = await createConv.mutateAsync({ data: { title: "Chat with CUSIT Assistant" } });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    setActiveConvId(conv.id);
    setLocalMessages([]);
    setShowConvList(false);
  }, [createConv, queryClient]);

  const openConversation = useCallback((id: number) => {
    setActiveConvId(id);
    setLocalMessages([]);
    setShowConvList(false);
  }, []);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteConv.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
    if (activeConvId === id) { setActiveConvId(null); setLocalMessages([]); setShowConvList(true); }
  }, [deleteConv, queryClient, activeConvId]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activeConvId || streaming) return;
    const userMsg = input.trim();
    setInput("");
    setLocalMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setStreaming(true);

    let assistantContent = "";
    setLocalMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      const res = await fetch(`/api/openai/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg }),
        credentials: "include",
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const json = line.slice(6);
          try {
            const parsed = JSON.parse(json);
            if (parsed.content) {
              assistantContent += parsed.content;
              setLocalMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") last.content = assistantContent;
                return next;
              });
            }
            if (parsed.done || parsed.error) break;
          } catch {}
        }
      }
    } finally {
      setStreaming(false);
      setLocalMessages((prev) => prev.map((m) => ({ ...m, streaming: false })));
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(activeConvId) });
    }
  }, [input, activeConvId, streaming, queryClient]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-col w-[380px] h-[520px] rounded-2xl border bg-background shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-2 border-b px-4 py-3 bg-primary text-primary-foreground">
            {!showConvList && (
              <button onClick={() => setShowConvList(true)} className="mr-1 hover:opacity-80">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <Bot className="h-5 w-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">CUSIT AI Assistant</p>
              <p className="text-xs opacity-80">Ask me anything about events</p>
            </div>
            <Badge variant="secondary" className="text-xs bg-primary-foreground/20 text-primary-foreground border-0">AI</Badge>
          </div>

          {showConvList ? (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="p-3 border-b">
                <Button size="sm" className="w-full" onClick={startNewConversation} disabled={createConv.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Conversation
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {conversations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p>No conversations yet</p>
                      <p className="text-xs mt-1">Start one above!</p>
                    </div>
                  )}
                  {conversations.map((conv) => (
                    <div key={conv.id} onClick={() => openConversation(conv.id)} className="flex items-center gap-2 rounded-lg p-2.5 cursor-pointer hover:bg-accent group transition-colors">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="flex-1 text-sm truncate">{conv.title}</span>
                      <button
                        onClick={(e) => handleDelete(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          ) : (
            <div className="flex flex-col flex-1 overflow-hidden">
              <ScrollArea className="flex-1 px-4 py-3">
                {localMessages.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <Bot className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Hi! I'm your CUSIT Events assistant.</p>
                    <p className="text-xs mt-1">Ask me about events, registrations, certificates, or anything else!</p>
                  </div>
                )}
                <div className="space-y-3">
                  {localMessages.map((msg, i) => (
                    <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}>
                        {msg.content || (msg.streaming && <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /><span className="text-xs">Thinking…</span></span>)}
                      </div>
                    </div>
                  ))}
                </div>
                <div ref={bottomRef} />
              </ScrollArea>
              <div className="p-3 border-t">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    disabled={streaming}
                    className="flex-1 h-9 text-sm"
                  />
                  <Button size="sm" onClick={sendMessage} disabled={!input.trim() || streaming} className="h-9 w-9 p-0 shrink-0">
                    {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
