import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("http://13.234.110.97:8000/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({
      message: "Users fetched successfully",
      data,
    });
  } catch (error) {
    console.error("Error in fetch-users API route:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
