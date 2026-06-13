import { redirect } from "next/navigation";

/** Staff app opens on the matters list */
export default function HomePage() {
  redirect("/matters");
}
