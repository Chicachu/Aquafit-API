import { ClassType } from "./enums/ClassType";

export type ClassScheduleMap = Partial<Record<ClassType, Record<string, Record<string, string>>>>