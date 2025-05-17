import { NextResponse } from "next/server";

// POST handler for submitting user feedback
export async function POST(request: Request) {
  try {
    const { user_id, rating, comment } = await request.json();

    // Validate request body
    if (!user_id || rating == null || !comment) {
      return NextResponse.json(
        { error: "user_id, rating, and comment are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `http://13.234.110.97:8000/user-feedback?user_id=${encodeURIComponent(
        user_id
      )}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id, rating, comment }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit user feedback");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in user feedback POST API route:", error);
    return NextResponse.json(
      { error: "Failed to process feedback request" },
      { status: 500 }
    );
  }
}

// GET handler for fetching user feedback

