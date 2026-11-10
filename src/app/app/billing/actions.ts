"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { cancelSubscription, findSubscriptions } from "@/lib/cloudpayments";

export async function cancelAutopay() {
  const user = await requireUser();
  const subs = await findSubscriptions(user.email);
  for (const s of subs.filter((s) => s.Status === "Active")) await cancelSubscription(s.Id);
  revalidatePath("/app/billing");
}
