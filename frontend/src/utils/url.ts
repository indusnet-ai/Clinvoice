
import queryString from "query-string";
import isEmpty from "lodash/isEmpty";

/**
 * Returns the first error message from an API response.
 */
export const parseInputErrors = (error: Array<{ param: string; msg: string }>): string | undefined => {
  if (!error || !Array.isArray(error) || error.length === 0) return;
  const { param, msg } = error[0];
  return `${param.toUpperCase()}: ${msg}`;
};

/**
 * Appends query parameters to a URL.
 */
export const applyQueryParams = (url: string, params: Record<string, any> = {}): string => {
  if (isEmpty(params)) return url;
  const queryParams = queryString.stringify(params);
  return `${url}?${queryParams}`;
};

/**
 * Parses a query string into an object.
 */
export const parseQueryStrings = (qs: string): Record<string, any> => {
  return queryString.parse(qs);
};

/**
 * Builds a custom query string from parameters with filtering logic.
 */
export const buildQueryString = (params: Record<string, any>): string | null => {
  if (!params) return null;

  const newParams: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return;

    if (key === "q" && value !== "") {
      newParams.push(`q=${value}`);
    } else if (["page", "perPage"].includes(key)) {
      newParams.push(`${key}=${value}`);
    } else if (key !== "q") {
      newParams.push(`filter[${key}]=${value}`);
    }
  });

  return newParams.length ? `?${newParams.join("&")}` : null;
};
