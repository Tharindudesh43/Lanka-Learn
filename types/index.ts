// ─── Shared Types — Digital Learning Platform ───────────────────────────────

// ─── Enums (mirror Prisma enums for client-side use) ────────────────────────

export enum UserRole {
  STUDENT = "STUDENT",
  INSTRUCTOR = "INSTRUCTOR",
  ADMIN = "ADMIN",
}

export enum CourseStatus {
  DRAFT = "DRAFT",
  PENDING_REVIEW = "PENDING_REVIEW",
  PUBLISHED = "PUBLISHED",
  REJECTED = "REJECTED",
}

export enum CourseLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
}

export enum LessonType {
  VIDEO = "VIDEO",
  PDF = "PDF",
  QUIZ = "QUIZ",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
}

// ─── API Response Wrappers ──────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ─── User Types ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: UserRole;
  bio: string | null;
  headline: string | null;
  createdAt: string;
}

export interface InstructorInfo {
  id: string;
  name: string | null;
  image: string | null;
  headline: string | null;
  bio: string | null;
  totalCourses: number;
  totalStudents: number;
  averageRating: number;
}

// ─── Course Types ───────────────────────────────────────────────────────────

export interface CourseListItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  thumbnail: string | null;
  price: number;
  level: CourseLevel;
  averageRating: number;
  totalEnrollments: number;
  totalReviews: number;
  totalDuration: number;
  instructor: {
    id: string;
    name: string | null;
    image: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CourseDetail extends CourseListItem {
  description: string | null;
  previewVideoUrl: string | null;
  currency: string;
  status: CourseStatus;
  language: string;
  createdAt: string;
  updatedAt: string;
  sections: SectionWithLessons[];
  instructor: InstructorInfo;
  isEnrolled?: boolean;
}

export interface SectionWithLessons {
  id: string;
  title: string;
  order: number;
  lessons: LessonSummary[];
}

export interface LessonSummary {
  id: string;
  title: string;
  type: LessonType;
  duration: number;
  order: number;
  isFreePreview: boolean;
  isCompleted?: boolean;
}

export interface LessonDetail extends LessonSummary {
  content: string | null;
  videoUrl: string | null;
  pdfUrl: string | null;
  sectionId: string;
}

// ─── Enrollment & Progress Types ────────────────────────────────────────────

export interface EnrolledCourse {
  id: string;
  enrollmentId: string;
  title: string;
  slug: string;
  thumbnail: string | null;
  instructor: {
    name: string | null;
    image: string | null;
  };
  enrolledAt: string;
  completedAt: string | null;
  progress: number; // percentage 0–100
  totalLessons: number;
  completedLessons: number;
  lastAccessedLesson?: {
    id: string;
    title: string;
    sectionId: string;
  };
}

export interface ProgressUpdate {
  lessonId: string;
  completed: boolean;
  watchedSeconds: number;
}

// ─── Review Types ───────────────────────────────────────────────────────────

export interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

// ─── Quiz Types ─────────────────────────────────────────────────────────────

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation?: string;
}

export interface QuizContent {
  questions: QuizQuestion[];
  passingScore: number; // percentage
}

export interface QuizSubmission {
  lessonId: string;
  answers: Record<string, number>; // questionId → selectedIndex
}

export interface QuizResult {
  score: number;
  maxScore: number;
  passed: boolean;
  details: {
    questionId: string;
    correct: boolean;
    selectedAnswer: number;
    correctAnswer: number;
    explanation?: string;
  }[];
}

// ─── Transaction Types ──────────────────────────────────────────────────────

export interface TransactionItem {
  id: string;
  amount: number;
  platformFee: number;
  instructorPayout: number;
  status: TransactionStatus;
  createdAt: string;
  course: {
    id: string;
    title: string;
  };
  student: {
    id: string;
    name: string | null;
    email: string;
  };
}

// ─── Form Input Types ───────────────────────────────────────────────────────

export interface CreateCourseInput {
  title: string;
  description: string;
  shortDescription: string;
  price: number;
  categoryId: string;
  level: CourseLevel;
  language: string;
}

export interface UpdateCourseInput extends Partial<CreateCourseInput> {
  thumbnail?: string;
  previewVideoUrl?: string;
  status?: CourseStatus;
}

export interface CreateSectionInput {
  title: string;
  order?: number;
}

export interface CreateLessonInput {
  title: string;
  type: LessonType;
  content?: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration?: number;
  order?: number;
  isFreePreview?: boolean;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: UserRole.STUDENT | UserRole.INSTRUCTOR;
}

// ─── Category Types ─────────────────────────────────────────────────────────

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  courseCount?: number;
}

// ─── Analytics Types ────────────────────────────────────────────────────────

export interface InstructorAnalytics {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
  revenueByMonth: { month: string; revenue: number }[];
  recentEnrollments: {
    id: string;
    studentName: string | null;
    courseName: string;
    enrolledAt: string;
    amount: number;
  }[];
}

export interface AdminAnalytics {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  totalPublishedCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  signupsByMonth: { month: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
}

// ─── Search & Filter Types ──────────────────────────────────────────────────

export interface CourseFilters {
  search?: string;
  categoryId?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "newest" | "popular" | "price-asc" | "price-desc" | "rating";
  page?: number;
  pageSize?: number;
}

// ─── NextAuth Extended Types ────────────────────────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
