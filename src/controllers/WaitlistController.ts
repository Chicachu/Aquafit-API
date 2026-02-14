import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import AppError from "../types/AppError";
import { waitlistCollection } from "../models/waitlist/waitlist.class";
import { usersService } from "../services/UsersService";
import { Role } from "../types/enums/Role";
import i18n from "../../config/i18n";

class WaitlistController {
  addWaitlistEntry = [
    body("classId").isString().trim().notEmpty(),
    body("firstName").isString().trim().notEmpty(),
    body("lastName").isString().trim().notEmpty(),
    body("phoneNumber").isString().trim().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errs = errors.array().map((e) => {
          const x = e as { path?: string; msg?: string };
          return { path: x.path ?? "?", msg: x.msg ?? "invalid" };
        });
        res.status(400).json({
          message: i18n.__("errors.missingParameters"),
          validationErrors: errs,
        });
        return;
      }

      const { classId, firstName, lastName, phoneNumber } = req.body;

      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const trimmedPhone = phoneNumber.trim();

      // Use existing user if one matches first and last name; otherwise create new user
      let userId: string;
      const existingUser = await usersService.findUserByFirstAndLastName(trimmedFirst, trimmedLast);
      if (existingUser) {
        userId = existingUser._id;
        const existingPhone = (existingUser.phoneNumber ?? "").trim();
        if (existingPhone !== trimmedPhone) {
          await usersService.updateUserInfo(existingUser, { phoneNumber: trimmedPhone });
        }
      } else {
        const newUser = await usersService.createNewUser({
          firstName: trimmedFirst,
          lastName: trimmedLast,
          phoneNumber: trimmedPhone,
          role: Role.CLIENT
        });
        userId = newUser._id;
      }

      const trimmedClassId = classId.trim();

      // If user is already on this class's waitlist, return existing entry (no duplicate)
      const existingEntry = await waitlistCollection.findOneByUserAndClass(userId, trimmedClassId);
      if (existingEntry) {
        res.status(200).send(existingEntry);
        return;
      }

      // Create waitlist entry (association between user and class)
      const entry = await waitlistCollection.addWaitlistEntry(userId, trimmedClassId);

      res.status(201).send(entry);
    }),
  ];

  getAllWaitlistEntries = asyncHandler(async (req: Request, res: Response) => {
    const entries = await waitlistCollection.getAllWaitlistEntries();
    // Sort by createdAt (dateCreated) ascending (oldest first)
    // MongoDB timestamps are stored as createdAt and updatedAt
    const sortedEntries = entries.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateA - dateB;
    });
    res.send(sortedEntries);
  });

  removeWaitlistEntry = [
    body("waitlistId").isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          message: i18n.__("errors.missingParameters"),
          validationErrors: errors.array().map((e) => {
            const x = e as { path?: string; msg?: string };
            return { path: x.path ?? "?", msg: x.msg ?? "invalid" };
          }),
        });
        return;
      }

      const { waitlistId } = req.body;
      await waitlistCollection.removeWaitlistEntry(waitlistId);
      res.status(200).send({ message: "Waitlist entry removed successfully" });
    }),
  ];
}

const waitlistController = new WaitlistController();
export { waitlistController, WaitlistController };
