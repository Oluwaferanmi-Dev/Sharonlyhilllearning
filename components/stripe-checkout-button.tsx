'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface StripeCheckoutButtonProps {
  levelId: string
  levelName: string
  quantity: number
  disabled?: boolean
}

/**
 * Button that initiates Stripe checkout for token purchases
 * Redirects user to Stripe Checkout on click
 */
export function StripeCheckoutButton({
  levelId,
  levelName,
  quantity,
  disabled = false,
}: StripeCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCheckout = async () => {
    if (!levelId || quantity <= 0) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select a level and quantity',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Get current URL for redirect
      const currentUrl = typeof window !== 'undefined' ? window.location.origin : ''
      const successUrl = `${currentUrl}/admin/assessments?checkout=success`
      const cancelUrl = `${currentUrl}/admin/assessments?checkout=cancelled`

      // Call backend to create checkout session
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          levelId,
          quantity,
          successUrl,
          cancelUrl,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { checkoutUrl } = await response.json()

      // Redirect to Stripe Checkout
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (error) {
      console.error('[v0] Checkout error:', error)
      toast({
        title: 'Checkout Failed',
        description: error instanceof Error ? error.message : 'Failed to initiate checkout',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className="gap-2"
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {isLoading ? 'Processing...' : `Purchase Tokens for ${levelName}`}
    </Button>
  )
}
