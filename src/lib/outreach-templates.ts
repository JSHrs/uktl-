// Client-safe outreach templates. Staff always review and edit the text before
// sending; placeholders are filled from the candidate record and chosen role.
export type OutreachTemplate = "role_intro" | "interview_invite" | "follow_up" | "not_progressing" | "custom";

export const OUTREACH_TEMPLATES: Record<OutreachTemplate, { label: string; needsRole: boolean; subject: string; body: string }> = {
  role_intro: {
    label: "Introduce a role",
    needsRole: true,
    subject: "A role that fits your profile: {role}",
    body:
      "Hello {first_name},\n\n" +
      "I'm {consultant} at UK Talent Link. Your profile is a strong match for a {role} position{company_clause} that we are recruiting for.\n\n" +
      "Would you like to hear more? Reply to this email and I'll share the details, or book a time to talk from your account:\n{consultations_link}\n\n" +
      "Kind regards,\n{consultant}\nUK Talent Link",
  },
  interview_invite: {
    label: "Invite to interview",
    needsRole: true,
    subject: "Interview invitation: {role}",
    body:
      "Hello {first_name},\n\n" +
      "Good news: we would like to arrange an interview for the {role} position{company_clause}.\n\n" +
      "Please reply with a few times that suit you over the next week, or book a preparation call here:\n{consultations_link}\n\n" +
      "Kind regards,\n{consultant}\nUK Talent Link",
  },
  follow_up: {
    label: "Follow up",
    needsRole: false,
    subject: "Following up from UK Talent Link",
    body:
      "Hello {first_name},\n\n" +
      "I wanted to follow up on your recent contact with UK Talent Link. Is there anything you need from us, or any update on your search we should know about?\n\n" +
      "You can keep your CV and preferences up to date here:\n{profile_link}\n\n" +
      "Kind regards,\n{consultant}\nUK Talent Link",
  },
  not_progressing: {
    label: "Not progressing",
    needsRole: true,
    subject: "Update on the {role} role",
    body:
      "Hello {first_name},\n\n" +
      "Thank you for your interest in the {role} position{company_clause}. On this occasion we won't be taking your application forward for this role.\n\n" +
      "Your profile stays active with us and we'll be in touch when a better-suited role comes up. Your latest matches are here:\n{matches_link}\n\n" +
      "Kind regards,\n{consultant}\nUK Talent Link",
  },
  custom: {
    label: "Write your own",
    needsRole: false,
    subject: "",
    body: "Hello {first_name},\n\n\n\nKind regards,\n{consultant}\nUK Talent Link",
  },
};

export function fillTemplate(
  text: string,
  v: { name: string | null; role?: string | null; company?: string | null; consultant: string; siteUrl: string },
) {
  const first = (v.name ?? "").trim().split(/\s+/)[0] || "there";
  const site = v.siteUrl.replace(/\/$/, "");
  return text
    .replaceAll("{first_name}", first)
    .replaceAll("{role}", v.role ?? "the role")
    .replaceAll("{company_clause}", v.company ? ` with ${v.company}` : "")
    .replaceAll("{consultant}", v.consultant)
    .replaceAll("{consultations_link}", `${site}/app/consultations`)
    .replaceAll("{profile_link}", `${site}/app/profile`)
    .replaceAll("{matches_link}", `${site}/app/discover`);
}
