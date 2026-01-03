"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PaymentUnlockDialog } from "@/components/payment-unlock-dialog";
import { Users, CheckCircle2, TrendingUp, Award } from "lucide-react";
import { AnimatedMetricCard } from "@/components/animated-metric-card";
import { AdminLevelCard } from "@/components/admin-level-card";
import { motion } from "framer-motion";
import { containerVariants } from "@/lib/animations";
import { useAdminMetrics } from "@/hooks/use-admin-metrics";

interface AssessmentLevel {
  id: string;
  name: string;
  order_index: number;
  description?: string;
  price: number;
  requires_payment: boolean;
}

export default function AdminDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [assessmentLevels, setAssessmentLevels] = useState<AssessmentLevel[]>(
    []
  );
  const [selectedLevelForPayment, setSelectedLevelForPayment] =
    useState<AssessmentLevel | null>(null);
  const [unlockedLevelIds, setUnlockedLevelIds] = useState<Set<string>>(
    new Set()
  );
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    metrics,
    recentStaff,
    payment,
    loading: metricsLoading,
    refetch: refetchMetrics,
  } = useAdminMetrics(true);

  const supabase = createClient();

  const fetchUnlockedLevels = async () => {
    try {
      const response = await fetch("/api/admin/unlocked-levels", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const levelIds = new Set(
          data.unlockedLevels
            ?.filter((u: any) => u.is_unlocked === true)
            .map((u: any) => u.level_id) || []
        );
        setUnlockedLevelIds(levelIds);
        console.log("[v0] Unlocked levels:", Array.from(levelIds));
      }
    } catch (err) {
      console.error("[v0] Error fetching unlocked levels:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          redirect("/auth/login");
        }

        setUser(currentUser);

        const { data: levelsData, error: levelsError } = await supabase
          .from("assessment_levels")
          .select("*")
          .order("order_index");

        if (levelsError) throw levelsError;
        setAssessmentLevels(levelsData || []);

        await fetchUnlockedLevels();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load dashboard";
        console.error("[v0] Error loading admin dashboard:", message);
        setError(message);
      } finally {
        setPageLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUnlockClick = (level: AssessmentLevel) => {
    setSelectedLevelForPayment(level);
  };

  const handleConfirmPayment = async () => {
    await fetchUnlockedLevels();
    await refetchMetrics();
    setSelectedLevelForPayment(null);
  };

  if (pageLoading) {
    return (
      <div className="px-6 py-12">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Loading dashboard...
        </motion.p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-12">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-12 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">
            Manage staff access, assessments, and unlock training levels
          </p>
        </div>
      </motion.div>

      {metricsLoading && !metrics ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-4 gap-6"
        >
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-100 animate-pulse">
              <CardContent className="h-24 flex items-center justify-center">
                <p className="text-slate-400">Loading...</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      ) : (
        /* Metric Cards with real topic-level data */
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={containerVariants}
          viewport={{ once: true }}
        >
          <div className="grid md:grid-cols-4 gap-6">
            <AnimatedMetricCard
              title="Total Staff"
              value={metrics?.totalStaff || 0}
              label="Active members"
              icon={<Users className="w-4 h-4" />}
              color="blue"
              index={0}
            />
            <AnimatedMetricCard
              title="Topics Started"
              value={metrics?.topicsStarted || 0}
              label="In progress"
              icon={<TrendingUp className="w-4 h-4" />}
              color="purple"
              index={1}
            />
            <AnimatedMetricCard
              title="Topics Completed"
              value={metrics?.topicsCompleted || 0}
              label="Finished assessments"
              icon={<CheckCircle2 className="w-4 h-4" />}
              color="green"
              index={2}
            />
            <AnimatedMetricCard
              title="Topics Passed"
              value={metrics?.topicsPassed || 0}
              label={`${metrics?.averageScore || 0}% avg score`}
              icon={<Award className="w-4 h-4" />}
              color="blue"
              index={3}
            />
          </div>
        </motion.div>
      )}

      {payment && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 shadow-sm bg-slate-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-700">
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Status</p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-sm font-semibold text-slate-900"
                  >
                    {payment?.status || "Unpaid"}
                  </motion.p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-600 mb-1">Amount Due</p>
                  <p className="text-sm font-semibold text-slate-900">
                    $
                    {payment?.amount_due
                      ? payment.amount_due.toString()
                      : "0.00"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div
        initial="hidden"
        whileInView="visible"
        variants={containerVariants}
        viewport={{ once: true }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Assessment Levels</CardTitle>
            <CardDescription>
              Unlock levels to grant staff access to assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              {assessmentLevels.map((level, idx) => {
                const isUnlocked = unlockedLevelIds.has(level.id);
                return (
                  <AdminLevelCard
                    key={level.id}
                    id={level.id}
                    name={level.name}
                    description={level.description}
                    isUnlocked={isUnlocked}
                    price={level.price}
                    staffCount={metrics?.totalStaff || 0}
                    onUnlockClick={() => handleUnlockClick(level)}
                    index={idx}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { href: "/admin/staff", label: "Manage Staff" },
            { href: "/admin/payments", label: "View Payments" },
            { href: "/admin/assessments", label: "View All Assessments" },
          ].map((action, idx) => (
            <Link key={idx} href={action.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg"
                  size="lg"
                >
                  {action.label}
                </Button>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Recent Staff */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Staff Registrations</CardTitle>
            <CardDescription>
              Latest staff members to join the program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentStaff && recentStaff.length > 0 ? (
                recentStaff.map((staff, idx) => (
                  <motion.div
                    key={staff.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {staff.first_name} {staff.last_name}
                      </p>
                      <p className="text-xs text-slate-600">{staff.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-900">
                        {staff.department}
                      </p>
                      <p className="text-xs text-slate-600">
                        {new Date(staff.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">
                  No staff members registered yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {selectedLevelForPayment && (
        <PaymentUnlockDialog
          isOpen={!!selectedLevelForPayment}
          levelId={selectedLevelForPayment.id}
          levelName={selectedLevelForPayment.name}
          price={selectedLevelForPayment.price}
          staffCount={metrics?.totalStaff || 0}
          onClose={() => setSelectedLevelForPayment(null)}
          onConfirmPayment={handleConfirmPayment}
        />
      )}
    </div>
  );
}
