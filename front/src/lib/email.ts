import "server-only"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWorkspaceInvitation({
  to,
  inviterName,
  workspaceName,
  acceptUrl,
}: {
  to: string
  inviterName: string
  workspaceName: string
  acceptUrl: string
}) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "noreply@example.com",
    to,
    subject: `${inviterName} invited you to join ${workspaceName}`,
    html: `<p>${inviterName} has invited you to join <strong>${workspaceName}</strong>.</p>
           <p><a href="${acceptUrl}">Accept invitation</a></p>
           <p>This invitation expires in 7 days.</p>`,
  })
}
