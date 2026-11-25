import { describe, expect, it } from "vitest";
import {
  markerList,
  postFromApi,
  suggestionFromApi,
  suggestionStatusFromApi,
  suggestionStatusToApi,
} from "./api-mapping";
import {
  categoryFromApi as ticketCategoryFromApi,
  categoryToApi as ticketCategoryToApi,
  statusFromApi as ticketStatusFromApi,
  statusToApi as ticketStatusToApi,
} from "@/src/lib/helpdesk/api-mapping";
import {
  categoryFromApi as articleCategoryFromApi,
  categoryToApi as articleCategoryToApi,
} from "@/src/lib/knowledge/api-mapping";
import {
  questionTypeToApi,
  responsesFromResults,
  surveyTypeFromApi,
  trendFromApi,
} from "@/src/lib/surveys/api-mapping";
import type { PostDto } from "@/src/types/community";
import type { SuggestionDto } from "@/src/types/suggestions";

describe("engagement api-mapping", () => {
  it("rebuilds like lists around the viewer", () => {
    expect(markerList(3, true, "me")).toHaveLength(3);
    expect(markerList(3, true, "me")).toContain("me");
    expect(markerList(2, false, "me")).not.toContain("me");
    expect(markerList(0, false, "me")).toEqual([]);
  });

  it("maps a poll post with the viewer's vote", () => {
    const dto: PostDto = {
      id: "p1",
      postType: "poll",
      authorEmployeeId: "e1",
      authorName: "Ada Obi",
      content: "Lunch?",
      isPinned: false,
      pollQuestion: "Where?",
      pollOptions: [
        { id: "o2", label: "B", votes: 1, sequence: 2 },
        { id: "o1", label: "A", votes: 2, sequence: 1 },
      ],
      pollVotes: 3,
      myVoteOptionId: "o1",
      likes: 1,
      hasMyLike: true,
      comments: [],
      canManage: true,
      createdAt: "2026-11-01",
      updatedAt: "2026-11-01",
    };
    const post = postFromApi(dto, "You");
    expect(post.authorInitials).toBe("AO");
    expect(post.likes).toEqual(["You"]);
    expect(post.pollOptions?.map((o) => o.id)).toEqual(["o1", "o2"]);
    expect(post.pollOptions?.[0]?.votes).toContain("You");
  });

  it("maps suggestion statuses both ways and marks mine", () => {
    expect(suggestionStatusFromApi("underReview")).toBe("under_review");
    expect(suggestionStatusToApi("in_progress")).toBe("inProgress");
    const dto = {
      id: "s1",
      title: "T",
      description: "D",
      category: "tools",
      status: "submitted",
      priority: "low",
      isAnonymous: true,
      submitterName: "Hidden",
      isMine: true,
      isFeatured: false,
      isTrending: false,
      upvotes: 4,
      hasMyVote: true,
      isResolved: false,
      comments: [],
      createdAt: "",
      updatedAt: "",
    } satisfies SuggestionDto;
    const s = suggestionFromApi(dto, "ME");
    expect(s.submitterName).toBeUndefined();
    expect(s.submitterInitials).toBe("ME");
    expect(s.upvotedBy).toEqual(["ME"]);
  });

  it("maps help desk and knowledge enums both ways", () => {
    expect(ticketCategoryFromApi("itSupport")).toBe("it_support");
    expect(ticketCategoryToApi("hr_policy")).toBe("hrPolicy");
    expect(ticketStatusFromApi("pendingResponse")).toBe("pending_response");
    expect(ticketStatusToApi("in_progress")).toBe("inProgress");
    expect(articleCategoryFromApi("hrPolicies")).toBe("hr_policies");
    expect(articleCategoryToApi("hr_policies")).toBe("hrPolicies");
  });

  it("unrolls a survey tally into matching responses", () => {
    expect(surveyTypeFromApi("managerLeadership")).toBe("manager_leadership");
    expect(questionTypeToApi("open_text")).toBe("openText");
    const rows = responsesFromResults({
      surveyId: "sv",
      responses: 3,
      isReportable: true,
      questions: [
        {
          questionId: "q1",
          text: "Rate",
          questionType: "rating",
          answers: 3,
          distribution: [
            { value: "5", count: 2 },
            { value: "3", count: 1 },
          ],
          options: [],
          comments: [],
        },
      ],
      byDepartment: [],
      suppressedDepartments: 0,
    });
    expect(rows).toHaveLength(3);
    const fives = rows.filter((r) => r.answers[0]?.answers[0] === "5");
    expect(fives).toHaveLength(2);
  });

  it("maps the engagement trend onto the chart series", () => {
    const [p] = trendFromApi([
      {
        month: "2026-10",
        companyWide: 71.4,
        byDepartment: [
          { departmentName: "Engineering", responses: 4, engagementScore: 80 },
          { departmentName: "Human Resources", responses: 2, engagementScore: 65 },
        ],
      },
    ]);
    expect(p).toMatchObject({ companyWide: 71, engineering: 80, hr: 65, sales: 0 });
  });
});
