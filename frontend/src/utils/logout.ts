// utils/logout.ts
export const forceLogout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("email");

  // hard redirect (works even outside React)
  window.location.href = "/auth/signin";
};
