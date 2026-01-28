import { body, validationResult } from "express-validator";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import AppError from "../types/AppError";
import { employeeCheckInCollection } from "../models/employee-checkin/employee-checkin.class";
import { usersService } from "../services/UsersService";
import { Role } from "../types/enums/Role";
import { CheckInType } from "../types/EmployeeCheckIn";

class CheckInController {
  createEntry = [
    body("employeeId").isString().notEmpty(),
    body("type").isString().isIn([CheckInType.CHECK_IN, CheckInType.CHECK_OUT]),
    body("date").isISO8601(),
    body("assignmentId").optional().isString(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("errors.missingParameters", 400);
      }

      const loggedInUserId = res.locals.loggedInUser as string;
      const { employeeId, type, date, assignmentId } = req.body;

      const loggedInUser = await usersService.getUserById(loggedInUserId);
      if (!loggedInUser) {
        throw new AppError("errors.notLoggedInAccessDenied", 401);
      }

      const isAdmin = loggedInUser.role === Role.ADMIN;
      const isOwnEntry = employeeId === loggedInUserId;
      if (!isAdmin && !isOwnEntry) {
        throw new AppError("errors.accessDenied", 403);
      }

      const entry = await employeeCheckInCollection.create({
        employeeId,
        type: type as CheckInType,
        date: new Date(date),
        assignmentId: assignmentId || null,
      });

      res.status(201).send(entry);
    }),
  ];

  getMyEntries = asyncHandler(async (req: Request, res: Response) => {
    const loggedInUserId = res.locals.loggedInUser as string;
    const entries = await employeeCheckInCollection.getAllEntriesForEmployee(loggedInUserId);
    res.send(entries);
  });
}

const checkInController = new CheckInController();
export { checkInController, CheckInController };
