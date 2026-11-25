"use client";

export function SignOutButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="min-h-11 rounded-full px-3 text-sm text-[#6d5e4c] hover:bg-[#efe4d2] hover:text-[#2a2218]"
      onClick={() => {
        void fetch("/api/auth/sign-out", { method: "POST" }).then(() => {
          window.location.href = "/sign-in";
        });
      }}
    >
      {label}
    </button>
  );
}
