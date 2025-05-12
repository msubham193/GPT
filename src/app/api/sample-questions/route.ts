import { NextResponse } from "next/server";

// GET handler for fetching sample questions
export async function GET() {
  try {
    const response = await fetch("http://13.234.110.97:8000/sample-questions", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch sample questions from API");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in sample questions API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch sample questions" },
      { status: 500 }
    );
  }
}

// POST handler for creating a new sample question
export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const response = await fetch("http://13.234.110.97:8000/sample-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error("Failed to create sample question");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in create sample question API route:", error);
    return NextResponse.json(
      { error: "Failed to create sample question" },
      { status: 500 }
    );
  }
}


