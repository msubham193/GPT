import { NextResponse } from 'next/server';

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const response = await fetch(`http://65.2.73.254:8000/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }

    return NextResponse.json({ message: `Document ${id} deleted successfully` });
  } catch (error) {
    console.error('Error in delete document API route:', error);
    return NextResponse.json(
      { error: `Failed to delete document` },
      { status: 500 }
    );
  }
}