-- Seed initial world context for major locations
INSERT INTO public.world_context (region, location, context_data, version) VALUES
('Eryndor', 'Rivershade', '{
  "type": "village",
  "description": "A peaceful farming village along a gentle river. Thatched roof cottages line cobblestone paths. The air smells of fresh bread and wildflowers.",
  "status": "peaceful",
  "accessibility": "open",
  "notable_features": ["river crossing", "market square", "healer''s cottage"],
  "dangers": "minimal"
}', 1),
('Eryndor', 'Aurelia', '{
  "type": "city",
  "description": "The grand capital of Eryndor, with towering marble buildings and bustling trade districts. The royal palace overlooks the city from a hill.",
  "status": "thriving",
  "accessibility": "open",
  "notable_features": ["royal palace", "grand library", "blacksmith district", "elemental temples"],
  "dangers": "low"
}', 1),
('Skaldor Peaks', 'Frosthelm', '{
  "type": "city",
  "description": "A fortress city carved into the mountainside, defended by warrior clans. Snow falls year-round.",
  "status": "fortified",
  "accessibility": "open",
  "notable_features": ["great hall", "training grounds", "ice caverns"],
  "dangers": "moderate"
}', 1),
('Valtheris Marshes', 'Blackroot', '{
  "type": "city",
  "description": "A hidden city built on stilts above the swamp. Ruled by shadowy merchants and poison-breeders. Mist obscures most paths.",
  "status": "mysterious",
  "accessibility": "open",
  "notable_features": ["poison markets", "hidden docks", "underground tunnels"],
  "dangers": "high"
}', 1),
('Ashen Wastes', 'Kethra', '{
  "type": "city",
  "description": "A city of glass and sand built upon ancient ruins. Scavengers and scholars coexist uneasily.",
  "status": "struggling",
  "accessibility": "open",
  "notable_features": ["glass towers", "ancient ruins below", "sand markets"],
  "dangers": "moderate"
}', 1),
('Nytheris Isles', 'Moonveil Port', '{
  "type": "city",
  "description": "Gateway to the mysterious Nytheris Isles. Sailors, adventurers, and pirates gather here. Mist rolls in from the sea.",
  "status": "bustling",
  "accessibility": "open",
  "notable_features": ["harbor", "taverns", "ship repairs", "mist gate"],
  "dangers": "moderate"
}', 1),
('Eryndor', 'Ebonspire Tower', '{
  "type": "landmark",
  "description": "A towering black spire that predates known history. Magical energy radiates from within. The Keeper guards its entrance.",
  "status": "sealed",
  "accessibility": "restricted",
  "notable_features": ["ancient seals", "magical aura", "guardian"],
  "dangers": "extreme"
}', 1),
('Eryndor', 'Crystal Hollow', '{
  "type": "landmark",
  "description": "A cave system filled with glowing mana crystals. The air hums with magical energy.",
  "status": "active",
  "accessibility": "open",
  "notable_features": ["mana crystals", "skill enhancement", "crystal formations"],
  "dangers": "low"
}', 1),
('Eryndor', 'The Weeping Ruins', '{
  "type": "landmark",
  "description": "Collapsed temple ruins where whispers of the dead can be heard. An eerie place avoided by most.",
  "status": "haunted",
  "accessibility": "open",
  "notable_features": ["ancient temple", "ghostly whispers", "cursed artifacts"],
  "dangers": "high"
}', 1),
('Ashen Wastes', 'Stormscar Battlefield', '{
  "type": "landmark",
  "description": "Site of an ancient magical war. Magical storms still rage across the scarred earth.",
  "status": "dangerous",
  "accessibility": "open",
  "notable_features": ["magical storms", "war remnants", "unstable magic"],
  "dangers": "extreme"
}', 1);
