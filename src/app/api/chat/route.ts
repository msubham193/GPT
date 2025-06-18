// app/api/chat/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    const response = await fetch("http://13.204.45.108:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from chat API");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
