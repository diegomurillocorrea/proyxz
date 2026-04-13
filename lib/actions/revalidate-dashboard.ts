import { revalidatePath } from "next/cache";

export function revalidateAllDashboard() {
  revalidatePath("/dashboard", "layout");
}
