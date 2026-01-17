import { getDbConnection } from './connection';
import { Student, CreateStudent } from './types';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function getAllStudents(): Promise<Student[]> {
  const connection = await getDbConnection();
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT * FROM students ORDER BY enrollmentDate DESC'
  );
  return rows as Student[];
}

export async function getStudentById(id: number): Promise<Student | null> {
  const connection = await getDbConnection();
  const [rows] = await connection.query<RowDataPacket[]>(
    'SELECT * FROM students WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? (rows[0] as Student) : null;
}

export async function createStudent(student: CreateStudent): Promise<Student> {
  const connection = await getDbConnection();
  const [result] = await connection.query<ResultSetHeader>(
    `INSERT INTO students (firstName, lastName, email, phone, enrollmentDate, major, status, graduationYear)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      student.firstName,
      student.lastName,
      student.email,
      student.phone || null,
      student.enrollmentDate,
      student.major,
      student.status,
      student.graduationYear || null,
    ]
  );
  
  const newStudent = await getStudentById(result.insertId);
  if (!newStudent) {
    throw new Error('Failed to create student');
  }
  return newStudent;
}

export async function updateStudent(id: number, updates: Partial<CreateStudent>): Promise<Student> {
  const connection = await getDbConnection();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(id);
  
  await connection.query(
    `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  
  const updatedStudent = await getStudentById(id);
  if (!updatedStudent) {
    throw new Error('Student not found after update');
  }
  return updatedStudent;
}

export async function deleteStudent(id: number): Promise<boolean> {
  const connection = await getDbConnection();
  const [result] = await connection.query<ResultSetHeader>(
    'DELETE FROM students WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}
