// utils/auth.ts
// export const isAuthenticated = (): boolean => {
//   const token = localStorage.getItem("access_token");
//   return !!token;
// };

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem("access_token");
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // JWT exp is in seconds
    return Date.now() < exp;
  } catch {
    return false;
  }
};
