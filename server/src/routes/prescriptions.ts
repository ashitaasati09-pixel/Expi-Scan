import { Router } from "express";
import { Prescription } from "../models/Prescription.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { genAI, GEMINI_MODEL } from "../lib/gemini.js";

const router = Router();
router.use(requireAuth);

router.post("/", async (req: AuthedRequest, res) => {
  const { fileName, fileType, mimeType, fileData } = req.body ?? {};
  if (!fileName || !fileType || !fileData) {
    return res.status(400).json({ success: false, error: "File name, type, and data are required." });
  }
  const px = await Prescription.create({
    userId: req.userId,
    fileName,
    fileType,
    mimeType: mimeType || (fileType === "pdf" ? "application/pdf" : "image/jpeg"),
    fileData,
    processingStatus: "processing",
  });
  res.json({ success: true, data: px.toJSON() });
});

router.get("/", async (req: AuthedRequest, res) => {
  const list = await Prescription.find({ userId: req.userId }).sort({ createdAt: -1 });
  res.json({ success: true, data: list.map((p) => p.toJSON()) });
});

router.get("/:id", async (req: AuthedRequest, res) => {
  const px = await Prescription.findOne({ _id: req.params.id, userId: req.userId });
  if (!px) return res.status(404).json({ success: false, error: "Prescription not found." });
  res.json({ success: true, data: px.toJSON() });
});

router.get("/:id/file", async (req: AuthedRequest, res) => {
  const px = await Prescription.findOne({ _id: req.params.id, userId: req.userId }).select("+fileData");
  if (!px) return res.status(404).send("Not found");
  const buffer = Buffer.from(px.fileData, "base64");
  res.setHeader("Content-Type", px.mimeType || (px.fileType === "pdf" ? "application/pdf" : "image/jpeg"));
  res.send(buffer);
});

router.post("/:id/extract", async (req: AuthedRequest, res) => {
  const px = await Prescription.findOne({ _id: req.params.id, userId: req.userId }).select("+fileData");
  if (!px) return res.status(404).json({ success: false, error: "Prescription not found." });

  try {
    const prompt = `Read this prescription and extract the information as JSON only — no other text, no markdown code fences. Use exactly this shape:
{
  "doctorName": string,
  "clinicName": string,
  "prescriptionDate": string (YYYY-MM-DD format),
  "extractedMedicines": [
    { "name": string, "dosage": string, "frequency": string, "duration": string, "quantity": number, "confidence": number between 0 and 1 }
  ]
}
If a field isn't visible, use an empty string, empty array, or a reasonable estimate for quantity/confidence. Return ONLY the JSON object.`;

    const response = await genAI.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: px.mimeType || (px.fileType === "pdf" ? "application/pdf" : "image/jpeg"),
                data: px.fileData,
              },
            },
          ],
        },
      ],
    });

    const raw = response.text ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    px.doctorName = parsed.doctorName ?? "";
    px.clinicName = parsed.clinicName ?? "";
    px.prescriptionDate = parsed.prescriptionDate ?? "";
    px.extractedMedicines = Array.isArray(parsed.extractedMedicines) ? parsed.extractedMedicines : [];
    px.processingStatus = "processed";
    await px.save();

    res.json({ success: true, data: px.toJSON() });
  } catch (err) {
    console.error("[extract] failed:", err);
    px.processingStatus = "failed";
    await px.save();
    res.status(500).json({ success: false, error: "Failed to extract prescription data. Please try again." });
  }
});

router.patch("/:id", async (req: AuthedRequest, res) => {
  const { doctorName, clinicName, prescriptionDate, extractedMedicines, processingStatus } = req.body ?? {};
  const px = await Prescription.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { $set: { doctorName, clinicName, prescriptionDate, extractedMedicines, processingStatus } },
    { new: true }
  );
  if (!px) return res.status(404).json({ success: false, error: "Prescription not found." });
  res.json({ success: true, data: px.toJSON() });
});

router.delete("/:id", async (req: AuthedRequest, res) => {
  const px = await Prescription.findOneAndDelete({ _id: req.params.id, userId: req.userId });
  if (!px) return res.status(404).json({ success: false, error: "Prescription not found." });
  res.json({ success: true, data: null });
});

export default router;