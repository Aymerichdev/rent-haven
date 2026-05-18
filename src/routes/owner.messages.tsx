import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Inbox, Mail, MessageSquare } from "lucide-react";

export const Route = createFileRoute("/owner/messages")({
  component: Page,
});

type Message = {
  id: string;
  sender_id: string | null;
  receiver_id: string | null;
  subject: string;
  body: string;
  created_at: string | null;
  read: boolean | null;
};

function Page() {
  const user = useAppStore((s) => s.currentUser);
  const users = useAppStore((s) => s.users);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      setMessages((data ?? []) as Message[]);
    })();
  }, [user?.id]);

  const unread = messages.filter((m) => m.receiver_id === user?.id && !m.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Mensajes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mensajes enviados por tus inquilinos. {unread > 0 && <Badge className="ml-2">{unread} sin leer</Badge>}
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No tienes mensajes aún.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const tenant = users.find((u) => u.id === m.sender_id);
            const isReceived = m.receiver_id === user?.id;
            return (
              <div
                key={m.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <span className="font-medium">{m.subject}</span>
                  </div>
                  <Badge variant="outline">{isReceived ? "De " + (tenant?.name ?? "inquilino") : "Enviado"}</Badge>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {m.created_at?.slice(0, 16).replace("T", " ")}
                  </p>
                  {isReceived && tenant?.email && (
                    <Button asChild size="sm" variant="outline">
                      <a href={`mailto:${tenant.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>
                        <Mail className="mr-2 h-3.5 w-3.5" /> Responder por email
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
