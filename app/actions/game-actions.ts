"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { saveMessage } from "./message-actions";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GameActionParams {
  action: string;
  sessionId: string;
  messages: Array<{ role: string; content: string; timestamp: string }>;
}

interface AIResponse {
  narrative: string;
  worldChange?: {
    location: string;
    region: string;
    changeSummary: string;
    newContextData: Record<string, unknown>;
  };
  newNPC?: {
    name: string;
    description: string;
    location: string;
    region: string;
  };
  combat?: {
    occurred: boolean;
    damage?: number;
    result?: string;
  };
  rewards?: {
    experience?: number;
    equipment?: string;
    skillSlot?: boolean;
  };
  locationChange?: {
    newLocation: string;
    newRegion: string;
  };
}

export async function processGameAction(params: GameActionParams) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    await saveMessage(params.sessionId, "user", params.action);

    // Fetch player profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Fetch world context for current location
    const { data: worldContext } = await supabase
      .from("world_context")
      .select("*")
      .eq("region", profile.current_region)
      .eq("location", profile.current_location)
      .single();

    // Fetch NPCs in current location
    const { data: npcs } = await supabase
      .from("npcs")
      .select("*")
      .eq("region", profile.current_region)
      .eq("location", profile.current_location);

    // Fetch player's equipped items
    const { data: equippedItems } = await supabase
      .from("player_inventory")
      .select(
        `
        equipment:equipment_id (
          name,
          category,
          stat_modifiers
        )
      `
      )
      .eq("player_id", user.id)
      .eq("is_equipped", true);

    // Fetch player's skills
    const { data: skills } = await supabase
      .from("skills")
      .select("*")
      .eq("player_id", user.id);

    // Build context for AI
    const systemPrompt = buildSystemPrompt(
      profile,
      worldContext,
      npcs || [],
      equippedItems || [],
      skills || []
    );

    // Call OpenRouter AI
    const aiResponse = await callOpenRouterAI(
      systemPrompt,
      params.action,
      params.messages
    );

    if (!aiResponse) {
      return { success: false, error: "Failed to get AI response" };
    }

    // Parse AI response
    const parsedResponse = parseAIResponse(aiResponse);

    await saveMessage(params.sessionId, "assistant", parsedResponse.narrative);

    // Update database based on AI response
    await updateGameState(supabase, user.id, profile, parsedResponse);

    await supabase
      .from("game_sessions")
      .update({
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", params.sessionId);

    // Log player action
    await supabase.from("player_actions").insert({
      player_id: user.id,
      action_type: parsedResponse.combat?.occurred ? "combat" : "exploration",
      location: profile.current_location,
      region: profile.current_region,
      action_data: {
        action: params.action,
        response: parsedResponse,
      },
    });

    revalidatePath("/game");

    return {
      success: true,
      response: parsedResponse.narrative,
    };
  } catch (error) {
    console.error("[v0] Error in processGameAction:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

function buildSystemPrompt(
  profile: any,
  worldContext: any,
  npcs: any[],
  equippedItems: any[],
  skills: any[]
): string {
  const contextData = worldContext?.context_data || {};

  const adventureSummarySection = profile.adventure_summary
    ? `
ADVENTURE SUMMARY (Previous Events):
${profile.adventure_summary}

Note: The above is a summary of the player's previous adventures. Use this context to maintain story continuity.
`
    : "";

  return `You are the Game Master for a text-based RPG set in the world of Eryndor. Your role is to create immersive, dynamic narratives based on player actions.

PLAYER INFO:
- Name: ${profile.display_name}
- Level: ${profile.level}
- Experience: ${profile.experience}
- Current Location: ${profile.current_location}, ${profile.current_region}
- Skill Slots: ${skills.length}/${profile.skill_slots}

${adventureSummarySection}

CURRENT LOCATION CONTEXT:
${JSON.stringify(contextData, null, 2)}

NPCS IN AREA:
${
  npcs.map((npc) => `- ${npc.name}: ${npc.description}`).join("\n") ||
  "No notable NPCs nearby"
}

EQUIPPED ITEMS:
${
  equippedItems
    .map((item: any) => `- ${item.equipment.name} (${item.equipment.category})`)
    .join("\n") || "No items equipped"
}

PLAYER SKILLS:
${
  skills
    .map(
      (skill) =>
        `- ${skill.name} (${skill.element}, ${
          skill.base_damage
        } base damage): ${skill.description || "No description"}`
    )
    .join("\n") || "No skills learned"
}

GAME RULES:
1. Combat: When combat occurs, calculate damage based on base skill damage (10) + equipment modifiers + environmental factors
2. World Changes: Significant player actions (collapsing ruins, defeating major enemies, etc.) should update world context
3. NPCs: When players encounter notable characters not in the NPC list, create them with name and description
4. Progression: Award experience for completing challenges. Level up every 100 XP.
5. Equipment: Players can find equipment appropriate to their level and location
6. Skills: Players can learn new skills through special interactions or progression milestones

RESPONSE FORMAT:
You must respond with a JSON object containing:
{
  "narrative": "The story text describing what happens",
  "worldChange": { // Only if player action significantly changes the world
    "location": "location name",
    "region": "region name",
    "changeSummary": "Brief summary of change",
    "newContextData": { updated context object }
  },
  "newNPC": { // Only if player encounters a new notable NPC
    "name": "NPC name",
    "description": "Brief description",
    "location": "location name",
    "region": "region name"
  },
  "combat": { // Only if combat occurs
    "occurred": true,
    "damage": calculated_damage,
    "result": "victory/defeat/ongoing"
  },
  "rewards": { // Only if player earns rewards
    "experience": amount,
    "equipment": "equipment name",
    "skillSlot": true/false
  },
  "locationChange": { // Only if player moves to new location
    "newLocation": "location name",
    "newRegion": "region name"
  }
}

Be creative, engaging, and responsive to player choices. Make the world feel alive and dynamic.`;
}

async function callOpenRouterAI(
  systemPrompt: string,
  userAction: string,
  previousMessages: any[]
): Promise<string> {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const messages: Message[] = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...previousMessages.slice(-3).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: userAction,
    },
  ];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://v0.app",
        "X-Title": "Eryndor RPG",
      },
      body: JSON.stringify({
        model: "x-ai/grok-4-fast:free",
        messages,
        temperature: 0.8,
        max_tokens: 1000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[v0] OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

function parseAIResponse(aiResponse: string): AIResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    }

    // If no JSON found, return just the narrative
    return {
      narrative: aiResponse,
    };
  } catch (error) {
    console.error("[v0] Error parsing AI response:", error);
    // Fallback: return the raw response as narrative
    return {
      narrative: aiResponse,
    };
  }
}

async function updateGameState(
  supabase: any,
  userId: string,
  profile: any,
  response: AIResponse
) {
  // Update experience and level
  if (response.rewards?.experience) {
    const newExperience = profile.experience + response.rewards.experience;
    const newLevel = Math.floor(newExperience / 100) + 1;

    await supabase
      .from("profiles")
      .update({
        experience: newExperience,
        level: newLevel,
      })
      .eq("id", userId);
  }

  // Update location if changed
  if (response.locationChange) {
    await supabase
      .from("profiles")
      .update({
        current_location: response.locationChange.newLocation,
        current_region: response.locationChange.newRegion,
      })
      .eq("id", userId);
  }

  // Add skill slot if rewarded
  if (response.rewards?.skillSlot) {
    await supabase
      .from("profiles")
      .update({
        skill_slots: profile.skill_slots + 1,
      })
      .eq("id", userId);
  }

  // Update world context if changed
  if (response.worldChange) {
    const { data: existingContext } = await supabase
      .from("world_context")
      .select("*")
      .eq("region", response.worldChange.region)
      .eq("location", response.worldChange.location)
      .single();

    if (existingContext) {
      await supabase
        .from("world_context")
        .update({
          context_data: response.worldChange.newContextData,
          version: existingContext.version + 1,
          last_modified_by: userId,
          last_modified_at: new Date().toISOString(),
        })
        .eq("id", existingContext.id);

      // Create world change alert
      await supabase.from("world_changes").insert({
        region: response.worldChange.region,
        location: response.worldChange.location,
        change_summary: response.worldChange.changeSummary,
        changed_by_player_id: userId,
        changed_by_player_name: profile.display_name,
      });
    }
  }

  // Add new NPC if discovered
  if (response.newNPC) {
    await supabase
      .from("npcs")
      .insert({
        name: response.newNPC.name,
        description: response.newNPC.description,
        location: response.newNPC.location,
        region: response.newNPC.region,
        importance_level: "minor",
        created_by_player_id: userId,
      })
      .onConflict("name,location")
      .ignore();
  }

  // Add equipment if rewarded
  if (response.rewards?.equipment) {
    const { data: equipment } = await supabase
      .from("equipment")
      .select("id")
      .eq("name", response.rewards.equipment)
      .single();

    if (equipment) {
      await supabase
        .from("player_inventory")
        .insert({
          player_id: userId,
          equipment_id: equipment.id,
          is_equipped: false,
        })
        .onConflict("player_id,equipment_id")
        .ignore();
    }
  }
}

export async function createSkill(params: {
  name: string;
  description: string;
  element: string;
  slotNumber: number;
}) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Check if player has available skill slots
    const { data: profile } = await supabase
      .from("profiles")
      .select("skill_slots")
      .eq("id", user.id)
      .single();

    const { data: existingSkills } = await supabase
      .from("skills")
      .select("id")
      .eq("player_id", user.id);

    if (
      !profile ||
      (existingSkills && existingSkills.length >= profile.skill_slots)
    ) {
      return { success: false, error: "No available skill slots" };
    }

    // Create skill
    const { error } = await supabase.from("skills").insert({
      player_id: user.id,
      name: params.name,
      description: params.description,
      element: params.element,
      base_damage: 10,
      slot_number: params.slotNumber,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/game");
    return { success: true };
  } catch (error) {
    console.error("[v0] Error creating skill:", error);
    return { success: false, error: "Failed to create skill" };
  }
}

export async function equipItem(itemId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get item details
    const { data: item } = await supabase
      .from("player_inventory")
      .select("equipment:equipment_id(category)")
      .eq("id", itemId)
      .eq("player_id", user.id)
      .single();

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    // Unequip other items in same category
    await supabase
      .from("player_inventory")
      .update({ is_equipped: false })
      .eq("player_id", user.id)
      .eq("equipment.category", (item.equipment as any).category);

    // Equip this item
    await supabase
      .from("player_inventory")
      .update({ is_equipped: true })
      .eq("id", itemId)
      .eq("player_id", user.id);

    revalidatePath("/game");
    return { success: true };
  } catch (error) {
    console.error("[v0] Error equipping item:", error);
    return { success: false, error: "Failed to equip item" };
  }
}
