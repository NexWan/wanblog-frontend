import { redirect } from "next/navigation";
import ProfileEditor from "@/components/profile/ProfileEditor";
import { getProfileByUsername } from "@/lib/profile-data.server";
import { getCurrentUserSub } from "@/lib/auth";

type EditProfilePageProps = {
  params: Promise<{ username: string }>;
};

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const { username } = await params;
  const [profile, currentSub] = await Promise.all([
    getProfileByUsername(username),
    getCurrentUserSub(),
  ]);

  if (!profile || !currentSub || currentSub !== profile.userId) {
    redirect("/");
  }

  return <ProfileEditor initialProfile={profile} currentUserId={currentSub} />;
}
