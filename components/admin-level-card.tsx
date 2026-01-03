"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Unlock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminLevelCardProps {
  id: string;
  name: string;
  description?: string;
  isUnlocked: boolean;
  price: number;
  staffCount: number;
  onUnlockClick: () => void;
  onLockClick: () => Promise<void>;
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
  onLockClick,
  index = 0,
}: AdminLevelCardProps) {
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const canUnlock = name === "Beginner";

  const handleLock = async () => {
    setIsLocking(true);
    try {
      await onLockClick();
      setShowLockConfirm(false);
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ y: -4 }}
        className={`border rounded-xl p-4 sm:p-6 transition-all ${
          isUnlocked
            ? "border-green-200 bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-lg"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
        }`}
      >
        <div className="flex items-start justify-between mb-4 sm:mb-6 gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              {name}
            </h3>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              {description}
            </p>
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
            } flex-shrink-0`}
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
            className={`w-full rounded-lg transition-all text-sm sm:text-base ${
              canUnlock
                ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg cursor-pointer"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {canUnlock ? "Unlock Level" : "Unavailable"}
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              disabled
              className="w-full bg-green-600 text-white rounded-lg text-sm sm:text-base"
            >
              ✓ Unlocked
            </Button>
            <Button
              onClick={() => setShowLockConfirm(true)}
              variant="outline"
              size="sm"
              className="w-full text-xs sm:text-sm text-red-600 hover:bg-red-50 border-red-200 hover:border-red-300"
            >
              <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Reset to Locked
            </Button>
          </div>
        )}
      </motion.div>

      <AlertDialog open={showLockConfirm} onOpenChange={setShowLockConfirm}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Reset {name} Level to Locked?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              This will lock the {name} assessment level for all staff members.
              Staff will no longer be able to access this level until it's
              unlocked again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end mt-4 sm:mt-6">
            <AlertDialogCancel className="text-xs sm:text-sm">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                onClick={handleLock}
                disabled={isLocking}
                className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
              >
                {isLocking ? "Locking..." : "Reset to Locked"}
              </Button>
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
