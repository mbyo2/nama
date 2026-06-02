import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2, Mail, MailOpen, Send, Clock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyMember, fetchMemberMessages, markMessageAsRead } from "@/lib/nama-api";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({
  component: MessagesPage,
  head: () => ({
    meta: [
      { title: "Messages — NAMA" },
    ],
  }),
});

function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [member, setMember] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        const [m, msgs] = await Promise.all([
          fetchMyMember(user.id),
          fetchMemberMessages(user.id)
        ]);
        
        if (!m) {
          navigate({ to: "/register" });
          return;
        }
        
        setMember(m);
        setMessages(msgs);
      } catch (error) {
        console.error("Error loading messages:", error);
        toast.error("Could not load your messages");
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user]);

  const handleMessageClick = async (message: any) => {
    setSelectedMessage(message);
    if (!message.read_at) {
      try {
        await markMessageAsRead(message.id);
        setMessages(prev => 
          prev.map(m => m.id === message.id ? { ...m, read_at: new Date().toISOString() } : m)
        );
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-brass animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Member information not found</p>
          <button
            onClick={() => navigate({ to: "/app" })}
            className="mt-4 text-brass hover:text-brass/80"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-foreground">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate({ to: "/app" })}
          className="inline-flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
        </button>

        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-brass">— Messages</p>
        <h1 className="mt-3 font-serif text-3xl sm:text-4xl text-foreground tracking-tight" style={{ lineHeight: "1.1" }}>
          Communications from NAMA.
        </h1>

        {messages.length === 0 ? (
          <div className="mt-8 text-center py-12">
            <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No messages from NAMA administration</p>
            <p className="text-sm text-muted-foreground mt-2">
              Important announcements and updates will appear here.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            {/* Message List */}
            <div className="lg:col-span-1 space-y-2">
              <h3 className="text-sm font-medium text-foreground mb-3">Inbox</h3>
              {messages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  className={`w-full text-left p-4 rounded-sm border transition-colors ${
                    selectedMessage?.id === message.id
                      ? "border-brass bg-brass/5"
                      : message.read_at
                      ? "border-border bg-paper hover:bg-card"
                      : "border-brass/50 bg-brass/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-brass/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {message.read_at ? (
                        <MailOpen className="w-3 h-3 text-brass" />
                      ) : (
                        <Mail className="w-3 h-3 text-brass" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${message.read_at ? `text-muted-foreground` : `text-foreground font-medium`}`}>
                        {message.subject}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        From {message.admin_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(message.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Message Content */}
            <div className="lg:col-span-2">
              {selectedMessage ? (
                <div className="border border-border bg-card rounded-sm p-6">
                  <div className="border-b border-border pb-4 mb-4">
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      {selectedMessage.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>From: {selectedMessage.admin_name}</span>
                      <span>•</span>
                      <span>
                        {new Date(selectedMessage.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </div>
                  {!selectedMessage.read_at && (
                    <div className="mt-6 p-3 bg-brass/5 border border-brass/30 rounded-sm">
                      <p className="text-xs text-brass font-medium">
                        ✓ Marked as read
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border border-border bg-card rounded-sm p-12 text-center">
                  <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a message to read</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 border border-brass/30 bg-brass/5 rounded-sm">
          <p className="text-sm text-muted-foreground">
            <strong>Important Communications:</strong> NAMA administration uses this channel to send important updates, announcements, and instructions regarding your membership.
          </p>
        </div>
      </div>
    </div>
  );
}
