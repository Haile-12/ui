import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

const Courses = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <Button onClick={() => navigate(-1)} className="flex items-center gap-2" variant="primary">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Course Information &amp; Attendance Regulations</h1>
        </div>

        <div className="space-y-6">
          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Attendance Policy</h2>
            <p className="text-gray-600">
              Regular attendance is crucial for success in any course. The following regulations apply to all students:
            </p>
            <ul className="list-disc pl-5 mt-2 text-gray-700">
              <li>Students are expected to attend all scheduled classes.</li>
              <li>Absences exceeding 15% of total class meetings may result in academic penalties.</li>
              <li>A student who is absent for more than 20% of the classes will be blocked from the course.</li>
              <li>Valid documentation is required for excused absences (e.g., medical certificate).</li>
              <li>Students are responsible for all missed material, regardless of the reason for absence.</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Course Management Guidelines</h2>
            <p className="text-gray-600">
              These guidelines ensure fair and effective course management:
            </p>
            <ul className="list-disc pl-5 mt-2 text-gray-700">
              <li>All courses must adhere to the university's academic calendar.</li>
              <li>Course materials, including syllabi and assignments, should be accessible online.</li>
              <li>Instructors must provide timely feedback on assignments and exams.</li>
              <li>Any changes to the course schedule or grading policy must be communicated to students in advance.</li>
            </ul>
          </section>

          <section className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Additional Information</h2>
            <p className="text-gray-600">
              For further inquiries, please contact the academic affairs office or your course instructor.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Courses;
