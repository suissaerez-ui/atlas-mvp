import { NextResponse } from "next/server";
import { analyzeStudent } from "@/lib/atlas/analyze";
import { getDemoStudentProfile, mockSarahProfile } from "@/lib/atlas/mock-profile";
import type { StudentProfile } from "@/lib/atlas/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const profile = getDemoStudentProfile(searchParams.get("student") ?? undefined);

  return NextResponse.json(analyzeStudent(profile));
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const profile = await getPostedProfile(request, searchParams.get("student"));

  return NextResponse.json(analyzeStudent(profile));
}

async function getPostedProfile(request: Request, student: string | null) {
  try {
    const body = (await request.json()) as StudentProfile | null;
    if (body?.name) {
      return body;
    }
  } catch {
    return student ? getDemoStudentProfile(student) : mockSarahProfile;
  }

  return student ? getDemoStudentProfile(student) : mockSarahProfile;
}
