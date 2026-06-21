import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/profile-form";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard/profile");
  }

  // Fetch full user profile details from the database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      headline: true,
      bio: true,
      image: true,
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-850 dark:text-slate-100">
          Profile Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 dark:text-slate-400">
          Customize your public display name, professional bio details, and avatar image
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-850 dark:bg-slate-900">
        <ProfileForm initialData={user} />
      </div>

    </div>
  );
}
