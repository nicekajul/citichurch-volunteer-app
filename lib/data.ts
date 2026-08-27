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
  emailConfirmed?: boolean
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
  certificateId?: string    // which certificate this module belongs to
  prerequisites?: string[]  // module IDs that must be completed first
}

export interface Certificate {
  id: string
  name: string
  description: string
  color: string                         // hex e.g. "#3b82f6"
  teamId?: string                       // undefined = ministry-wide
  prerequisiteCertificateId?: string    // must earn this cert first
  orderIndex: number                    // display/roadmap order
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
  userId: string
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
  priority: "low" | "normal" | "high"
}

export interface ScheduleAssignment {
  id: string
  userId: string
  teamId: string
  role: string
  status: "assigned" | "confirmed" | "declined" | "completed"
  rejectionReason?: string
}

export interface ServiceSchedule {
  id: string
  date: string
  time?: string
  service: string
  location?: string
  assignments: ScheduleAssignment[]
}

export interface VolunteerAvailability {
  id: string
  userId: string
  date: string // YYYY-MM-DD
  status: "available" | "unavailable"
  note?: string
}

// Task-level responsibilities a team leader can delegate to a team member
export type DelegatedPermission = "schedule" | "training" | "approvals" | "announcements"

export interface TeamPermission {
  id: string
  userId: string
  teamId: string
  permission: DelegatedPermission
  grantedBy?: string
  createdAt: string
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  message: string
  type: "schedule" | "announcement" | "application" | "training" | "info"
  read: boolean
  link?: string
  createdAt: string
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

// ── Tier 1: Ministry Essentials ────────────────────────────────────────────
const t1: TrainingVideo[] = [
  {
    id: "v1", title: "Heart of Production",
    description: "Ministry vision, welcome, and the purpose behind broadcasting the service.",
    summary: "Understand why we do what we do. Covers the ministry vision, our role in broadcasting the gospel, and the core values — excellence, teamwork, and servant leadership.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 1,
    quizEnabled: true, quizRequired: false, passingScore: 70, documents: [],
    certificateId: "cert-tier1",
  },
  {
    id: "v2", title: "Volunteer Handbook",
    description: "Dress code, call times, and general expectations for all Production Ministry volunteers.",
    summary: "Everything you need to know as a new volunteer: dress code, call time expectations, communication protocols, and what a typical service day looks like.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 2,
    quizEnabled: true, quizRequired: true, passingScore: 80, documents: [],
    certificateId: "cert-tier1",
  },
  {
    id: "v3", title: "Safety & Emergency Protocol",
    description: "Basic safety, fire extinguisher locations, evacuation plans, and equipment safety guidelines.",
    summary: "Your safety is our top priority. Learn emergency procedures, evacuation routes, fire extinguisher locations, electrical safety, and proper equipment handling.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 3,
    quizEnabled: true, quizRequired: true, passingScore: 80, documents: [],
    certificateId: "cert-tier1",
  },
  {
    id: "v4", title: "Studio Etiquette & Comms",
    description: "How to use headsets (Clear-Com, Hollyland, etc.), radio discipline, and keeping quiet in the booth.",
    summary: "Master in-service communication. Learn headset operation, radio discipline, intercom etiquette, and how to stay professional during a live broadcast.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 4,
    quizEnabled: true, quizRequired: true, passingScore: 75, documents: [],
    certificateId: "cert-tier1",
  },
]

// ── Tier 2: Broadcast Specialist ───────────────────────────────────────────
const t2: TrainingVideo[] = [
  // Track A: Camera Operator
  {
    id: "v5", title: "Gear Care & Handling",
    description: "Track A: Camera Operator — Proper lens cleaning, tripod balancing, and cable coiling (over-under method).",
    summary: "Learn how to properly care for and handle camera equipment. Covers lens cleaning, tripod balancing, and the over-under cable coiling method.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 1,
    quizEnabled: true, quizRequired: true, passingScore: 75, documents: [],
    certificateId: "cert-tier2",
  },
  {
    id: "v6", title: "Setup & Strike",
    description: "Track A: Camera Operator — Properly setting up and tearing down the camera station.",
    summary: "The right way to build and break down a camera station before and after service. Covers cable routing, power sequences, and post-service storage.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 2,
    quizEnabled: true, quizRequired: true, passingScore: 75, documents: [],
    certificateId: "cert-tier2",
  },
  {
    id: "v7", title: "Basic Framing & Composition",
    description: "Track A: Camera Operator — Rule of thirds, headroom, and matching shots with other cameras.",
    summary: "Learn the fundamental principles of camera framing for live worship. Covers rule of thirds, headroom, lead space, and shot matching.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 3,
    quizEnabled: true, quizRequired: false, passingScore: 70, documents: [],
    certificateId: "cert-tier2",
  },
  {
    id: "v8", title: "Navigating Call Shots",
    description: "Track A: Camera Operator — Understanding the Director's cues (pan, tilt, zoom, hold, standby).",
    summary: "Master the language of the control room. Learn to respond instantly to director cues: pan, tilt, zoom, hold, standby, and ready.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 4,
    quizEnabled: true, quizRequired: true, passingScore: 80, documents: [],
    certificateId: "cert-tier2",
  },
  // Track B: Control Room & Switching
  {
    id: "v9", title: "ATEM Basics",
    description: "Track B: Control Room & Switching — Switcher interface, cutting vs. transitioning, and basic keying (lower thirds/lyrics).",
    summary: "Get familiar with the ATEM switcher. Learn the interface layout, the difference between cuts and transitions, and how to key in lower thirds and lyrics.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 5,
    quizEnabled: true, quizRequired: true, passingScore: 75, documents: [],
    certificateId: "cert-tier2",
  },
  {
    id: "v10", title: "OBS & Encoding Basics",
    description: "Track B: Control Room & Switching — Starting/stopping the stream, checking audio levels, and managing scenes.",
    summary: "Master OBS for live streaming. Learn scene management, audio monitoring, stream health indicators, and how to safely start and stop a live broadcast.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 6,
    quizEnabled: true, quizRequired: true, passingScore: 75, documents: [],
    certificateId: "cert-tier2",
  },
  {
    id: "v11", title: "Broadcast Audio 101",
    description: "Track B: Control Room & Switching — House sound vs. broadcast sound, monitoring levels, and preventing clipping.",
    summary: "Understand audio in the broadcast context. Learn the difference between the house mix and the broadcast mix, how to monitor levels, and how to fix clipping.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 7,
    quizEnabled: true, quizRequired: false, passingScore: 70, documents: [],
    certificateId: "cert-tier2",
  },
  // Track C: IT & Support
  {
    id: "v12", title: "Network Fundamentals",
    description: "Track C: IT & Support — Internet troubleshooting, understanding bitrate, and monitoring stream health.",
    summary: "Learn to keep the stream alive. Covers network troubleshooting basics, bitrate requirements, and reading stream health dashboards.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 8,
    quizEnabled: true, quizRequired: false, passingScore: 70, documents: [],
    certificateId: "cert-tier2",
  },
  {
    id: "v13", title: "Signal Flow 101",
    description: "Track C: IT & Support — How video travels from the camera to the switcher to the internet.",
    summary: "Trace the signal from camera to screen. Understand how video moves through the full production chain: camera → switcher → encoder → CDN → viewer.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 9,
    quizEnabled: true, quizRequired: true, passingScore: 75, documents: [],
    certificateId: "cert-tier2",
  },
]

// ── Tier 3: Production Leader ──────────────────────────────────────────────
const t3: TrainingVideo[] = [
  {
    id: "v14", title: "Service Director",
    description: "Calling shots, pacing the service, and communicating with the worship leader, pastor, and camera team.",
    summary: "Step into the director's chair. Learn to call shots confidently, pace the service, and maintain clear communication with worship leaders, pastors, and camera operators.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 1,
    quizEnabled: true, quizRequired: true, passingScore: 85, documents: [],
    certificateId: "cert-tier3",
  },
  {
    id: "v15", title: "Technical Director (TD)",
    description: "Advanced ATEM/OBS routing, multi-cam live mixing, macros, and handling complex transitions.",
    summary: "Master the technical side of directing. Covers advanced ATEM routing, multi-camera switching, macro programming, and managing complex live transitions.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 2,
    quizEnabled: true, quizRequired: true, passingScore: 85, documents: [],
    certificateId: "cert-tier3",
  },
  {
    id: "v16", title: "Dynamic Cinematography",
    description: "Advanced framing for live worship — depth of field, capturing emotion, and safe dynamic movement.",
    summary: "Elevate your camera work. Learn advanced composition for live worship: depth of field, emotional storytelling, and controlled dynamic movement.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 3,
    quizEnabled: true, quizRequired: false, passingScore: 75, documents: [],
    certificateId: "cert-tier3",
  },
  {
    id: "v17", title: "Live Troubleshooting",
    description: "Handling a dropped stream, frozen camera, or missing audio during a live broadcast without panicking.",
    summary: "Stay calm and fix it live. Learn proven protocols for common broadcast emergencies: dropped streams, frozen cameras, and lost audio.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 4,
    quizEnabled: true, quizRequired: true, passingScore: 85, documents: [],
    certificateId: "cert-tier3",
  },
  {
    id: "v18", title: "Ministry Mentor",
    description: "Training for volunteers ready to shadow and teach Tier 1 and Tier 2 volunteers.",
    summary: "Give back by teaching others. Prepares experienced volunteers to mentor newer members, lead training sessions, and build a culture of excellence.",
    videoUrl: undefined, duration: 0, teamId: undefined, order: 5,
    quizEnabled: true, quizRequired: false, passingScore: 75, documents: [],
    certificateId: "cert-tier3",
  },
]

export const initialTrainingVideos: TrainingVideo[] = [...t1, ...t2, ...t3]

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
    priority: "normal",
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
    userId:"3",
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
    userId:"3",
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
    userId:"3",
    videoId: "v3",
    completed: false,
    watchedSeconds: 150,
    quizScore: undefined,
    quizPassed: undefined,
  },
  {
    id: "p4",
    userId:"4",
    videoId: "v1",
    completed: true,
    watchedSeconds: 120,
    quizScore: 67,
    quizPassed: false,
    completedAt: "2024-02-10T11:00:00Z",
  },
  {
    id: "p5",
    userId:"6",
    videoId: "v1",
    completed: false,
    watchedSeconds: 60,
  },
  {
    id: "p6",
    userId:"7",
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
      { id: "a1", userId: "3", teamId: "sounds", role: "Assistant", status: "assigned" },
      { id: "a2", userId: "4", teamId: "lights", role: "Operator", status: "assigned" },
      { id: "a3", userId: "7", teamId: "cameras", role: "Camera 1", status: "assigned" },
    ],
  },
  {
    id: "s2",
    date: "2024-03-31",
    service: "Easter Sunday",
    assignments: [
      { id: "a4", userId: "3", teamId: "sounds", role: "Main Mixer", status: "assigned" },
      { id: "a5", userId: "4", teamId: "lights", role: "Operator", status: "assigned" },
      { id: "a6", userId: "6", teamId: "broadcast", role: "Stream Operator", status: "assigned" },
      { id: "a7", userId: "7", teamId: "cameras", role: "Camera 2", status: "assigned" },
    ],
  },
]
