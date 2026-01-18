-- Setup script for studentdb database
-- Run this on the RDS instance

DROP TABLE IF EXISTS students;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  enrollment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  major VARCHAR(100) NOT NULL,
  status ENUM('active', 'inactive', 'graduated', 'suspended') NOT NULL DEFAULT 'active',
  graduation_year INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_enrollment (enrollment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
INSERT INTO students (first_name, last_name, email, phone, enrollment_date, major, status, graduation_year) VALUES
('John', 'Doe', 'john.doe@university.edu', '555-0101', '2023-09-01', 'Computer Science', 'active', 2027),
('Jane', 'Smith', 'jane.smith@university.edu', '555-0102', '2023-09-01', 'Electrical Engineering', 'active', 2027),
('Michael', 'Johnson', 'michael.j@university.edu', '555-0103', '2022-09-01', 'Business Administration', 'active', 2026),
('Emily', 'Williams', 'emily.w@university.edu', '555-0104', '2021-09-01', 'Biology', 'graduated', 2025),
('David', 'Brown', 'david.brown@university.edu', '555-0105', '2023-09-01', 'Mathematics', 'active', 2027);
