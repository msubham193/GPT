import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Hardcoded as per requirement
    const { id } = await context.params;
    console.log(id);

    const response = await fetch(
      `http://13.234.110.97:8000/user-feedback/${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user feedback");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in user feedback GET API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch user feedback" },
      { status: 500 }
    );
  }
}
