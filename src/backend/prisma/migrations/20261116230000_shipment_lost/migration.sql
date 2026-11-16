-- A shipment that never arrives can be ended as lost by a manager (N-027, owner decision 10).
-- Adds one value to the list of shipment states. No row is changed.
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'LOST';
