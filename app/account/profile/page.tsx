import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { ProfileSettings } from "@/components/account/profile-settings";
export default async function ProfilePage() {
  const session=await getServerSession(authOptions);
  if(session?.user?.role!=="customer")redirect("/account/login");
  return <ProfileSettings/>;
}
