"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/types";
import type { Locale } from "@/lib/locale";

const fieldClass = "h-12 px-4 text-lg md:text-lg";

export function SignInForm({ dict }: { dict: Dictionary }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(nextEmail = email, nextPassword = password) {
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: nextEmail, password: nextPassword }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error === "invalid" ? dict.auth.errInvalid : dict.auth.errGeneric);
      setPending(false);
      return;
    }
    window.location.href = "/home";
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">{dict.common.email}</Label>
        <Input id="email" className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">{dict.common.password}</Label>
        <Input id="password" className={fieldClass} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      {error ? <p className="text-base text-[#8d3b2e]">{error}</p> : null}
      <Button type="submit" className="h-12 w-full text-base" disabled={pending}>
        {dict.landing.signIn}
      </Button>
      <div className="rounded-2xl bg-[#efe6d6] p-4">
        <p className="font-medium">{dict.auth.demoTitle}</p>
        <p className="mt-1 text-sm text-[#6d5e4c]">{dict.auth.demoBody}</p>
        <div className="mt-3 grid gap-2">
          <Button type="button" variant="outline" className="h-12 justify-start text-base" onClick={() => { setEmail("mei@hearthlight.local"); setPassword("lantern-demo"); void submit("mei@hearthlight.local", "lantern-demo"); }}>
            {dict.auth.useMei}
          </Button>
          <Button type="button" variant="outline" className="h-12 justify-start text-base" onClick={() => { setEmail("lin@hearthlight.local"); setPassword("lantern-demo"); void submit("lin@hearthlight.local", "lantern-demo"); }}>
            {dict.auth.useLin}
          </Button>
        </div>
      </div>
      <p className="text-center">
        <Link href="/sign-up" className="underline decoration-[#a6844a] underline-offset-4">{dict.auth.noAccount}</Link>
      </p>
    </form>
  );
}

export function SignUpForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 8) {
      setError(dict.auth.errPassword);
      return;
    }
    if (password !== confirm) {
      setError(dict.auth.errMismatch);
      return;
    }
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password, locale }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      const map: Record<string, string> = {
        email: dict.auth.errEmail,
        password: dict.auth.errPassword,
        taken: dict.auth.errTaken,
      };
      setError(map[payload.error || ""] || dict.auth.errGeneric);
      setPending(false);
      return;
    }
    window.location.href = "/onboarding";
  }

  return (
    <form className="space-y-4" onSubmit={(event) => void submit(event)}>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base">{dict.common.name}</Label>
        <Input id="name" className={fieldClass} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-base">{dict.common.email}</Label>
        <Input id="email" className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">{dict.common.password}</Label>
        <Input id="password" className={fieldClass} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm" className="text-base">{dict.common.confirmPassword}</Label>
        <Input id="confirm" className={fieldClass} type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required />
      </div>
      {error ? <p className="text-base text-[#8d3b2e]">{error}</p> : null}
      <Button type="submit" className="h-12 w-full text-base" disabled={pending}>{dict.auth.create}</Button>
      <p className="text-center">
        <Link href="/sign-in" className="underline decoration-[#a6844a] underline-offset-4">{dict.auth.haveAccount}</Link>
      </p>
    </form>
  );
}
