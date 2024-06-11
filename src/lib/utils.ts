import { ZodError, ZodIssueCode } from "zod";
import type { ZodIssue } from "zod";
import type { ParsedTags, Tag } from "../types.js";


export const joinUrl = ({ url, path }: { url: string; path?: string }): string => {
  if (!path) return url;
  if (path.startsWith("/")) {
    path = path.slice(1);
  }
  const urlObj = new URL(url);
  urlObj.pathname = urlObj.pathname.replace(/\/$/, "") + "/" + path;
  return urlObj.toString();
};

/**
 * Parse tags into an object with key-value pairs of name -> values.
 *
 * If multiple tags with the same name exist, its value will be the array of tag values
 * in order of appearance.
 */
export function parseTags(rawTags: Tag[] = []): ParsedTags {
  // Reduce the rawTags array into an object
  const tagMap = rawTags.reduce<ParsedTags>((acc, tag) => {
    if (!acc[tag.name]) {
      acc[tag.name] = [];
    }
    acc[tag.name].push(tag.value);
    return acc;
  }, {});

  return Object.entries(tagMap).reduce<ParsedTags>((acc, [key, values]) => {
    acc[key] = values.length > 1 ? values : [values[0]];
    return acc;
  }, {});
}

/**
 * Removes tags from a list of tags based on a given name and an optional value,
 * then only remove tags whose name and value both match
 *
 * @param {Tag[]} tags - An array of Tag objects. Each Tag object represents a tag with name and value properties.
 * @param {{ name: string, value?: string }} criteria - An object containing the criteria for removing tags.
 * @param {string} criteria.name - The name of the tags to remove.
 * @param {string} [criteria.value] - An optional value. If specified, only tags with both the matching name and value are removed.
 * @returns {Tag[]} A new array of Tag objects with the tags matching the given criteria removed.
 */
export function removeTagsByNameMaybeValue(tags: Tag[], { name, value }: { name: string; value?: string }): Tag[] {
  return tags.filter((tag) => {
    if (tag.name !== name) {
      return true;
    }
    if (value !== undefined) {
      return tag.value !== value;
    }
    return false;
  });
}

export function eqOrIncludes(data: any, valToCheck: any): boolean {
  if (typeof data === "string") {
    return data === valToCheck;
  } else if (Array.isArray(data)) {
    return data.includes(valToCheck);
  } else {
    return false;
  }
}

export function trimSlash(text = ""): string {
  if (!text.endsWith("/")) return text;
  return trimSlash(text.slice(0, -1));
}

function isZodError(err: any): err is ZodError {
  return err instanceof ZodError;
}

/**
 * Transforms various types of error inputs into a standard `Error` object.
 *
 * @param {any} err - The error input which can be of various types.
 * @returns {Error} - A standardized `Error` object.
 *
 * @remarks
 * This function had a comment on it that it is here to ensure that the error stack trace is not inflated. It handles:
 * - Zod errors by mapping them and appending the original stack trace.
 * - Instances of `Error`.
 * - Objects with a `message` property.
 * - Strings as error messages.
 * - Any other type by creating a generic error message.
 *
 * @example
 * ```typescript
 * const zodError = new ZodError(...);
 * const standardError = errFrom(zodError);
 * console.error(standardError);
 * ```
 */
export function errFrom(err: any): Error {
  let e: Error;
  /**
   * Imperative to not inflate the stack trace
   */
  if (isZodError(err)) {
    e = new Error(mapZodErr(err));
    e.stack = (e.stack || "") + "\n" + (err.stack || "");
  } else if (err instanceof Error) {
    e = err;
  } else if (err && typeof err === "object" && "message" in err) {
    e = new Error((err as { message: string }).message);
  } else if (typeof err === "string") {
    e = new Error(err);
  } else {
    e = new Error("An error occurred");
  }

  return e;
}

function gatherZodIssues(zodErr: ZodError, status: number, contextCode: string): any[] {
  return zodErr.issues.reduce((issues: any[], issue: ZodIssue) => {
    switch (issue.code) {
      case ZodIssueCode.invalid_arguments:
        return issues.concat(gatherZodIssues(issue.argumentsError!, 422, "Invalid Arguments"));
      case ZodIssueCode.invalid_return_type:
        return issues.concat(gatherZodIssues(issue.returnTypeError!, 500, "Invalid Return"));
      case ZodIssueCode.invalid_union:
        return issues.concat(issue.unionErrors!.flatMap((i) => gatherZodIssues(i, 400, "Invalid Union")));
      default:
        return issues.concat({ ...issue, status, contextCode });
    }
  }, []);
}

export function mapZodErr(zodErr: ZodError): string {
  const zodIssues = gatherZodIssues(zodErr, 400, "");

  const summaries = zodIssues.reduce((acc: string[], zodIssue: any) => {
    const { message, path: _path, contextCode: _contextCode } = zodIssue;
    const path = _path[1] || _path[0];
    const contextCode = _contextCode ? `${_contextCode} ` : "";

    acc.push(`${contextCode}'${path}': ${message}.`);
    return acc;
  }, []);

  return summaries.join(" | ");
}
