import { Router } from "express";
import { Medicine } from "../models/Medicine.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { getDaysRemaining, computeStatus } from "../lib/medicineUtils.js";
import { genAI, GEMINI_MODEL } from "../lib/gemini.js";

const router = Router();
router.use(requireAuth);

const MEDICINE_TYPES = ["Tablet", "Capsule", "Syrup", "Injection", "Softgel", "Cream", "Drops", "Inhaler", "Patch"];

function withComputed(med: any) {
  const json = med.toJSON ? med.toJSON() : med;
  const days = getDaysRemaining(json.expiryDate);
  return { ...json, daysRemaining: days, status: computeStatus(days) };
}

router.post("/", async (req: AuthedRequest, res) => {
  const { name, expiryDate, source, ...rest } = req.body ?? {};
  if (!name || !expiryDate) {
    return res.status(400).json({ success: false, error: "Medicine name and expiry date are required." });
  }
  const med = await Medicine.create({
    ...rest,
    name,
    expiryDate,
    source: source === "scan" ? "scan" : "manual",
    userId: req.userId,
  });
  res.json({ success: true, data: withComputed(med) });
});

router.post("/scan", async (req: AuthedRequest, res) => {
  const { imageData, mimeType } = req.body ?? {};
  if (!imageData) {
    return res.status(400).json({ success: false, error: "An image is required." });
  }

  try {
    const prompt = `Look at this photo of a medicine box, strip, or label and extract its details as JSON only — no other text, no markdown code fences. Use exactly this shape:
{
  "name": string,
  "genericName": string,
  "type": one of ${JSON.stringify(MEDICINE_TYPES)},
  "strength": string (e.g. "500mg"),
  "dosage": string (usage instructions printed on the pack, if any),
  "quantity": number or null (count of tablets/capsules/units in the pack, if visible),
  "unit": string (e.g. "Tablets", "Capsules", "mL"),
  "batchNumber": string,
  "manufacturingDate": string in YYYY-MM-DD format, or "" if not visible,
  "expiryDate": string in YYYY-MM-DD format, or "" if not visible,
  "prescriptionRequired": boolean (true if it's a prescription-only / Schedule H style medicine)
}
Only fill a field if you can actually read it on the pack. If a field isn't visible or you're not confident, use an empty string (or null for quantity) — do NOT guess or invent values. Return ONLY the JSON object.`;

    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType || "image/jpeg",
                data: imageData,
              },
            },
          ],
        },
      ],
    });

    const raw = response.text ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error("[medicine scan] failed:", err);
    res.status(500).json({ success: false, error: "Couldn't read that image. Please try another photo or fill the form manually." });
  }
});

router.get("/stats", async (req: AuthedRequest, res) => {
  const meds = await Medicine.find({ userId: req.userId });
  const computed = meds.map(withComputed);
  res.json({
    success: true,
    data: {
      total: computed.length,
      safe: computed.filter((m) => m.status === "safe").length,
      expiringSoon: computed.filter((m) => m.status === "expiring-soon").length,
      expired: computed.filter((m) => m.status === "expired").length,
      refillNeeded: computed.filter((m) => m.quantity <= m.refillThreshold).length,
    },
  });
});

router.get("/", async (req: AuthedRequest, res) => {
  const meds = await Medicine.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, data: meds.map(withComputed) });
});

router.get("/:id", async (req: AuthedRequest, res) => {
  const med = await Medicine.findOne({ _id: req.params.id, userId: req.userId });
  if (!med) return res.status(404).json({ success: false, error: "Medicine not found." });
  res.json({ success: true, data: withComputed(med) });
});

router.patch("/:id", async (req: AuthedRequest, res) => {
  const med = await Medicine.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: req.body ?? {} },
    { new: true }
  );
  if (!med) return res.status(404).json({ success: false, error: "Medicine not found." });
  res.json({ success: true, data: withComputed(med) });
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const med = await Medicine.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!med) return res.status(404).json({ success: false, error: "Medicine not found." });
  res.json({ success: true, data: null });
});

export default router;