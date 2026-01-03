"use client";

import { motion } from "framer-motion";
import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLevelCardProps {
  id: string;
  name: string;
  description?: string;
  isUnlocked: boolean;
  price: number;
  staffCount: number;
  onUnlockClick: () => void;
  index?: number;
}

export function AdminLevelCard({
  id,
  name,
  description,
  isUnlocked,
  price,
  staffCount,
  onUnlockClick,
  index = 0,
}: AdminLevelCardProps) {
  const canUnlock = name === "Beginner";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={`border rounded-xl p-6 transition-all ${
        isUnlocked
          ? "border-green-200 bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-lg"
          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
          {!canUnlock && !isUnlocked && (
            <p className="text-xs text-slate-400 mt-2 font-medium">
              Not available for purchase
            </p>
          )}
        </div>
        <motion.div
          animate={{ scale: isUnlocked ? [1, 1.1, 1] : [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          className={`${
            isUnlocked
              ? "bg-green-100 p-2 rounded-lg"
              : "bg-slate-100 p-2 rounded-lg"
          }`}
        >
          {isUnlocked ? (
            <Unlock className="w-5 h-5 text-green-600" />
          ) : (
            <Lock className="w-5 h-5 text-slate-400" />
          )}
        </motion.div>
      </div>

      {!isUnlocked ? (
        <Button
          onClick={onUnlockClick}
          disabled={!canUnlock}
          className={`w-full rounded-lg transition-all ${
            canUnlock
              ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg cursor-pointer"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {canUnlock ? "Unlock Level" : "Unavailable"}
        </Button>
      ) : (
        <Button disabled className="w-full bg-green-600 text-white rounded-lg">
          ✓ Unlocked
        </Button>
      )}
    </motion.div>
  );
}
