const { query } = require("../config/mysql");
const asyncHandler = require("../utils/asyncHandler");
const { normalizeTierName } = require("../utils/eventHelpers");

async function ensureEventOwnership(eventId, user) {
  const events = await query("SELECT club_id AS clubId FROM events WHERE id = ?", [eventId]);
  const event = events[0];

  if (!event) {
    return { error: "Event not found.", status: 404 };
  }

  if (user.role !== "admin" && event.clubId !== user.id) {
    return { error: "You can only manage tiers for your own events.", status: 403 };
  }

  return { event };
}

const addTier = asyncHandler(async (req, res) => {
  const eventId = Number(req.body.eventId);
  const name = normalizeTierName(req.body.name);
  const price = Number(req.body.price || 0);
  const benefits = String(req.body.benefits || "").trim();
  const deliverables = String(req.body.deliverables || "").trim();

  if (!eventId || !name || !price || !benefits || !deliverables) {
    return res.status(400).json({ message: "Valid tier details are required." });
  }

  const ownership = await ensureEventOwnership(eventId, req.user);
  if (ownership.error) {
    return res.status(ownership.status).json({ message: ownership.error });
  }

  const result = await query(
    "INSERT INTO tiers (event_id, name, price, benefits, deliverables) VALUES (?, ?, ?, ?, ?)",
    [eventId, name, price, benefits, deliverables]
  );

  const tiers = await query(
    `SELECT id, event_id AS eventId, name, price, benefits, deliverables
     FROM tiers
     WHERE id = ?`,
    [result.insertId]
  );

  return res.status(201).json({ message: "Tier added successfully.", tier: tiers[0] });
});

const updateTier = asyncHandler(async (req, res) => {
  const tierId = Number(req.params.id);
  const tiers = await query("SELECT * FROM tiers WHERE id = ?", [tierId]);
  const existingTier = tiers[0];

  if (!existingTier) {
    return res.status(404).json({ message: "Tier not found." });
  }

  const ownership = await ensureEventOwnership(existingTier.event_id, req.user);
  if (ownership.error) {
    return res.status(ownership.status).json({ message: ownership.error });
  }

  const updatedName = normalizeTierName(req.body.name) || existingTier.name;
  const updatedPrice = Number(req.body.price ?? existingTier.price);
  const updatedBenefits = req.body.benefits || existingTier.benefits;
  const updatedDeliverables = req.body.deliverables || existingTier.deliverables;

  await query(
    `UPDATE tiers
     SET name = ?, price = ?, benefits = ?, deliverables = ?
     WHERE id = ?`,
    [updatedName, updatedPrice, updatedBenefits, updatedDeliverables, tierId]
  );

  const updatedTiers = await query(
    `SELECT id, event_id AS eventId, name, price, benefits, deliverables
     FROM tiers
     WHERE id = ?`,
    [tierId]
  );

  return res.json({ message: "Tier updated successfully.", tier: updatedTiers[0] });
});

const deleteTier = asyncHandler(async (req, res) => {
  const tierId = Number(req.params.id);
  const tiers = await query("SELECT * FROM tiers WHERE id = ?", [tierId]);
  const existingTier = tiers[0];

  if (!existingTier) {
    return res.status(404).json({ message: "Tier not found." });
  }

  const ownership = await ensureEventOwnership(existingTier.event_id, req.user);
  if (ownership.error) {
    return res.status(ownership.status).json({ message: ownership.error });
  }

  await query("DELETE FROM tiers WHERE id = ?", [tierId]);
  return res.json({ message: "Tier deleted successfully." });
});

module.exports = {
  addTier,
  updateTier,
  deleteTier
};
