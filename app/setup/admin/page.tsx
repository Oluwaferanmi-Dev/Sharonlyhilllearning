"use client";

import type React from "react";
import { useState } from "react";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AdminSetupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nin, setNin] = useState("");
  const [ninError, setNinError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const validateNIN = (value: string) => {
    // Remove any non-digit characters
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly.length === 0) {
      setNinError("");
      return true;
    }

    if (digitsOnly.length < 11) {
      setNinError("NIN must be 11 digits");
      return false;
    }

    if (digitsOnly.length > 11) {
      setNinError("NIN cannot exceed 11 digits");
      return false;
    }

    setNinError("");
    return true;
  };

  const handleNinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    const digitsOnly = value.replace(/\D/g, "");
    // Limit to 11 digits
    const limitedValue = digitsOnly.slice(0, 11);

    setNin(limitedValue);
    validateNIN(limitedValue);
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Final validation before submission
    if (!validateNIN(nin) || nin.length !== 11) {
      setMessage({
        type: "error",
        text: "Please enter a valid 11-digit NIN",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          nin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Setup failed");
      }

      setMessage({
        type: "success",
        text: `Admin user created successfully! You can now login with email: ${email}`,
      });

      // Clear form
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setNin("");
      setNinError("");
      setNinError("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32 bg-white rounded-lg shadow-md p-4 flex items-center justify-center">
            <Image
              src="/cherith-logo.jpg"
              alt="Sharonlyhill Learning Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Admin Setup</CardTitle>
            <CardDescription>
              Create your admin account to manage Sharonlyhill Learning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="firstName" className="text-sm">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="lastName" className="text-sm">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@cherithtraining.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="nin" className="text-sm">
                  National ID (11 digits)
                </Label>
                <Input
                  id="nin"
                  placeholder="12345678901"
                  required
                  value={nin}
                  onChange={handleNinChange}
                  disabled={loading}
                  className={
                    ninError ? "border-red-300 focus-visible:ring-red-400" : ""
                  }
                  maxLength={11}
                />
                {ninError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {ninError}
                  </p>
                )}
                {nin.length > 0 && !ninError && (
                  <p className="text-xs text-gray-500 mt-1">
                    {nin.length}/11 digits
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="password" className="text-sm">
                  Password (min 8 characters)
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg flex gap-2 text-sm ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Creating Admin..." : "Create Admin Account"}
              </Button>

              {message?.type === "success" && (
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full bg-transparent">
                    Go to Login
                  </Button>
                </Link>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
