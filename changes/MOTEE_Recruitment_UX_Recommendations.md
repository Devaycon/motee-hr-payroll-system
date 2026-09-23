# MOTEE — Recruitment UX Recommendations

**The brief:** *"I am confused with the entire process, especially recruitment, because I do not know who is doing what — task sharing most especially."*

This document explains why that happens, and what to change. It is a companion to `MOTEE_Recruitment_Process.md`, which describes the process as it works today.

---

## The diagnosis in one paragraph

The confusion is not a presentation problem. It is true of the data.

MOTEE records **approvers** thoroughly and **doers** almost nowhere. Every process in the system is modelled as an approval chain — an ordered list of people who *sign off* — and the person who actually *does the work* is never captured. When the system needs to show a task owner anyway, it guesses.

Here is the guess, in full. This is the function that decides who owns every onboarding task in the product:

```ts
function assigneeFromLabel(label: string): OnboardingTaskAssignee {
  const l = label.toLowerCase();
  if (l.includes("it")) return "it";
  if (l.includes("manager") || l.includes("head") || l.includes("lead")) return "manager";
  return "hr";
}
```

It takes the *reviewer's job title* and searches it for a substring. "Recru**it**er" contains "it", so recruiter tasks are assigned to the IT department. So are auditor tasks. Due dates are worse — they are set to `0, 1, 2, 3…` with the comment *"sequential placeholder; real due dates set elsewhere"*, and there is no elsewhere.

**No one is confused by accident. The system genuinely does not know who is doing what, so it cannot tell you.**

---

## The good news

A correct model already exists in the codebase, fully built and seeded, and it has never been switched on.

The Workflows module models a task properly. It separates:

- **assignee** — the doer, which can be a role *or* a specific named employee
- **reviewer** — the approver, optional and separate

and carries due-date offsets, expected duration, priority, escalation thresholds, task dependencies, parallel groups, and conditional tasks ("only if remote worker", "only if visa holder").

Four complete workflows are already written: **Recruitment (16 tasks), Pre-boarding (14), Onboarding (11), Offboarding**. Each task already names a department and a due date. For example:

```
"Provision IT equipment & accounts"  →  IT,  due day 14,  3 days,  high priority,
                                         depends on task 7,  parallel group "setup"
"Ship equipment to home address"     →  IT,  due day 16,  only if remote worker
```

An engine that evaluates all of this — resolving which tasks start now, which wait on dependencies, and which do not apply — exists and works correctly.

**It is called from exactly one place: a manual dialog that fires notifications and then throws the result away.** Nothing is saved. There is no task list, no inbox, no completion, no status.

So the recommendation is not "build a task system." It is **"save the output of the task system you already have."**

---

## The nine recommendations

Ordered by how much confusion each one removes per unit of work.

### 1. Persist the workflow run — *the single change that answers the question*

Give every hire a saved, living task list: each task with a **named person**, a **real date**, a **status**, and a **reason it is blocked** if it is waiting on something else.

One record becomes the single source of truth for "who is doing what", and every other screen reads from it. Approve a requisition and sixteen tasks appear, each with a face and a deadline, with the ones that cannot start yet greyed out and labelled with what they are waiting for.

**Standard practice:** a workflow engine separates the *template* (the process design) from the *run* (this specific hire's instance of it). MOTEE has the template and is missing the run.

### 2. Delete the guess

Remove `assigneeFromLabel` entirely. Task owners come from the workflow definition, which already names them. The visual grouping (IT / HR / Manager / Finance / Employee) is derived from the **role identifier**, never from searching a job title for letters.

Real due dates replace the placeholders, calculated from the hire's start date — which is what the workflow's "day 14" offsets were always designed to mean.

### 3. Make three roles be three people

In the demo data, HR Admin, HR Manager and Recruiter all point at the same employee. A three-step approval chain lands on one person three times, which makes every chain look like theatre.

Two fixes, both needed:

- **Let a record override the role.** When a requisition names *Adaeze* as recruiter and *Tunde* as hiring manager, the tasks go to Adaeze and Tunde — not to whoever the Recruiter role happens to point at globally. The record wins; the role is the fallback.
- **Let an approval step name a person directly.** Today a step can only say "Line Manager", "Department Head" or a role. It should also be able to say a specific employee.

### 4. Give everyone their own inbox — "My Work"

Today the HR task list has no owner field at all, so every HR user sees the same fifty tasks. (The employee-facing portal already filters correctly — the pattern exists, it is just not used on the HR side.)

Replace it with a single **My Work** screen merging three sources:

- **To do** — workflow tasks assigned to me
- **Awaiting my review** — tasks others have submitted for my approval
- **Assigned to others** — so that when I have nothing, I can still see who does

That third tab matters more than it looks. "I have nothing to do" is not an answer to "who is doing what" — but "Adaeze has three, IT has two" is.

**Add a "View as" persona switcher** so the process can be demonstrated from the Recruiter's seat, then the Hiring Manager's, then IT's — each showing a genuinely different list. Clicking through personas and seeing different work *is* the demonstration that the problem is solved.

### 5. Put the hiring team on every record — a RACI strip

One consistent strip at the top of every record — workforce request, requisition, vacancy, candidate, onboarding — showing:

> **Requester** · **Approver** · **Recruiter** · **Hiring Manager** · **HR Partner** · **Currently with**

plus a plain-language status line: **"Waiting on Adaeze Okafor for 6 days."**

The information to compute the waiting time already exists and is already used on the approvals screen. It just never appears on the record itself, where people actually look.

**Standard practice:** RACI (Responsible, Accountable, Consulted, Informed) on the artefact, not in a separate governance document. If you have to leave the record to find out who owns it, the design has failed.

### 6. Stop dropping the hiring team between stages

The requisition captures recruiter, HR business partner and interview panel. The vacancy keeps only the hiring manager. The other three are silently discarded.

Carry all of them forward, and while fixing that:

- **Give candidates an owner**, with a "My candidates" filter. A pipeline where nobody owns anyone is a shared inbox, and shared inboxes are where candidates go quiet.
- **Populate the interview panel** from the requisition. Interviews are currently created with an empty panel — which means the double-booking detector, which is correctly written and works, can never fire, because it compares panels and every panel is empty.

### 7. Fire the handoffs automatically

Approving a requisition should start the recruitment tasks. Hiring a candidate should start pre-boarding. Today both need a human to remember.

Worth noting: the code *claims* this already happens. A comment in the workflow definitions states that the pre-boarding trigger "already fires from Recruitment when a candidate is hired." It does not. Nothing evaluates it.

### 8. Make the numbers real

The sidebar badges are hardcoded constants. "54" next to HR Action Centre, "10" next to Recruitment, "5" next to Onboarding — they never change and correspond to nothing.

Replace them with the signed-in user's actual pending count, and show nothing when the count is zero. **A permanent "10" on an empty pipeline is worse than no badge**, because it teaches people to ignore badges.

Similarly, notifications currently go to one shared list with no recipient. "Amara, you have a task" appears in everybody's notification panel. Add a recipient and filter the panel.

### 9. Show the whole process on one screen

An eight-stage lifecycle map already exists with live counts per stage. Two improvements make it the answer to "where is everything?":

- **Two stages have no data** — Pre-employment and Develop/Perform/Retain show nothing, because nothing feeds them. Pre-employment becomes populated the moment pre-boarding runs are saved (recommendation 1).
- **Add "waiting on" to each stage card** — the oldest stalled items and who holds them. That turns a map into a management tool.

Then add a **stage tracker** to individual records: an eight-dot breadcrumb showing where this specific hire has reached. "Where is Chidi?" becomes a glance instead of a search.

---

## What to build first

**Recommendations 1 and 2 together are the whole answer to the client's sentence**, and they are demonstrable on their own: approve a requisition, and sixteen tasks appear with real names and real dates.

| Order | Work | Removes |
|---|---|---|
| **1st** | Persist the run; delete the guess (rec. 1, 2, 3) | "I don't know who is doing what" |
| **2nd** | My Work inbox + persona switcher (rec. 4) | "I don't know what *I* should be doing" |
| **3rd** | RACI strip + carry the team forward (rec. 5, 6) | "I have to leave the record to find out who owns it" |
| **4th** | Automatic handoffs + real badges (rec. 7, 8) | "Things stall and nobody notices" |
| **5th** | Lifecycle map + stage tracker (rec. 9) | "I can't see the whole picture" |

---

## The principle underneath all of this

> **Every task has exactly one name on it, one date, and one place to see it.**

Wherever the system today shows a *department*, a *role*, or a *colour* in place of a person, it is hiding the fact that nobody has been assigned. Wherever it shows "Day 3" instead of a date, it is hiding the fact that no deadline was ever set.

Fix the model, and the interface largely explains itself.
