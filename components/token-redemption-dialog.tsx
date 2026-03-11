'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

interface TokenRedemptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function TokenRedemptionDialog({ isOpen, onClose, onSuccess }: TokenRedemptionDialogProps) {
  const [tokenCode, setTokenCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const handleRedeem = async () => {
    setError(null)
    setSuccessMessage(null)

    if (!tokenCode.trim()) {
      setError('Please enter a token code')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/tokens/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_code: tokenCode.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorType = data.error
        if (errorType === 'INVALID_TOKEN') {
          setError('Token not found. Please check the code and try again.')
        } else if (errorType === 'EXPIRED_TOKEN') {
          setError('This token has expired. Please contact your administrator.')
        } else if (errorType === 'ALREADY_REDEEMED_BY_YOU') {
          setError('You have already redeemed a token for this level.')
        } else if (errorType === 'ALREADY_USED') {
          setError('This token has already been used by another staff member.')
        } else if (errorType === 'ALREADY_HAS_ACCESS') {
          setError('You already have access to this assessment level.')
        } else {
          setError(data.message || 'Failed to redeem token')
        }
        return
      }

      setSuccessMessage(data.message)
      toast({
        title: 'Success',
        description: 'Token redeemed! Redirecting to assessments...',
      })

      // Clear form and close after success
      setTimeout(() => {
        setTokenCode('')
        setSuccessMessage(null)
        onClose()
        onSuccess?.()
      }, 2000)
    } catch (err) {
      console.error('[v0] Token redemption error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleRedeem()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem Access Token</DialogTitle>
          <DialogDescription>
            Enter your token code to unlock an assessment level. Token codes are provided by your administrator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token-code">Token Code</Label>
            <Input
              id="token-code"
              placeholder="e.g., A3K9X2L7"
              value={tokenCode}
              onChange={(e) => setTokenCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !!successMessage}
              maxLength={8}
              className="uppercase font-mono tracking-widest"
            />
            <p className="text-xs text-slate-500">8-character code provided by your administrator</p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          <Button
            onClick={handleRedeem}
            disabled={isLoading || !tokenCode.trim() || !!successMessage}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redeeming...
              </>
            ) : (
              'Redeem Token'
            )}
          </Button>

          <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
