import { type NextRequest } from "next/server";
// Asıl motorumuz burada çalışıyor
import { updateSession } from "./utils/supabase/middleware";

// "default" kelimesini ekledik, sistem artık isyan etmeyecek!
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aşağıdakiler HARİÇ tüm yolları eşleştir (Bunlar Public/Herkese Açık):
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - fatura (YENİ: Fatura Linki - Herkese Açık)
     * - statement (Ekstre Linki - Herkese Açık)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)|fatura|statement).*)",
  ],
};