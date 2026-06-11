import { NextResponse } from "next/server";
import { findMockResources } from "@/lib/atlas/resources";
import { getDemoStudentProfile, mockSarahProfile } from "@/lib/atlas/mock-profile";
import type { DevelopmentNeedId, PrimaryConstraint, RecommendationCategory, StudentProfile } from "@/lib/atlas/types";

type FindResourcesBody = {
  student?: string;
  profile?: StudentProfile;
  recommendationCategory?: RecommendationCategory;
  constraint?: PrimaryConstraint;
  developmentNeedId?: DevelopmentNeedId;
  location?: string;
  interests?: string[];
};

export async function POST(request: Request) {
  const body = await getRequestBody(request);
  const profile =
    body.profile ??
    (body.student ? getDemoStudentProfile(body.student) : mockSarahProfile);

  const resources = findMockResources({
    profile,
    recommendationCategory: body.recommendationCategory ?? "build_original_project",
    constraint: body.constraint,
    developmentNeedId: body.developmentNeedId,
    location: body.location ?? profile.location,
    interests: body.interests ?? profile.interests,
  });

  return NextResponse.json({ resources });
}

async function getRequestBody(request: Request): Promise<FindResourcesBody> {
  try {
    return (await request.json()) as FindResourcesBody;
  } catch {
    return {};
  }
}
