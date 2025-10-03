"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createSkill } from "@/app/actions/game-actions"
import type { Database } from "@/lib/database.types"
import { Loader2, Plus } from "lucide-react"

type Skill = Database["public"]["Tables"]["skills"]["Row"]

interface SkillsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  skills: Skill[]
  availableSlots: number
}

const ELEMENTS = ["fire", "water", "earth", "air", "lightning", "ice", "light", "dark"]

export default function SkillsDialog({ open, onOpenChange, skills, availableSlots }: SkillsDialogProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newSkill, setNewSkill] = useState({
    name: "",
    description: "",
    element: "",
  })

  const hasAvailableSlots = skills.length < availableSlots

  const handleCreateSkill = async () => {
    if (!newSkill.name || !newSkill.element) {
      setError("Please provide a name and element for your skill")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await createSkill({
        name: newSkill.name,
        description: newSkill.description,
        element: newSkill.element,
        slotNumber: skills.length + 1,
      })

      if (result.success) {
        setNewSkill({ name: "", description: "", element: "" })
        setIsCreating(false)
        // Refresh the page to show new skill
        window.location.reload()
      } else {
        setError(result.error || "Failed to create skill")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skills Management</DialogTitle>
          <DialogDescription>
            Manage your skills and create new ones. You have {skills.length}/{availableSlots} skill slots used.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Skills */}
          <div className="space-y-3">
            <h3 className="font-semibold">Your Skills</h3>
            {skills.length > 0 ? (
              <div className="space-y-3">
                {skills.map((skill) => (
                  <Card key={skill.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{skill.name}</CardTitle>
                        <Badge variant="outline">{skill.element}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {skill.description && <p className="text-sm text-muted-foreground">{skill.description}</p>}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Base Damage: {skill.base_damage}</span>
                        <span className="text-muted-foreground">Slot: {skill.slot_number}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You haven't learned any skills yet.</p>
            )}
          </div>

          <Separator />

          {/* Create New Skill */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Create New Skill</h3>
              {!isCreating && hasAvailableSlots && (
                <Button variant="outline" size="sm" onClick={() => setIsCreating(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Skill
                </Button>
              )}
            </div>

            {!hasAvailableSlots && (
              <p className="text-sm text-muted-foreground">
                You have no available skill slots. Gain more through progression and special interactions.
              </p>
            )}

            {isCreating && hasAvailableSlots && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill-name">Skill Name</Label>
                    <Input
                      id="skill-name"
                      placeholder="e.g., Flame Strike"
                      value={newSkill.name}
                      onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skill-element">Element</Label>
                    <Select
                      value={newSkill.element}
                      onValueChange={(value) => setNewSkill({ ...newSkill, element: value })}
                    >
                      <SelectTrigger id="skill-element">
                        <SelectValue placeholder="Select an element" />
                      </SelectTrigger>
                      <SelectContent>
                        {ELEMENTS.map((element) => (
                          <SelectItem key={element} value={element}>
                            {element.charAt(0).toUpperCase() + element.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skill-description">Description (Optional)</Label>
                    <Textarea
                      id="skill-description"
                      placeholder="Describe your skill..."
                      value={newSkill.description}
                      onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    All skills start with 10 base damage. Damage is modified by equipment and combat situations.
                  </p>

                  {error && <p className="text-sm text-destructive">{error}</p>}

                  <div className="flex gap-2">
                    <Button onClick={handleCreateSkill} disabled={isLoading} className="flex-1">
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Skill"
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isLoading}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
