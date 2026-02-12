function normalizeTierName(name) {
  const allowed = ["Bronze", "Silver", "Gold", "Platinum"];
  const match = allowed.find((item) => item.toLowerCase() === String(name || "").toLowerCase());
  return match || null;
}

function parseTiers(rawTiers) {
  if (!rawTiers) {
    return [];
  }

  const tiers = typeof rawTiers === "string" ? JSON.parse(rawTiers) : rawTiers;
  if (!Array.isArray(tiers)) {
    return [];
  }

  return tiers
    .map((tier) => ({
      name: normalizeTierName(tier.name),
      price: Number(tier.price || 0),
      benefits: String(tier.benefits || "").trim(),
      deliverables: String(tier.deliverables || "").trim()
    }))
    .filter((tier) => tier.name && tier.price > 0 && tier.benefits && tier.deliverables);
}

module.exports = {
  normalizeTierName,
  parseTiers
};

