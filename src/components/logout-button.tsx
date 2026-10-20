"use client";

import { useState } from "react";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.href = "/login";
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => void logout()}
      disabled={pending}
      aria-label="Cerrar sesión"
    >
      <LogOutIcon />
      <span className="hidden sm:inline">Salir</span>
    </Button>
  );
}
