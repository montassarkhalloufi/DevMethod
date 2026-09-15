CREATE TABLE equipment (id text PRIMARY KEY, capacity integer NOT NULL CHECK (capacity >= 0));
CREATE TABLE reservations (id text PRIMARY KEY, equipment_id text REFERENCES equipment(id));
-- Current application executes these as separate statements:
-- SELECT capacity FROM equipment WHERE id = $1;
-- If capacity > 0: INSERT INTO reservations VALUES ($2, $1);
-- UPDATE equipment SET capacity = capacity - 1 WHERE id = $1;
