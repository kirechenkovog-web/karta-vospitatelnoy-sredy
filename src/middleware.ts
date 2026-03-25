export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/map/:path*", "/stage2/:path*", "/stage3/:path*", "/result/:path*"],
};
