import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// Callback de autenticación por email (confirmación de cuenta y magic links).
// Supabase manda al usuario acá tras tocar el link del mail. Soportamos los dos
// formatos: `?code=` (PKCE) y `?token_hash=&type=` (OTP de email). Si algo sale
// mal, lo mandamos a /login con un aviso en vez de dejarlo en una página cruda.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  return NextResponse.redirect(
    new URL("/login?error=No%20pudimos%20confirmar%20el%20link", origin)
  );
}
