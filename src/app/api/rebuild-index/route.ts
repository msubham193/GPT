import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch("http://13.234.110.97:8000/rebuild-index", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to rebuild index: ${response.statusText}`);
    }

    return NextResponse.json({ message: "Index rebuilt successfully" });
  } catch (error) {
    console.error("Error in rebuild-index API route:", error);
    return NextResponse.json(
      { error: "Failed to rebuild index" },
      { status: 500 }
    );
  }
}
