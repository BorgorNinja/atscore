"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-brand-700">
          ATScore
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/scan" className="hover:text-brand-700">
            Scan
          </Link>
          {session ? (
            <>
              <Link href="/dashboard" className="hover:text-brand-700">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand-700">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
