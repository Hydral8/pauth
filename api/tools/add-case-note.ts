import { addCaseNote } from "../../backend/toolsService";
import type { AddCaseNoteRequest } from "../../src/types/api";

export const config = {
  runtime: "nodejs"
};

export default async function handler(
  request: { body: AddCaseNoteRequest },
  response: { status: (code: number) => { json: (body: unknown) => void } }
) {
  response.status(200).json(await addCaseNote(request.body));
}
