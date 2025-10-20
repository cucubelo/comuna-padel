import OptimizedGroupDetails from "@/components/dashboard/OptimizedGroupDetails";
import { getGroupIdFromSlug } from "@/lib/utils/groupService";
import { notFound } from "next/navigation";

interface GroupPageProps {
  params: Promise<{ slug: string }>;
}

export default async function GroupPage({ params }: GroupPageProps) {
  const { slug } = await params;
  
  // Obtener el ID real del grupo usando solo el slug
  const groupId = await getGroupIdFromSlug(slug);
  
  if (!groupId) {
    notFound();
  }

  return <OptimizedGroupDetails groupId={groupId} />;
}