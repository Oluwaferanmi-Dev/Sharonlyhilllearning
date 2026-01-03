"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

interface PaymentUnlockDialogProps {
  isOpen: boolean
  levelId: string
  levelName: string
  price: number
  onClose: () => void
  onConfirmPayment: () => void
  staffCount: number
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [customStaffCount, setCustomStaffCount] = useState<string>(staffCount.toString())
  const [promoCode, setPromoCode] = useState<string>("")
  const [promoApplied, setPromoApplied] = useState(false)

  const currentStaffCount = Number.parseInt(customStaffCount) || staffCount
  const baseAmount = currentStaffCount * price

  const discount = promoApplied ? baseAmount : 0
  const totalAmount = baseAmount - discount

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "sharonlyhill") {
      setPromoApplied(true)
    } else {
      alert("Invalid promo code")
    }
  }

  const handlePayment = async () => {
    setIsProcessing(true)
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
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to unlock level")
      }

      const result = await response.json()
      console.log("[v0] Level unlocked:", result)

      await onConfirmPayment()
    } catch (error) {
      console.error("[v0] Payment error:", error)
      alert(error instanceof Error ? error.message : "Failed to process payment")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Unlock {levelName} Assessment</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 mt-4">
            <div>
              <p className="text-slate-700 font-medium">Assessment Level: {levelName}</p>
              <p className="text-slate-600 text-sm mt-1">Price per staff member: ${price.toFixed(2)}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Number of Staff Members</label>
                <Input
                  type="number"
                  min="1"
                  value={customStaffCount}
                  onChange={(e) => setCustomStaffCount(e.target.value)}
                  placeholder="Enter staff count"
                  className="w-full"
                />
              </div>

              <input type="hidden" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
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
                    <span className="font-semibold text-slate-900">{currentStaffCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base amount:</span>
                    <span className="font-semibold text-slate-900">${baseAmount.toFixed(2)}</span>
                  </div>
                  {promoApplied && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-blue-300 pt-2 flex justify-between">
                    <span className="text-slate-700 font-semibold">Total due:</span>
                    <span className="text-xl font-bold text-blue-600">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Once payment is processed, all {currentStaffCount} staff members will have access to {levelName}{" "}
                assessments.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end mt-6">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handlePayment} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? "Processing..." : totalAmount === 0 ? "Unlock Now" : "Complete Payment"}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
