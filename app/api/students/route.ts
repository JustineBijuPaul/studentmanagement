import { NextRequest, NextResponse } from 'next/server';
import { getAllStudents, createStudent } from '@/lib/db/queries';
import { CreateStudentSchema } from '@/lib/db/types';
import { ZodError } from 'zod';

export async function GET() {
  try {
    const students = await getAllStudents();
    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateStudentSchema.parse(body);
    
    const newStudent = await createStudent(validatedData);
    return NextResponse.json(
      { success: true, data: newStudent },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating student:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
