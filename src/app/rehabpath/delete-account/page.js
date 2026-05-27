import { redirect } from "next/navigation";

export const metadata = {
  title: "RehabPath – Delete Account or Data",
};

export default function RehabPathDeleteAccountRedirectPage() {
  redirect("/apps/rehabpath/delete-account");
}
