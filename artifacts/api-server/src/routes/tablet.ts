import { Router, type IRouter } from "express";
import { IdentifyTabletBody, IdentifyTabletResponse } from "@workspace/api-zod";
import { getCurrentUser } from "../lib/session";

const router: IRouter = Router();

router.post("/tablet/identify", async (req, res) => {
  const user = await getCurrentUser(req);
  const body = IdentifyTabletBody.safeParse(req.body);
  if (!user) {
    res.status(401).json({ error: "You are not signed in." });
    return;
  }
  if (!body.success || !body.data.imageData.startsWith("data:image/")) {
    res.status(400).json({ error: "Upload a valid image to run the demo." });
    return;
  }
  res.json(IdentifyTabletResponse.parse({
    label: "Demo round tablet sample",
    confidence: 87,
    isDemo: true,
    disclaimer: "Prototype / Demo Identification. This is not a reliable medicine identifier and does not provide medical advice.",
  }));
});

export default router;