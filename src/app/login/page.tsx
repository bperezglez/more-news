import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · More News",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Acceso privado
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">More News</h1>
          <p className="text-sm text-muted-foreground">
            Introduce tu usuario y contraseña para ver los titulares.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
