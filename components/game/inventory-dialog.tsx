"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { equipItem } from "@/app/actions/game-actions"
import { createClient } from "@/lib/supabase/client"
import { Loader2, Check } from "lucide-react"

interface InventoryItem {
  id: string
  is_equipped: boolean
  equipment: {
    id: string
    name: string
    category: string
    tier: number
    stat_modifiers: Record<string, number>
    description: string | null
  }
}

interface InventoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function InventoryDialog({ open, onOpenChange }: InventoryDialogProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [equippingId, setEquippingId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadInventory()
    }
  }, [open])

  const loadInventory = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("player_inventory")
      .select(
        `
        id,
        is_equipped,
        equipment:equipment_id (
          id,
          name,
          category,
          tier,
          stat_modifiers,
          description
        )
      `,
      )
      .eq("player_id", user.id)
      .order("is_equipped", { ascending: false })

    setInventory((data as any) || [])
    setIsLoading(false)
  }

  const handleEquip = async (itemId: string) => {
    setEquippingId(itemId)
    const result = await equipItem(itemId)

    if (result.success) {
      await loadInventory()
      // Refresh the page to update equipped items in sidebar
      setTimeout(() => window.location.reload(), 500)
    }

    setEquippingId(null)
  }

  const groupedInventory = inventory.reduce(
    (acc, item) => {
      const category = item.equipment.category
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    },
    {} as Record<string, InventoryItem[]>,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory</DialogTitle>
          <DialogDescription>View and equip your items. Only one item per category can be equipped.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Your inventory is empty. Find equipment through your adventures!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedInventory).map(([category, items]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-semibold capitalize">{category}</h3>
                <div className="grid gap-3">
                  {items.map((item) => (
                    <Card key={item.id} className={item.is_equipped ? "border-primary" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base">{item.equipment.name}</CardTitle>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Tier {item.equipment.tier}</Badge>
                              {item.is_equipped && (
                                <Badge variant="default" className="gap-1">
                                  <Check className="h-3 w-3" />
                                  Equipped
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!item.is_equipped && (
                            <Button size="sm" onClick={() => handleEquip(item.id)} disabled={equippingId === item.id}>
                              {equippingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Equip"}
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {item.equipment.description && (
                          <p className="text-sm text-muted-foreground">{item.equipment.description}</p>
                        )}
                        <Separator />
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(item.equipment.stat_modifiers).map(([stat, value]) => (
                            <div key={stat}>
                              <span className="text-muted-foreground capitalize">{stat.replace(/_/g, " ")}:</span>{" "}
                              <span className="text-primary">+{value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
