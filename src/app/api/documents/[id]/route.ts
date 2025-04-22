import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // Await params to resolve the Promise
    console.log("Deleting document with ID:", id); // Debug log

    const response = await fetch(`http://65.2.73.254:8000/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.text().catch(() => "");
      console.error("Backend DELETE response:", response.status, errorData); // Log response for debugging
      throw new Error(
        `Failed to delete document: ${response.statusText}${
          errorData ? ` - ${errorData}` : ""
        }`
      );
    }

    return NextResponse.json({
      message: `Document ${id} deleted successfully`,
    });
  } catch (error) {
    console.error("Error in delete document API route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      {
        status:
          error instanceof Error && error.message.includes("Not Found")
            ? 404
            : 500,
      }
    );
  }
}
