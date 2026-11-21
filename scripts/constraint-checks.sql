-- Run after migrations and seed; each INSERT below is intentionally invalid.
-- Reservation statements use the seeded ADMIN's ID for the required user_id FK.
INSERT INTO buildings (name,address) VALUES ('Budynek A','duplikat');
INSERT INTO rooms (building_id,name,capacity) VALUES (1,'101',10);
INSERT INTO rooms (building_id,name,capacity) VALUES (1,'DEMO-CAPACITY',0);
INSERT INTO rooms (building_id,name,capacity) VALUES (999999,'DEMO-FK',10);
INSERT INTO reservations (room_id,user_id,participants,start_time,end_time,status) VALUES (1,(SELECT id FROM users WHERE role='ADMIN' LIMIT 1),1,'2050-01-01T10:00:00Z','2050-01-01T10:00:00Z','CONFIRMED');
INSERT INTO reservations (room_id,user_id,participants,start_time,end_time,status) VALUES (1,(SELECT id FROM users WHERE role='ADMIN' LIMIT 1),1,'2050-01-02T10:00:00Z','2050-01-02T11:00:00Z','PENDING');
INSERT INTO reservations (room_id,user_id,participants,start_time,end_time,status) VALUES (999999,(SELECT id FROM users WHERE role='ADMIN' LIMIT 1),1,'2050-01-03T10:00:00Z','2050-01-03T11:00:00Z','CONFIRMED');
INSERT INTO reservations (room_id,user_id,participants,start_time,end_time,status) VALUES (1,(SELECT id FROM users WHERE role='ADMIN' LIMIT 1),0,'2050-01-04T10:00:00Z','2050-01-04T11:00:00Z','CONFIRMED');
