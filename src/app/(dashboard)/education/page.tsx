"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, GraduationCap, FileText, RefreshCw, Award, Calendar } from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credits: number | null;
  instructorId: string | null;
  level: string;
  maxStudents: number | null;
  isPublished: boolean;
  enrollmentCount?: number;
}

interface Student {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  enrollmentDate: string;
}

interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  progress: number;
  grade: string | null;
  course?: { name: string; code: string };
  student?: { firstName: string; lastName: string };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export default function EducationPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const [coursesRes, studentsRes, enrollmentsRes] = await Promise.all([
        fetch('/api/education/courses'),
        fetch('/api/education/students'),
        fetch('/api/education/enrollments'),
      ]);

      if (coursesRes.ok) setCourses((await coursesRes.json()) ?? []);
      if (studentsRes.ok) setStudents((await studentsRes.json()) ?? []);
      if (enrollmentsRes.ok) setEnrollments((await enrollmentsRes.json()) ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const publishedCourses = useMemo(() => courses.filter((c) => c.isPublished).length, [courses]);
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'ACTIVE').length, [students]);
  const activeEnrollments = useMemo(() => enrollments.filter((e) => e.status === 'ACTIVE').length, [enrollments]);
  const completedEnrollments = useMemo(() => enrollments.filter((e) => e.status === 'COMPLETED').length, [enrollments]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Education Management</h1>
          <p className="text-gray-600">Course management, student enrollment, and academic tracking.</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Published Courses" value={String(publishedCourses)} subtitle={`${courses.length} total courses`} icon={BookOpen} variant="blue" />
        <StatCard title="Active Students" value={String(activeStudents)} subtitle={`${students.length} registered`} icon={Users} variant="green" />
        <StatCard title="Active Enrollments" value={String(activeEnrollments)} subtitle={`${completedEnrollments} completed`} icon={GraduationCap} variant="purple" />
        <StatCard title="Completion Rate" value={courses.length > 0 ? `${Math.round((completedEnrollments / Math.max(enrollments.length, 1)) * 100)}%` : '0%'} subtitle="Overall progress" icon={Award} variant="orange" />
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Catalog</CardTitle>
              <CardDescription>Manage courses, lessons, and curriculum.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading courses..." />
              ) : courses.length === 0 ? (
                <EmptyState message="No courses created yet." />
              ) : (
                <div className="space-y-3">
                  {courses.slice(0, 10).map((course) => (
                    <div key={course.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 font-bold text-sm">
                          {course.code}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{course.name}</p>
                          <p className="text-xs text-gray-500">
                            {course.level} · {course.credits || 0} credits · {course.enrollmentCount || 0} students
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={course.isPublished ? 'default' : 'secondary'}>
                          {course.isPublished ? 'Published' : 'Draft'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Registry</CardTitle>
              <CardDescription>Manage student profiles and academic records.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading students..." />
              ) : students.length === 0 ? (
                <EmptyState message="No students registered yet." />
              ) : (
                <div className="space-y-3">
                  {students.slice(0, 10).map((student) => (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 font-semibold">
                          {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">
                            {student.studentNumber} · {student.email} · Enrolled {formatDate(student.enrollmentDate)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={student.status === 'ACTIVE' ? 'default' : 'secondary'}>{student.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollments</CardTitle>
              <CardDescription>Track student progress and course completion.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingState message="Loading enrollments..." />
              ) : enrollments.length === 0 ? (
                <EmptyState message="No enrollments found." />
              ) : (
                <div className="space-y-3">
                  {enrollments.slice(0, 10).map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${
                          enrollment.status === 'COMPLETED' ? 'bg-green-100' :
                          enrollment.status === 'ACTIVE' ? 'bg-blue-100' :
                          enrollment.status === 'DROPPED' ? 'bg-gray-100' :
                          'bg-red-100'
                        }`}>
                          <GraduationCap className={`h-4 w-4 ${
                            enrollment.status === 'COMPLETED' ? 'text-green-600' :
                            enrollment.status === 'ACTIVE' ? 'text-blue-600' :
                            enrollment.status === 'DROPPED' ? 'text-gray-600' :
                            'text-red-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {enrollment.student ? `${enrollment.student.firstName} ${enrollment.student.lastName}` : 'Unknown Student'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {enrollment.course ? `${enrollment.course.code} - ${enrollment.course.name}` : 'Unknown Course'} · Progress: {enrollment.progress}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          enrollment.status === 'COMPLETED' ? 'default' : 
                          enrollment.status === 'ACTIVE' ? 'secondary' : 
                          'outline'
                        }>
                          {enrollment.status}
                        </Badge>
                        {enrollment.grade && (
                          <Badge variant="outline" className="font-mono">
                            {enrollment.grade}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, variant }: { title: string; value: string; subtitle: string; icon: typeof Users; variant: 'blue' | 'green' | 'purple' | 'orange' }) {
  const accentMap = { 
    blue: 'bg-blue-100 text-blue-600', 
    green: 'bg-green-100 text-green-600', 
    purple: 'bg-purple-100 text-purple-600', 
    orange: 'bg-orange-100 text-orange-600' 
  } as const;
  return (
    <Card className="border border-gray-200">
      <CardContent className="flex items-center justify-between p-6">
        <div><p className="text-sm font-medium text-gray-500">{title}</p><p className="mt-1 text-2xl font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{subtitle}</p></div>
        <div className={`rounded-xl p-3 ${accentMap[variant]}`}><Icon className="h-6 w-6" /></div>
      </CardContent>
    </Card>
  );
}

function LoadingState({ message }: { message: string }) {
  return <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-gray-500">{message}</div>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 py-12 text-sm text-gray-500">{message}</div>;
}
