import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ClientsView } from "@/components/clients/clients-view";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const session = await auth();

  const clients = await db.client.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });

  return (
    <ClientsView
      clients={clients.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        notes: c.notes,
        projectCount: c._count.projects,
      }))}
    />
  );
}
