export function getDeviceType(): "phone" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
    ? "phone"
    : "desktop";
}
