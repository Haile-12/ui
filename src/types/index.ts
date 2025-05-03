export interface Teacher {
  id: string;
  username: string;
  department: string;
  course_name: string;
  semester: string;
  gender: 'male' | 'female' | 'other';
  degree_level: string;
  profile_url: string;
  created_at: string;
}

export interface Student {
  id: string;
  name: string;
  student_id: string;
  year: number;
  course_type: 'regular' | 'added';
  department: string;
  semester: string;
  created_at: string;
  teacher_id: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: 'present' | 'absent';
  created_at: string;
}
