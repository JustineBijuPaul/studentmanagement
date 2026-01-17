-- Student Records Management System Database Schema

CREATE DATABASE IF NOT EXISTS student_records;
USE student_records;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  enrollmentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  major VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive', 'graduated', 'suspended') NOT NULL DEFAULT 'active',
  graduationYear INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_enrollment (enrollmentDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
INSERT INTO students (firstName, lastName, email, phone, enrollmentDate, major, status, graduationYear) VALUES
('John', 'Doe', 'john.doe@university.edu', '555-0101', '2023-09-01', 'Computer Science', 'active', 2027),
('Jane', 'Smith', 'jane.smith@university.edu', '555-0102', '2023-09-01', 'Electrical Engineering', 'active', 2027),
('Michael', 'Johnson', 'michael.j@university.edu', '555-0103', '2022-09-01', 'Business Administration', 'active', 2026),
('Emily', 'Williams', 'emily.w@university.edu', '555-0104', '2021-09-01', 'Biology', 'graduated', 2025),
('David', 'Brown', 'david.brown@university.edu', '555-0105', '2023-09-01', 'Mathematics', 'active', 2027);
