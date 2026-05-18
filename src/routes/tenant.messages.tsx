import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Inbox, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/tenant/messages")({
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
  const contracts = useAppStore((s) => s.contracts);
  const users = useAppStore((s) => s.users);

  const myActive = contracts.find((c) => c.tenantId === user?.id && c.status === "active");
  const owner = myActive ? users.find((u) => u.id === myActive.ownerId) : null;

  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setMessages((data ?? []) as Message[]);
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const send = async () => {
    if (!user || !owner) {
      toast.error("Necesitas un contrato activo para enviar mensajes");
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error("Completa asunto y mensaje");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: owner.id,
      contract_id: myActive!.id,
      subject: subject.trim(),
      body: body.trim(),
      type: "general",
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Mensaje enviado");
    setSubject("");
    setBody("");
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Mensajes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Comunícate con tu propietario.
        </p>
      </div>

      {!owner ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">
            Necesitas un contrato activo para enviar mensajes.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Nuevo mensaje para {owner.name}</h2>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="subject">Asunto</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={120}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="body">Mensaje</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                className="mt-1 min-h-32"
              />
            </div>
            <Button onClick={send} disabled={sending} className="bg-gradient-warm">
              <Send className="mr-2 h-4 w-4" /> {sending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-3 inline-flex items-center gap-2 font-display text-lg font-bold">
          <MessageSquare className="h-5 w-5 text-primary" /> Historial ({messages.length})
        </h2>
        {messages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
            Sin mensajes aún.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const isMine = m.sender_id === user?.id;
              return (
                <div
                  key={m.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{m.subject}</div>
                    <Badge variant="outline">{isMine ? "Enviado" : "Recibido"}</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {m.created_at?.slice(0, 16).replace("T", " ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
