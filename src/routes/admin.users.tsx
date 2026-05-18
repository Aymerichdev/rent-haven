import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import type { User } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: Page,
});

const empty: Omit<User, "id" | "createdAt"> = {
  name: "",
  email: "",
  password: "",
  role: "tenant",
};

function Page() {
  const users = useAppStore((s) => s.users);
  const addUser = useAppStore((s) => s.addUser);
  const updateUser = useAppStore((s) => s.updateUser);
  const deleteUser = useAppStore((s) => s.deleteUser);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState(empty);

  const startNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const startEdit = (u: User) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: u.password, role: u.role });
    setOpen(true);
  };
  const save = () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Completa todos los campos");
      return;
    }
    if (editing) {
      updateUser(editing.id, form);
      toast.success("Usuario actualizado");
    } else {
      addUser(form);
      toast.success("Usuario creado");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona cuentas y roles.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startNew} className="bg-gradient-warm">
              <Plus className="mr-2 h-4 w-4" /> Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select
                  value={form.role}
                  onValueChange={(v: User["role"]) => setForm({ ...form, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Propietario</SelectItem>
                    <SelectItem value="tenant">Inquilino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={save} className="bg-gradient-warm">
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Creado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={
                      u.role === "admin"
                        ? "border-primary/30 text-primary"
                        : u.role === "owner"
                          ? "border-success/30 text-success"
                          : ""
                    }
                  >
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => startEdit(u)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      const ok = await deleteUser(u.id);
                      if (ok) {
                        toast.success("Usuario eliminado");
                      } else {
                        toast.error("No se pudo eliminar el usuario. Revisa la consola para más detalles.");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
