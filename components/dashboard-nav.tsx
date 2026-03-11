"use client";

import type { User } from "@supabase/supabase-js";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";

interface Profile {
  role: string;
  first_name?: string;
  last_name?: string;
}

export function DashboardNav({ user }: { user: User }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        console.log("[v0] Fetching profile for user:", user.id);
        
        const { data, error } = await supabase
          .from("profiles")
          .select("role, first_name, last_name")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("[v0] Profile fetch error:", error);
        }

        if (data) {
          console.log("[v0] Profile fetched:", data);
          setProfile(data);
        } else {
          console.log("[v0] No profile data returned");
        }
      } catch (error) {
        console.error("[v0] Failed to fetch profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user.id]);

  const handleLogout = async () => {
    const supabase = createClient();
    setIsLoading(true);
    await supabase.auth.signOut();
    router.push("/");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const roleLabel = profile?.role === "admin" ? "Administrator" : "Staff Member";

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Desktop and Mobile Header */}
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 flex-shrink-0"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 relative">
              <Image
                src="/cherith-logo.png"
                alt="Cherith Academy"
                width={64}
                height={64}
                className="object-contain"
              />
            </div>
            <span className="hidden sm:inline font-semibold text-slate-900 text-sm sm:text-base">
              Cherith Training
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8 flex-1 ml-8">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/assessments"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Assessments
            </Link>
            <Link
              href="/dashboard/announcements"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Announcements
            </Link>
          </div>

          {/* Desktop Right Section */}
          <div className="hidden md:flex items-center gap-4 ml-auto">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-600">{profileLoading ? "Loading..." : roleLabel}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoading}
            >
              {isLoading ? "Logging out..." : "Logout"}
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-slate-900" />
            ) : (
              <Menu className="w-6 h-6 text-slate-900" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-200 space-y-3">
            {/* Mobile Navigation Links */}
            <div className="space-y-2">
              <Link href="/dashboard" onClick={closeMobileMenu}>
                <div className="px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-900">
                  Dashboard
                </div>
              </Link>
              <Link href="/dashboard/assessments" onClick={closeMobileMenu}>
                <div className="px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-900">
                  Assessments
                </div>
              </Link>
              <Link href="/dashboard/announcements" onClick={closeMobileMenu}>
                <div className="px-4 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium text-slate-900">
                  Announcements
                </div>
              </Link>
            </div>

            {/* Mobile User Info */}
            <div className="px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-600 mt-1">{profileLoading ? "Loading..." : roleLabel}</p>
            </div>

            {/* Mobile Logout Button */}
            <Button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Logging out..." : "Logout"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
