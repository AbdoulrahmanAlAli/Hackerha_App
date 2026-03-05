import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { SocialService } from "../services/social.service";
import {
  createSocialSchema,
  updateSocialSchema,
} from "../schemas/social.schema";
import { badRequest } from "../../../core/errors/httpErrors";
import { zodFirstMessage } from "../../../core/http/zodMessage";

class SocialController {
  // POST /api/hackit/ctrl/social
  createSocial = asyncHandler(async (req: Request, res: Response) => {
    // Zod validation
    let parsed: any;
    try {
      parsed = createSocialSchema.parse(req.body);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const result = await SocialService.createSocial(parsed);
    res.status(201).json(result);
  });

  // GET /api/hackit/ctrl/social/:id
  getSocialById = asyncHandler(async (req: Request, res: Response) => {
    const social = await SocialService.getSocialById(req.params.id);
    res.status(200).json(social);
  });

  // GET /api/hackit/ctrl/social
  getAllSocial = asyncHandler(async (req: Request, res: Response) => {
    const result = await SocialService.getAllSocial();
    res.status(200).json(result);
  });

  // PUT /api/hackit/ctrl/social/:id
  updateSocial = asyncHandler(async (req: Request, res: Response) => {
    // Zod validation
    let parsed: any;
    try {
      parsed = updateSocialSchema.parse(req.body);
    } catch (e) {
      throw badRequest(zodFirstMessage(e));
    }

    const result = await SocialService.updateSocial(req.params.id, parsed);
    res.status(200).json(result);
  });

  // DELETE /api/hackit/ctrl/social/:id
  deleteSocial = asyncHandler(async (req: Request, res: Response) => {
    const result = await SocialService.deleteSocial(req.params.id);
    res.status(200).json(result);
  });
}

export const socialController = new SocialController();
