export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          level: number;
          experience: number;
          current_location: string;
          current_region: string;
          skill_slots: number;
          adventure_summary: string | null;
          last_summary_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          level?: number;
          experience?: number;
          current_location?: string;
          current_region?: string;
          skill_slots?: number;
          adventure_summary?: string | null;
          last_summary_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          level?: number;
          experience?: number;
          current_location?: string;
          current_region?: string;
          skill_slots?: number;
          adventure_summary?: string | null;
          last_summary_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          category: string;
          tier: number;
          stat_modifiers: Json;
          unlock_level: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: string;
          tier?: number;
          stat_modifiers?: Json;
          unlock_level?: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          tier?: number;
          stat_modifiers?: Json;
          unlock_level?: number;
          description?: string | null;
          created_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          player_id: string;
          name: string;
          description: string | null;
          element: string;
          base_damage: number;
          slot_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          name: string;
          description?: string | null;
          element: string;
          base_damage?: number;
          slot_number: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          name?: string;
          description?: string | null;
          element?: string;
          base_damage?: number;
          slot_number?: number;
          created_at?: string;
        };
      };
      player_inventory: {
        Row: {
          id: string;
          player_id: string;
          equipment_id: string;
          is_equipped: boolean;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          equipment_id: string;
          is_equipped?: boolean;
          acquired_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          equipment_id?: string;
          is_equipped?: boolean;
          acquired_at?: string;
        };
      };
      npcs: {
        Row: {
          id: string;
          name: string;
          description: string;
          location: string;
          region: string;
          importance_level: string;
          is_initial: boolean;
          created_by_player_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          location: string;
          region: string;
          importance_level?: string;
          is_initial?: boolean;
          created_by_player_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          location?: string;
          region?: string;
          importance_level?: string;
          is_initial?: boolean;
          created_by_player_id?: string | null;
          created_at?: string;
        };
      };
      world_context: {
        Row: {
          id: string;
          region: string;
          location: string;
          context_data: Json;
          version: number;
          last_modified_by: string | null;
          last_modified_at: string;
        };
        Insert: {
          id?: string;
          region: string;
          location: string;
          context_data: Json;
          version?: number;
          last_modified_by?: string | null;
          last_modified_at?: string;
        };
        Update: {
          id?: string;
          region?: string;
          location?: string;
          context_data?: Json;
          version?: number;
          last_modified_by?: string | null;
          last_modified_at?: string;
        };
      };
      world_changes: {
        Row: {
          id: string;
          region: string;
          location: string;
          change_summary: string;
          changed_by_player_id: string;
          changed_by_player_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          region: string;
          location: string;
          change_summary: string;
          changed_by_player_id: string;
          changed_by_player_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          region?: string;
          location?: string;
          change_summary?: string;
          changed_by_player_id?: string;
          changed_by_player_name?: string;
          created_at?: string;
        };
      };
      player_actions: {
        Row: {
          id: string;
          player_id: string;
          action_type: string;
          location: string;
          region: string;
          action_data: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          action_type: string;
          location: string;
          region: string;
          action_data: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          action_type?: string;
          location?: string;
          region?: string;
          action_data?: Json;
          created_at?: string;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          player_id: string;
          messages: Json;
          started_at: string;
          last_activity_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          messages?: Json;
          started_at?: string;
          last_activity_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          messages?: Json;
          started_at?: string;
          last_activity_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          player_id: string;
          session_id: string;
          role: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          session_id: string;
          role: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          session_id?: string;
          role?: string;
          content?: string;
          created_at?: string;
        };
      };
      seen_world_changes: {
        Row: {
          id: string;
          player_id: string;
          world_change_id: string;
          seen_at: string;
        };
        Insert: {
          id?: string;
          player_id: string;
          world_change_id: string;
          seen_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string;
          world_change_id?: string;
          seen_at?: string;
        };
      };
    };
  };
}
