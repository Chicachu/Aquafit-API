import { body, param, validationResult } from "express-validator";
import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import AppError from "../types/AppError";
import { employeeCheckInCollection } from "../models/employee-checkin/employee-checkin.class";
import { usersService } from "../services/UsersService";
import { Role } from "../types/enums/Role";
import { CheckInType } from "../types/EmployeeCheckIn";
import {
  CheckInValidationCode,
  validateCheckInEntry,
} from "../business/checkInValidation";
import { createOrUpdatePayableForMonth } from "../services/EmployeePayableService";
import { logger } from "../services/LoggingService";
import i18n from "../../config/i18n";

const EMPLOYEE_ID_6_DIGIT = /^\d{6}$/;

function canManageEmployeeCheckIns(role: Role): boolean {
  return role === Role.ADMIN || role === Role.MANAGER || role === Role.RECEPTIONIST;
}

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

      const canManageOthers = canManageEmployeeCheckIns(loggedInUser.role);
      const isOwnEntry = userIdForEntry === loggedInUserId;
      if (!canManageOthers && !isOwnEntry) {
        throw new AppError("errors.accessDenied", 403);
      }

      const checkInDate = new Date(date);
      const checkInType = type as CheckInType;
      const existingEntries = await employeeCheckInCollection.getAllEntriesForEmployee(userIdForEntry);
      const validation = validateCheckInEntry(existingEntries, checkInType, checkInDate);

      if (!validation.valid) {
        const messageKey = _checkInValidationMessageKey(validation.code);
        res.status(400).json({
          message: i18n.__(messageKey),
          validationErrors: [
            {
              path: "type",
              msg: i18n.__(messageKey),
            },
          ],
        });
        return;
      }

      const entry = await employeeCheckInCollection.create({
        employeeId: userIdForEntry,
        type: checkInType,
        date: checkInDate,
      });

      if (checkInType === CheckInType.CHECK_OUT) {
        try {
          await createOrUpdatePayableForMonth(
            userIdForEntry,
            checkInDate.getFullYear(),
            checkInDate.getMonth()
          );
        } catch (error: any) {
          logger.error(
            `createEntry: failed to update payable after check-out for ${userIdForEntry}: ${error?.message || error}`
          );
        }
      }

      res.status(201).send(entry);
    }),
  ];

  getMyEntries = asyncHandler(async (req: Request, res: Response) => {
    const loggedInUserId = res.locals.loggedInUser as string;
    const entries = await employeeCheckInCollection.getAllEntriesForEmployee(loggedInUserId);
    res.send(entries);
  });

  /** Admin, manager, or receptionist: get check-in entries for an employee by 6-digit ID or user _id. */
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
      if (!loggedInUser || !canManageEmployeeCheckIns(loggedInUser.role)) {
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

function _checkInValidationMessageKey(code?: CheckInValidationCode): string {
  switch (code) {
    case CheckInValidationCode.OPEN_CHECK_IN:
      return "errors.checkInOpenSession";
    case CheckInValidationCode.COOLDOWN_AFTER_CHECK_OUT:
      return "errors.checkInCooldownAfterCheckOut";
    case CheckInValidationCode.NO_OPEN_CHECK_IN:
      return "errors.checkOutNoOpenCheckIn";
    case CheckInValidationCode.COOLDOWN_AFTER_CHECK_IN:
      return "errors.checkOutCooldownAfterCheckIn";
    default:
      return "errors.missingParameters";
  }
}

const checkInController = new CheckInController();
export { checkInController, CheckInController };
