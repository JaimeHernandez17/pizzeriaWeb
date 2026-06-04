export function getCsrfToken(): string {
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith("csrftoken="));
  if (!cookie) {
    return "";
  }
  return decodeURIComponent(cookie.split("=")[1] || "");
}
