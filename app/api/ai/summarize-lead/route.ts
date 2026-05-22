import { NextResponse } from "next/server";
import { createMockLeadSummary } from "../../../_lib/ai/mock-summary";
import type { Lead } from "../../../_lib/crm-data";

export async function POST(request: Request) {
  const { lead } = (await request.json()) as { lead?: Lead };

  if (!lead) {
    return NextResponse.json(
      { error: "Missing lead payload." },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      mode: "mock",
      summary: createMockLeadSummary(lead),
    });
  }

  return NextResponse.json({
    mode: "mock",
    summary: createMockLeadSummary(lead),
    note: "OPENAI_API_KEY is present, but live OpenAI summarization is not connected yet.",
  });
}
