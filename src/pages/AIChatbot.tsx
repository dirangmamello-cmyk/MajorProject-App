import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (resp.status === 429) { onError("Rate limited — please wait a moment."); return; }
  if (resp.status === 402) { onError("AI credits exhausted. Please add funds."); return; }
  if (!resp.ok || !resp.body) { onError("Failed to connect to AI."); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { onDone(); return; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

const suggestions = [
  "How can I save more money?",
  "What's the 50/30/20 budget rule?",
  "Tips for paying off debt fast",
  "How to start investing?",
];

export default function AIChatbot() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: updated,
        onDelta: upsert,
        onDone: () => setLoading(false),
        onError: (msg) => { toast.error(msg); setLoading(false); },
      });
    } catch {
      toast.error("Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col max-w-lg mx-auto" style={{ height: "calc(100dvh - 4rem)" }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-border bg-card">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <Bot className="w-4 h-4 text-secondary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-heading font-bold">ArkFinance AI</h1>
          <p className="text-[10px] text-muted-foreground">Your personal finance assistant</p>
        </div>
        {messages.length > 0 && (
          <button onClick={() => setMessages([])} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </motion.div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-8">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-base font-heading font-bold mb-1">Hi! I'm your AI Finance Assistant 👋</h2>
              <p className="text-xs text-muted-foreground mb-6">Ask me anything about budgeting, saving, or managing your money.</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-left text-xs p-3 rounded-xl bg-card border border-border hover:border-secondary transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5 text-secondary-foreground" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${m.role === "user" ? "bg-secondary text-secondary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:my-1 [&>ol]:my-1">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{m.content}</p>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </motion.div>
            ))
          )}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-secondary-foreground" />
              </div>
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card safe-bottom">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your finances..."
            className="flex-1 rounded-full bg-muted border-0 text-sm h-10"
            disabled={loading}
          />
          <Button type="submit" size="icon" className="rounded-full h-10 w-10 shrink-0" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
