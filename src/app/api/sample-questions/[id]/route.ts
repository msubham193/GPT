import { NextResponse } from "next/server";

// DELETE handler for deleting a sample question
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // Await params to resolve the Promise
    console.log("Deleting document with ID:", id); // Debug log

    const response = await fetch(
      `http://13.204.45.108:8000/sample-questions/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete sample question");
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in delete sample question API route:", error);
    return NextResponse.json(
      { error: "Failed to delete sample question" },
      { status: 500 }
    );
  }
}
