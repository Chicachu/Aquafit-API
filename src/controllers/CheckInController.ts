import { body, param, validationResult } from "express-validator";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import AppError from "../types/AppError";
import { employeeCheckInCollection } from "../models/employee-checkin/employee-checkin.class";
import { usersService } from "../services/UsersService";
import { Role } from "../types/enums/Role";
import { CheckInType } from "../types/EmployeeCheckIn";
import i18n from "../../config/i18n";

const EMPLOYEE_ID_6_DIGIT = /^\d{6}$/;

class CheckInController {
  createEntry = [
    body("employeeId")
      .custom((v: unknown) => {
        if (v == null || v === "") return Promise.reject(new Error("required"));
        if (typeof v === "number") {
          return EMPLOYEE_ID_6_DIGIT.test(String(v)) ? true : Promise.reject(new Error("invalid"));
        }
        if (typeof v === "string") {
          const t = String(v).trim();
          return t.length > 0 ? true : Promise.reject(new Error("required"));
        }
        return Promise.reject(new Error("invalid"));
      }),
    body("type").isString().isIn([CheckInType.CHECK_IN, CheckInType.CHECK_OUT]),
    body("date").isISO8601(),
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

      const loggedInUserId = res.locals.loggedInUser as string;
      let { employeeId, type, date } = req.body;

      if (typeof employeeId === "string") employeeId = employeeId.trim();
      const is6Digit =
        (typeof employeeId === "number" && EMPLOYEE_ID_6_DIGIT.test(String(employeeId))) ||
        (typeof employeeId === "string" && EMPLOYEE_ID_6_DIGIT.test(employeeId));
      const userIdForEntry: string = is6Digit
        ? (await usersService.getUserByEmployeeId(parseInt(String(employeeId), 10)))?._id ?? ""
        : String(employeeId);
      if (!userIdForEntry) {
        res.status(400).json({
          message: i18n.__("errors.missingParameters"),
          validationErrors: [{ path: "employeeId", msg: "User not found for 6-digit employee ID" }],
        });
        return;
      }

      const loggedInUser = await usersService.getUserById(loggedInUserId);
      if (!loggedInUser) {
        throw new AppError("errors.notLoggedInAccessDenied", 401);
      }

      const isAdmin = loggedInUser.role === Role.ADMIN;
      const isOwnEntry = userIdForEntry === loggedInUserId;
      if (!isAdmin && !isOwnEntry) {
        throw new AppError("errors.accessDenied", 403);
      }

      const checkInDate = new Date(date);
      const checkInType = type as CheckInType;

      // Validation: Check-in cannot be duplicated if there's an open check-in
      if (checkInType === CheckInType.CHECK_IN) {
        const openCheckIn = await employeeCheckInCollection.getOpenCheckInBeforeDate(
          userIdForEntry,
          checkInDate
        );
        
        if (openCheckIn) {
          res.status(400).json({
            message: i18n.__("errors.missingParameters"),
            validationErrors: [
              {
                path: "type",
                msg: `Cannot create check-in: there is an open check-in from ${openCheckIn.date.toISOString()} that has not been closed with a check-out`,
              },
            ],
          });
          return;
        }
      }

      // Validation: Check-out can only happen if there's an open check-in
      if (checkInType === CheckInType.CHECK_OUT) {
        const hasOpenCheckIn = await employeeCheckInCollection.hasOpenCheckIn(userIdForEntry);
        
        if (!hasOpenCheckIn) {
          res.status(400).json({
            message: i18n.__("errors.missingParameters"),
            validationErrors: [
              {
                path: "type",
                msg: "Cannot create check-out: there is no open check-in. A check-out requires a matching check-in.",
              },
            ],
          });
          return;
        }
      }

      const entry = await employeeCheckInCollection.create({
        employeeId: userIdForEntry,
        type: checkInType,
        date: checkInDate,
      });

      res.status(201).send(entry);
    }),
  ];

  getMyEntries = asyncHandler(async (req: Request, res: Response) => {
    const loggedInUserId = res.locals.loggedInUser as string;
    const entries = await employeeCheckInCollection.getAllEntriesForEmployee(loggedInUserId);
    res.send(entries);
  });

  /** Admin-only: get check-in entries for an employee by 6-digit ID or user _id. */
  getEntriesByEmployeeId = [
    param("employeeId").isString().notEmpty().trim(),
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

      const loggedInUserId = res.locals.loggedInUser as string;
      const loggedInUser = await usersService.getUserById(loggedInUserId);
      if (!loggedInUser || loggedInUser.role !== Role.ADMIN) {
        throw new AppError("errors.accessDenied", 403);
      }

      let employeeId = (req.params.employeeId as string).trim();
      const is6Digit = EMPLOYEE_ID_6_DIGIT.test(employeeId);
      const userId = is6Digit
        ? (await usersService.getUserByEmployeeId(parseInt(employeeId, 10)))?._id
        : employeeId;
      if (!userId) {
        res.status(404).json({
          message: i18n.__("errors.missingParameters"),
          validationErrors: [{ path: "employeeId", msg: "User not found for employee ID" }],
        });
        return;
      }

      const entries = await employeeCheckInCollection.getAllEntriesForEmployee(userId);
      res.send(entries);
    }),
  ];
}

const checkInController = new CheckInController();
export { checkInController, CheckInController };
