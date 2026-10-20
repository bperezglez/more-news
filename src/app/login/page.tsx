import type { Metadata } from "next";
import { Suspense } from "react";
import { NewspaperIcon } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar · More News",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16">
      <div
        className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-96 max-w-2xl rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div className="relative w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center text-center">
          <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <NewspaperIcon className="size-6" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">Entra en More News</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Tu selección de titulares, lista para leer.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
