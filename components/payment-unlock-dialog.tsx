"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface PaymentUnlockDialogProps {
  isOpen: boolean;
  levelId: string;
  levelName: string;
  price: number;
  onClose: () => void;
  onConfirmPayment: () => void;
  staffCount: number;
}

export function PaymentUnlockDialog({
  isOpen,
  levelId,
  levelName,
  price,
  onClose,
  onConfirmPayment,
  staffCount,
}: PaymentUnlockDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customStaffCount, setCustomStaffCount] = useState<string>(
    staffCount.toString()
  );
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoApplied, setPromoApplied] = useState(false);

  const [couponCode, setCouponCode] = useState<string>("");
  const [couponValidated, setCouponValidated] = useState(false);
  const [couponError, setCouponError] = useState<string>("");
  const [unlockMethod, setUnlockMethod] = useState<"payment" | "coupon">(
    "payment"
  );

  const currentStaffCount = Number.parseInt(customStaffCount) || staffCount;
  const baseAmount = currentStaffCount * price;

  const discount = promoApplied ? baseAmount : 0;
  const totalAmount = baseAmount - discount;

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "sharonlyhill") {
      setPromoApplied(true);
    } else {
      alert("Invalid promo code");
    }
  };

  const handleValidateCoupon = () => {
    setCouponError("");
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (couponCode.toLowerCase() === "sharonllyhill") {
      setCouponValidated(true);
    } else {
      setCouponError("This coupon code is unavailable");
      setCouponValidated(false);
    }
  };

  const handleUnlock = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/admin/unlock-level", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          levelId,
          staffCount: currentStaffCount,
          promoCode: promoApplied ? promoCode : null,
          unlockMethod,
          couponCode: unlockMethod === "coupon" ? couponCode : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to unlock level");
      }

      const result = await response.json();
      console.log("[v0] Level unlocked:", result);

      await onConfirmPayment();
    } catch (error) {
      console.error("[v0] Unlock error:", error);
      alert(error instanceof Error ? error.message : "Failed to unlock level");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Unlock {levelName} Assessment</AlertDialogTitle>
          <AlertDialogDescription className="space-y-6 mt-4">
            <div>
              <p className="text-slate-700 font-medium">
                Assessment Level: {levelName}
              </p>
              <p className="text-slate-600 text-sm mt-1">
                Price per staff member: ${price.toFixed(2)}
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-700">
                Unlock Method
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setUnlockMethod("payment");
                    setCouponCode("");
                    setCouponValidated(false);
                    setCouponError("");
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    unlockMethod === "payment"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  Payment
                </button>
                <button
                  onClick={() => {
                    setUnlockMethod("coupon");
                    setPromoCode("");
                    setPromoApplied(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    unlockMethod === "coupon"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  Coupon Code
                </button>
              </div>
            </div>

            {unlockMethod === "payment" ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Number of Staff Members
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={customStaffCount}
                    onChange={(e) => setCustomStaffCount(e.target.value)}
                    placeholder="Enter staff count"
                    className="w-full"
                  />
                </div>

                <input
                  type="hidden"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                {!promoApplied && (
                  <div className="hidden">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={!promoCode}
                      className="shrink-0 bg-transparent"
                    >
                      Apply
                    </Button>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Staff members:</span>
                      <span className="font-semibold text-slate-900">
                        {currentStaffCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Base amount:</span>
                      <span className="font-semibold text-slate-900">
                        ${baseAmount.toFixed(2)}
                      </span>
                    </div>
                    {promoApplied && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span className="font-semibold">
                          -${discount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="border-t border-blue-300 pt-2 flex justify-between">
                      <span className="text-slate-700 font-semibold">
                        Total due:
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        ${totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  Once payment is processed, all {currentStaffCount} staff
                  members will have access to {levelName} assessments.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">
                    Enter Coupon Code
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setCouponError("");
                      }}
                      placeholder="Enter coupon code"
                      disabled={couponValidated}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleValidateCoupon}
                      disabled={couponValidated || !couponCode.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Validate
                    </Button>
                  </div>
                </div>

                {couponError && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-700">{couponError}</p>
                  </div>
                )}

                {couponValidated && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-green-700">
                      Coupon code is valid! Click unlock to proceed.
                    </p>
                  </div>
                )}

                <p className="text-sm text-slate-600">
                  Enter a valid coupon code to unlock the {levelName} assessment
                  level for all staff members at no cost.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end mt-6">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={handleUnlock}
              disabled={
                isProcessing ||
                (unlockMethod === "payment" && totalAmount > 0) ||
                (unlockMethod === "coupon" && !couponValidated)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? "Processing..." : "Unlock Now"}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
