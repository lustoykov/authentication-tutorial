import GoogleLoginDemo from "./GoogleLoginDemo";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function GoogleLoginPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser();


  return <GoogleLoginDemo user={user} />;
}