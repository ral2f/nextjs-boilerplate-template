import { redirect } from "next/navigation";

/**
 * Root page – redirects to the fasting dashboard.
 */
export default function Home() {
  redirect("/fasting");
}
