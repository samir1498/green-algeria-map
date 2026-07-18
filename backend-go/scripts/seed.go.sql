INSERT INTO zones (id, name, type, status, lat, lng, target_count, current_count, description, tree_species, organizer_contact, volunteer_count)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Chrea National Park', 'planting', 'in-progress', 36.4424, 2.8695, 5000, 1200, 'Reforestation of cedar forests destroyed by wildfires.', 'Cedrus atlantica', 'Fatima Ouali — fatima.ouali@greenalgeria.dz', 42),
  ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Tlemcen National Park', 'planting', 'planned', 34.8386, -1.2939, 3000, 0, 'Restoring Mediterranean pine and oak ecosystems.', 'Pinus halepensis', NULL, 0),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'El Kala National Park', 'planting', 'completed', 36.8794, 8.4389, 8000, 8000, 'Completed cork oak and wetland reforestation.', 'Quercus suber', NULL, 155),
  ('d4e5f6a7-b8c9-0123-defa-234567890123', 'Bejaia Coast Cleanup', 'trash', 'in-progress', 36.7509, 5.0859, NULL, NULL, 'Beach and coastal trash collection point.', NULL, 'Karim Bensaid — karim.bensaid@greenalgeria.dz', 28),
  ('e5f6a7b8-c9d0-1234-efab-345678901234', 'Oran Bay Cleanup', 'trash', 'planned', 35.7043, -0.6401, NULL, NULL, 'Organized cleanup of Oran coastline.', NULL, NULL, 0),
  ('f6a7b8c9-d0e1-2345-fabc-456789012345', 'Djurdjura Cleanup', 'cleanup', 'in-progress', 36.4333, 4.25, NULL, NULL, 'Mountain trail cleanup and maintenance.', NULL, NULL, 15),
  ('a7b8c9d0-e1f2-3456-abcd-567890123456', 'Hoggar Mountains Planting', 'planting', 'planned', 23.2872, 5.6358, 2000, 0, 'Acacia and drought-resistant tree planting in the Sahara.', 'Acacia tortilis', NULL, 0),
  ('b8c9d0e1-f2a3-4567-bcde-678901234567', 'Mila Olive Grove', 'planting', 'in-progress', 36.4514, 6.2644, 1500, 600, 'Community olive tree planting project.', 'Olea europaea', NULL, 8),
  ('c9d0e1f2-a3b4-5678-cdef-789012345678', 'Annaba Dunes Cleanup', 'trash', 'completed', 36.9139, 7.7639, NULL, NULL, 'Completed dune and beach cleanup operation.', NULL, NULL, 0),
  ('d0e1f2a3-b4c5-6789-defa-890123456789', 'Tizi Ouzou Reforestation', 'planting', 'in-progress', 36.7167, 4.05, 4000, 1500, 'Mixed oak and pine reforestation in Kabylie region.', 'Quercus suber', 'Said Amrani — said.amrani@greenalgeria.dz', 22)
ON CONFLICT (id) DO NOTHING;
