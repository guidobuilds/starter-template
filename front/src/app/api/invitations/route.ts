import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "Not authenticated" }, { status: 401 })
  }

  const invitations = await prisma.workspaceInvitation.findMany({
    where: { email: session.user.email, status: "PENDING" },
    include: {
      workspace: { select: { id: true, name: true } },
      invitedBy: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(invitations)
}
