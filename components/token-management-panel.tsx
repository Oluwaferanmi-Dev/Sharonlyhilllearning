'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Copy, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TokenInventory {
  level_id: string
  level_name: string
  total_purchased: number
  tokens_used: number
  tokens_unused: number
  tokens_expired: number
  utilization_rate: string | number
}

interface AssessmentLevel {
  id: string
  name: string
  order_index: number
}

export function TokenManagementPanel() {
  const [inventory, setInventory] = useState<TokenInventory[]>([])
  const [levels, setLevels] = useState<AssessmentLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [selectedLevelId, setSelectedLevelId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('10')
  const [amountPaid, setAmountPaid] = useState<string>('0')
  const [generatedTokens, setGeneratedTokens] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inventoryRes, levelsRes] = await Promise.all([
        fetch('/api/admin/tokens/inventory'),
        fetch('/api/admin/assessments-levels'),
      ])

      if (inventoryRes.ok) {
        const data = await inventoryRes.json()
        setInventory(data.inventory || [])
      }

      if (levelsRes.ok) {
        const data = await levelsRes.json()
        setLevels(data.levels || [])
        if (data.levels?.length > 0 && !selectedLevelId) {
          setSelectedLevelId(data.levels[0].id)
        }
      }
    } catch (err) {
      console.error('[v0] Error loading token data:', err)
      toast({ title: 'Error', description: 'Failed to load token data' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePurchase = async () => {
    if (!selectedLevelId || !quantity) {
      toast({ title: 'Error', description: 'Please select a level and enter quantity' })
      return
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0 || qty > 10000) {
      toast({ title: 'Error', description: 'Quantity must be between 1 and 10000' })
      return
    }

    setCreating(true)

    try {
      const response = await fetch('/api/admin/tokens/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level_id: selectedLevelId,
          quantity: qty,
          amount_paid: parseFloat(amountPaid) || 0,
          payment_status: 'completed',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create purchase')
      }

      const data = await response.json()
      setGeneratedTokens(data.tokens.map((t: { token_code: string }) => t.token_code))
      setQuantity('10')
      setAmountPaid('0')

      toast({
        title: 'Success',
        description: `Created ${qty} tokens for "${
          levels.find((l) => l.id === selectedLevelId)?.name
        }"`,
      })

      await loadData()
    } catch (err) {
      console.error('[v0] Error creating purchase:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create tokens',
      })
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (token: string, index: number) => {
    await navigator.clipboard.writeText(token)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <p>Loading token management...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Create New Purchase */}
      <Card>
        <CardHeader>
          <CardTitle>Create Token Purchase</CardTitle>
          <CardDescription>Generate new tokens for an assessment level</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="level">Assessment Level</Label>
              <select
                id="level"
                value={selectedLevelId}
                onChange={(e) => setSelectedLevelId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="10000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount Paid ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCreatePurchase}
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Tokens */}
      {generatedTokens.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Tokens Generated</CardTitle>
            <CardDescription>Copy tokens to distribute to staff members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {generatedTokens.map((token, idx) => (
                <button
                  key={idx}
                  onClick={() => copyToClipboard(token, idx)}
                  className="p-3 bg-white border border-green-300 rounded-lg hover:bg-green-100 transition-colors text-sm font-mono cursor-pointer relative"
                >
                  <span className="text-xs text-slate-600">Token {idx + 1}</span>
                  <div className="font-bold text-green-700 mt-1">{token}</div>
                  {copiedIndex === idx && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-600 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Token Inventory Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Token Inventory</CardTitle>
          <CardDescription>Overview of purchased tokens by level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Level</th>
                  <th className="text-right py-2 px-4">Purchased</th>
                  <th className="text-right py-2 px-4">Used</th>
                  <th className="text-right py-2 px-4">Unused</th>
                  <th className="text-right py-2 px-4">Utilization</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.level_id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{item.level_name}</td>
                    <td className="text-right py-3 px-4">{item.total_purchased}</td>
                    <td className="text-right py-3 px-4">
                      <span className="text-green-600 font-semibold">{item.tokens_used}</span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-slate-600">{item.tokens_unused}</span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="font-medium">{item.utilization_rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
