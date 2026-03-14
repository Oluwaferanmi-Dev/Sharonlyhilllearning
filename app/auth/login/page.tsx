"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Resolve role from the profiles table via the /api/auth/role endpoint
      // so that redirects are driven by profiles.role as the single source of truth.
      try {
        const roleRes = await fetch("/api/auth/role", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        if (roleRes.ok) {
          const { role } = (await roleRes.json()) as { role: string | null };
          if (role === "admin") {
            router.push("/admin");
            return;
          }
        }
      } catch {
        // If role lookup fails for any reason, fall back to staff dashboard.
      }

      router.push("/dashboard");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 relative">
              <Image
                src="/cherith-logo.png"
                alt="Sharonlyhill Learning"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <span className="font-semibold text-slate-900">
              Sharonlyhill Learning
            </span>
          </div>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access your assessments and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:underline font-semibold"
            >
              Create one
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
