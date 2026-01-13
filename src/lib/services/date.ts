import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export async function dateToISO(dateStr: string): Promise<string> {
  const date = dayjs(dateStr, "DD/MM/YYYY");

  if (!date.isValid()) {
    throw new Error("Invalid date format");
  }

  return date.toISOString();
}
