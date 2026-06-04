import { supabase } from "./supabase";
import type { User } from "./types";

export async function verifyUserSession(
  parsedUser: User,
  onFail: () => void,
  onSuccess: (updatedUser: User) => void
) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*, role:roles(*), department:departments(*)")
      .eq("id", parsedUser.id)
      .single();

    if (error || !data) {
      localStorage.removeItem("rohiser_user");
      onFail();
      return;
    }

    const updatedUser = {
      ...data,
      role: Array.isArray(data.role) ? data.role[0] : data.role,
      department: Array.isArray(data.department) ? data.department[0] : data.department,
    };

    localStorage.setItem("rohiser_user", JSON.stringify(updatedUser));
    onSuccess(updatedUser as User);
  } catch (err) {
    console.error("Session verification failed", err);
    // If network fails, we might not want to forcefully logout, so we just use parsedUser
    onSuccess(parsedUser);
  }
}
