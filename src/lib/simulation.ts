export type SimulationRole = "candidate" | "admin";
export const simulationIdentity = (role: SimulationRole) => role === "admin"
  ? { name: "Jesse Node", email: "jessejnode85@gmail.com" }
  : { name: "Jesse Harris", email: "jesseharrisode@gmail.com" };
export const setupSteps = ["Your profile", "CV assessment", "Career preferences", "Ready to match"] as const;
export function nextSetupStep(step: number) { return Math.min(3, step + 1); }
export function simulationViews(role: SimulationRole) {
  return role === "admin" ? ["dashboard", "topics", "hr", "mandates", "candidates", "messages", "bookings", "enquiries", "campaigns", "calendar", "analytics", "processing", "operations", "settings"] : ["dashboard", "cv", "matches", "messages", "topics", "settings"];
}
export const simulationStages = ["Matched", "Screening", "Shortlisted", "Interviewing", "Offered", "Placed", "Rejected"] as const;
export function simulateMandateStatus(status: string, action: "close" | "fill" | "reopen") {
  return action === "reopen" ? "open" : action === "fill" ? "filled" : status === "filled" ? "filled" : "closed";
}
export const sampleTopics = [
  { id: "rights", title: "Your rights at work", category: "Employment law", duration: "4:20", video: true, body: "A sample overview of contracts, working time and workplace rights. Guidance depends on your circumstances; consult a qualified adviser for individual advice." },
  { id: "interview", title: "Preparing for your interview", category: "Career development", duration: "3:45", video: true, body: "Prepare examples of your achievements, research the employer and consider the questions you want to ask. Use the STAR structure to explain your contribution." },
  { id: "relocation", title: "Planning an international move", category: "International recruitment", duration: "5:10", video: true, body: "Consider visa eligibility, employment terms and relocation arrangements before accepting an international role. Requirements vary by destination." },
  { id: "cv", title: "Making your CV clearer", category: "Career development", duration: "Article", video: false, body: "Use clear headings, include employment dates and quantify your outcomes. Keep relevant skills prominent and remove unnecessary personal information." },
] as const;