// Types
export type UserRole = "admin" | "leader" | "volunteer"

export interface User {
  id: string
  username: string
  password: string
  name: string
  email: string
  role: UserRole
  teamId?: string
  avatar?: string
  phone?: string
  joinDate: string
  status: "active" | "inactive" | "pending"
}

export interface Team {
  id: string
  name: string
  description: string
  leaderId?: string
  color: string
  icon: string
  requirements?: string[]
}

export interface TrainingVideo {
  id: string
  title: string
  description: string
  videoUrl?: string // Now optional
  duration: number // in seconds (0 if no video)
  teamId?: string // null = general training
  order: number
  quizEnabled: boolean
  quizRequired: boolean
  passingScore: number
  summary: string
  documents?: TrainingDocument[] // Added documents support
}

export interface TrainingDocument {
  id: string
  name: string
  url: string
  type: "pdf" | "doc" | "ppt" | "other"
  size?: string
}

export interface Quiz {
  id: string
  videoId: string
  questions: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
}

export interface TrainingProgress {
  id: string
  oderId: string
  videoId: string
  completed: boolean
  watchedSeconds: number
  quizScore?: number
  quizPassed?: boolean
  completedAt?: string
  approvedBy?: string
}

export interface Announcement {
  id: string
  title: string
  content: string
  authorId: string
  teamId?: string
  createdAt: string
  priority: "low" | "medium" | "high"
}

export interface ServiceSchedule {
  id: string
  date: string
  service: string
  assignments: { oderId: string; teamId: string; role: string }[]
}

export interface MinistryApplication {
  id: string
  applicantId: string
  teamId: string
  motivation: string
  experience: string
  availability: string[]
  status: "pending" | "approved" | "rejected"
  reviewedBy?: string
  reviewNotes?: string
  createdAt: string
  updatedAt: string
}

// Initial Data
export const initialUsers: User[] = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "Admin User",
    email: "admin@citichurch.com",
    role: "admin",
    avatar: "/admin-avatar.png",
    phone: "+1 234 567 8900",
    joinDate: "2023-01-15",
    status: "active",
  },
  {
    id: "2",
    username: "leader",
    password: "leader123",
    name: "John Leader",
    email: "john@citichurch.com",
    role: "leader",
    teamId: "sounds",
    avatar: "/team-leader-male.jpg",
    phone: "+1 234 567 8901",
    joinDate: "2023-03-20",
    status: "active",
  },
  {
    id: "3",
    username: "volunteer",
    password: "volunteer123",
    name: "Sarah Volunteer",
    email: "sarah@citichurch.com",
    role: "volunteer",
    teamId: "sounds",
    avatar: "/volunteer-female.jpg",
    phone: "+1 234 567 8902",
    joinDate: "2024-01-10",
    status: "active",
  },
  {
    id: "4",
    username: "mike",
    password: "mike123",
    name: "Mike Chen",
    email: "mike@citichurch.com",
    role: "volunteer",
    teamId: "lights",
    avatar: "/asian-male-volunteer.jpg",
    phone: "+1 234 567 8903",
    joinDate: "2024-02-15",
    status: "pending",
  },
  {
    id: "5",
    username: "emma",
    password: "emma123",
    name: "Emma Wilson",
    email: "emma@citichurch.com",
    role: "leader",
    teamId: "media",
    avatar: "/female-team-leader.jpg",
    phone: "+1 234 567 8904",
    joinDate: "2023-06-01",
    status: "active",
  },
  {
    id: "6",
    username: "david",
    password: "david123",
    name: "David Brown",
    email: "david@citichurch.com",
    role: "volunteer",
    teamId: "broadcast",
    avatar: "/male-volunteer.jpg",
    phone: "+1 234 567 8905",
    joinDate: "2024-03-01",
    status: "pending",
  },
  {
    id: "7",
    username: "lisa",
    password: "lisa123",
    name: "Lisa Martinez",
    email: "lisa@citichurch.com",
    role: "volunteer",
    teamId: "cameras",
    avatar: "/latina-female.jpg",
    phone: "+1 234 567 8906",
    joinDate: "2024-01-20",
    status: "active",
  },
  {
    id: "8",
    username: "james",
    password: "james123",
    name: "James Taylor",
    email: "james@citichurch.com",
    role: "leader",
    teamId: "broadcast",
    avatar: "/male-broadcaster.jpg",
    phone: "+1 234 567 8907",
    joinDate: "2023-04-10",
    status: "active",
  },
]

export const initialTeams: Team[] = [
  {
    id: "broadcast",
    name: "Broadcast",
    description: "Live streaming and recording of services",
    leaderId: "8",
    color: "#dc2626",
    icon: "Radio",
    requirements: ["Technical aptitude", "Attention to detail", "Reliability"],
  },
  {
    id: "lights",
    name: "Lights",
    description: "Stage lighting and visual atmosphere",
    leaderId: undefined,
    color: "#f59e0b",
    icon: "Lightbulb",
    requirements: ["Creative vision", "Technical skills", "Timing awareness"],
  },
  {
    id: "media",
    name: "Media",
    description: "Presentation slides and video playback",
    leaderId: "5",
    color: "#8b5cf6",
    icon: "Monitor",
    requirements: ["Computer proficiency", "Quick reflexes", "Attention to detail"],
  },
  {
    id: "sounds",
    name: "Sounds",
    description: "Audio mixing and sound engineering",
    leaderId: "2",
    color: "#3b82f6",
    icon: "Volume2",
    requirements: ["Musical ear", "Technical knowledge", "Problem solving"],
  },
  {
    id: "stage-design",
    name: "Stage Design",
    description: "Stage setup and visual design",
    leaderId: undefined,
    color: "#10b981",
    icon: "Palette",
    requirements: ["Creativity", "Physical fitness", "Teamwork"],
  },
  {
    id: "cameras",
    name: "Cameras",
    description: "Camera operation for live broadcasts",
    leaderId: undefined,
    color: "#ec4899",
    icon: "Camera",
    requirements: ["Steady hands", "Visual composition", "Technical skills"],
  },
]

export const initialTrainingVideos: TrainingVideo[] = [
  {
    id: "v1",
    title: "Welcome to Production Ministry",
    description: "An introduction to our production team and what we do",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: 120,
    teamId: undefined,
    order: 1,
    quizEnabled: true,
    quizRequired: false,
    passingScore: 70,
    summary:
      "This video covers the mission and vision of our Production Ministry, explaining how technical excellence serves to enhance worship and spread the gospel. You'll learn about our core values: excellence, teamwork, and servant leadership.",
    documents: [], // Added documents array
  },
  {
    id: "v2",
    title: "Safety & Equipment Basics",
    description: "Essential safety guidelines and equipment handling",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: 180,
    teamId: undefined,
    order: 2,
    quizEnabled: true,
    quizRequired: true,
    passingScore: 80,
    summary:
      "Safety is our top priority. This module covers electrical safety, proper cable management, equipment handling procedures, and emergency protocols. Remember: if you're unsure, always ask a team leader.",
    documents: [
      { id: "d1", name: "Safety Guidelines PDF", url: "/documents/safety-guidelines.pdf", type: "pdf", size: "2.4 MB" },
      { id: "d2", name: "Equipment Checklist", url: "/documents/equipment-checklist.pdf", type: "pdf", size: "156 KB" },
    ],
  },
  {
    id: "v3",
    title: "Sound Mixing Fundamentals",
    description: "Learn the basics of live sound mixing",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: 300,
    teamId: "sounds",
    order: 1,
    quizEnabled: true,
    quizRequired: true,
    passingScore: 70,
    summary:
      "Understanding gain structure, EQ basics, and mixing for clarity. This foundational course will prepare you to assist with sound during services.",
    documents: [],
  },
  {
    id: "v4",
    title: "Lighting Console Operation",
    description: "Operating the lighting console effectively",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: 240,
    teamId: "lights",
    order: 1,
    quizEnabled: true,
    quizRequired: true,
    passingScore: 70,
    summary:
      "Learn to navigate the lighting console, create scenes, and execute cues during services. Includes hands-on exercises with common lighting scenarios.",
    documents: [],
  },
  {
    id: "v5",
    title: "ProPresenter Basics",
    description: "Using ProPresenter for service presentations",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: 200,
    teamId: "media",
    order: 1,
    quizEnabled: true,
    quizRequired: false,
    passingScore: 70,
    summary:
      "Master the essentials of ProPresenter: creating slides, managing playlists, triggering videos, and handling live service flow.",
    documents: [],
  },
  {
    id: "v6",
    title: "Live Streaming Setup",
    description: "Setting up and managing live streams",
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    duration: 280,
    teamId: "broadcast",
    order: 1,
    quizEnabled: true,
    quizRequired: true,
    passingScore: 75,
    summary:
      "Complete guide to our streaming setup including encoder settings, platform management, and troubleshooting common issues.",
    documents: [],
  },
  {
    id: "v7",
    title: "Volunteer Handbook",
    description: "Essential reading material for all new volunteers",
    videoUrl: undefined, // No video - document only
    duration: 0,
    teamId: undefined,
    order: 0,
    quizEnabled: true,
    quizRequired: true,
    passingScore: 80,
    summary:
      "This handbook contains all the essential information about serving in the Production Ministry. Please read through all documents before your first service.",
    documents: [
      {
        id: "d3",
        name: "Volunteer Handbook 2024",
        url: "/documents/volunteer-handbook.pdf",
        type: "pdf",
        size: "5.2 MB",
      },
      { id: "d4", name: "Code of Conduct", url: "/documents/code-of-conduct.pdf", type: "pdf", size: "320 KB" },
      {
        id: "d5",
        name: "Ministry Values Presentation",
        url: "/documents/ministry-values.pptx",
        type: "ppt",
        size: "8.1 MB",
      },
    ],
  },
]

export const initialQuizzes: Quiz[] = [
  {
    id: "q1",
    videoId: "v1",
    questions: [
      {
        id: "q1-1",
        question: "What is the primary purpose of the Production Ministry?",
        options: [
          "To showcase technical skills",
          "To enhance worship and spread the gospel through technical excellence",
          "To operate expensive equipment",
          "To replace professional production companies",
        ],
        correctAnswer: 1,
      },
      {
        id: "q1-2",
        question: "Which of these is NOT a core value of our Production Ministry?",
        options: ["Excellence", "Teamwork", "Competition", "Servant Leadership"],
        correctAnswer: 2,
      },
      {
        id: "q1-3",
        question: "Who should you contact if you have questions about your role?",
        options: ["The pastor", "Your team leader", "The church office", "Figure it out yourself"],
        correctAnswer: 1,
      },
    ],
  },
  {
    id: "q2",
    videoId: "v2",
    questions: [
      {
        id: "q2-1",
        question: "What should you do if you notice damaged equipment?",
        options: [
          "Ignore it and continue",
          "Try to fix it yourself",
          "Report it to your team leader immediately",
          "Post about it on social media",
        ],
        correctAnswer: 2,
      },
      {
        id: "q2-2",
        question: "What is the proper way to coil cables?",
        options: [
          "Wrap them tightly around your elbow",
          "Use the over-under technique",
          "Stuff them in a box",
          "Leave them on the floor",
        ],
        correctAnswer: 1,
      },
      {
        id: "q2-3",
        question: "When should you arrive for your scheduled service?",
        options: ["Right on time", "5 minutes early", "At least 30 minutes early", "Whenever convenient"],
        correctAnswer: 2,
      },
      {
        id: "q2-4",
        question: "What is the first thing to check in an emergency?",
        options: ["Social media", "Your phone", "The safety of people around you", "The equipment"],
        correctAnswer: 2,
      },
    ],
  },
  {
    id: "q3",
    videoId: "v3",
    questions: [
      {
        id: "q3-1",
        question: "What is gain structure?",
        options: [
          "The order of audio signals from input to output",
          "The physical structure of the mixing console",
          "The cable routing system",
          "The speaker placement layout",
        ],
        correctAnswer: 0,
      },
      {
        id: "q3-2",
        question: "What does EQ stand for?",
        options: ["Equal Quality", "Equalization", "Equipment Queue", "Estimated Quantity"],
        correctAnswer: 1,
      },
      {
        id: "q3-3",
        question: "What is the purpose of a compressor?",
        options: [
          "To make everything louder",
          "To control dynamic range",
          "To add reverb",
          "To remove background noise",
        ],
        correctAnswer: 1,
      },
    ],
  },
]

export const initialAnnouncements: Announcement[] = [
  {
    id: "a1",
    title: "Easter Service Schedule",
    content:
      "Easter services will have extended setup times. Please arrive 1 hour earlier than usual. We will have two morning services and one evening service.",
    authorId: "1",
    teamId: undefined,
    createdAt: "2024-03-15T10:00:00Z",
    priority: "high",
  },
  {
    id: "a2",
    title: "New Sound Console Training",
    content:
      "We have upgraded our sound console. All Sounds team members must complete the new training module by the end of the month.",
    authorId: "2",
    teamId: "sounds",
    createdAt: "2024-03-10T14:30:00Z",
    priority: "medium",
  },
  {
    id: "a3",
    title: "Team Building Event",
    content: "Join us for our quarterly team building event next Saturday at 2 PM. Food and games provided!",
    authorId: "1",
    teamId: undefined,
    createdAt: "2024-03-08T09:00:00Z",
    priority: "low",
  },
]

export const initialTrainingProgress: TrainingProgress[] = [
  {
    id: "p1",
    oderId: "3",
    videoId: "v1",
    completed: true,
    watchedSeconds: 120,
    quizScore: 100,
    quizPassed: true,
    completedAt: "2024-02-01T15:30:00Z",
    approvedBy: "2",
  },
  {
    id: "p2",
    oderId: "3",
    videoId: "v2",
    completed: true,
    watchedSeconds: 180,
    quizScore: 85,
    quizPassed: true,
    completedAt: "2024-02-05T10:00:00Z",
    approvedBy: "2",
  },
  {
    id: "p3",
    oderId: "3",
    videoId: "v3",
    completed: false,
    watchedSeconds: 150,
    quizScore: undefined,
    quizPassed: undefined,
  },
  {
    id: "p4",
    oderId: "4",
    videoId: "v1",
    completed: true,
    watchedSeconds: 120,
    quizScore: 67,
    quizPassed: false,
    completedAt: "2024-02-10T11:00:00Z",
  },
  {
    id: "p5",
    oderId: "6",
    videoId: "v1",
    completed: false,
    watchedSeconds: 60,
  },
  {
    id: "p6",
    oderId: "7",
    videoId: "v1",
    completed: true,
    watchedSeconds: 120,
    quizScore: 100,
    quizPassed: true,
    completedAt: "2024-02-15T14:00:00Z",
    approvedBy: "1",
  },
]

export const initialServiceSchedules: ServiceSchedule[] = [
  {
    id: "s1",
    date: "2024-03-24",
    service: "Sunday Morning",
    assignments: [
      { oderId: "3", teamId: "sounds", role: "Assistant" },
      { oderId: "4", teamId: "lights", role: "Operator" },
      { oderId: "7", teamId: "cameras", role: "Camera 1" },
    ],
  },
  {
    id: "s2",
    date: "2024-03-31",
    service: "Easter Sunday",
    assignments: [
      { oderId: "3", teamId: "sounds", role: "Main Mixer" },
      { oderId: "4", teamId: "lights", role: "Operator" },
      { oderId: "6", teamId: "broadcast", role: "Stream Operator" },
      { oderId: "7", teamId: "cameras", role: "Camera 2" },
    ],
  },
]
