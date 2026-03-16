import { Router, Request, Response } from "express";
import { acceptInvite } from "../services/auth/inviteService.js";
import { createSession } from "../services/auth/sessionService.js";

const router = Router();

// Accept invite
router.post("/:token/accept", async (req: Request, res: Response) => {
  try {
    const { password, firstName, lastName } = req.body;
    if (!password || !firstName) {
      return res.status(400).json({ error: "Password and first name required" });
    }
    const user = await acceptInvite(req.params.token, password, firstName, lastName || "");
    const token = createSession(user.id, user.workspace_id);
    res.json({ user, token });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
