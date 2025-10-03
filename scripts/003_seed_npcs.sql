-- Seed initial important NPCs
INSERT INTO public.npcs (name, description, location, region, importance_level, is_initial) VALUES
('Eldrin the Seer', 'An ancient oracle who records the world''s changes and guides new adventurers', 'Rivershade', 'Eryndor', 'major', true),
('Tharos Ironfist', 'Master blacksmith who crafts and upgrades equipment for worthy warriors', 'Aurelia', 'Eryndor', 'major', true),
('Lira Moonsong', 'Gifted healer who tends to wounded adventurers and expands their potential', 'Rivershade', 'Eryndor', 'major', true),
('Captain Arvel', 'Veteran mercenary recruiter offering combat training and dangerous quests', 'Aurelia', 'Eryndor', 'quest', true),
('Nyssa the Librarian', 'Keeper of ancient knowledge who shares forgotten lore and teaches new skills', 'Aurelia', 'Eryndor', 'quest', true),
('Veyra Blackroot', 'Mysterious merchant dealing in rare and forbidden items', 'Blackroot', 'Valtheris Marshes', 'major', true),
('High Priestess Althira', 'Guardian of elemental temples who helps adventurers imbue their skills', 'Aurelia', 'Eryndor', 'major', true),
('Darius the Wanderer', 'Enigmatic traveler who appears randomly and introduces other wanderers', 'Rivershade', 'Eryndor', 'minor', true),
('The Keeper of Ruins', 'Ancient guardian who controls access to forbidden and dangerous areas', 'Ebonspire Tower', 'Eryndor', 'major', true),
('Council Member Theron', 'Political figure representing Eryndor''s Council, influenced by major events', 'Aurelia', 'Eryndor', 'major', true);
