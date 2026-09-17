# AIFinity 🧠

> **AI That Turns Struggles into Strengths**

**AIFinity** is an AI-powered **learning-gap and career-readiness platform** designed to help students understand *why* they make mistakes, identify their conceptual weaknesses, and build a personalized path toward their career goals.

Instead of simply showing students their scores or correct answers, AIFinity analyzes their performance, identifies learning gaps, and transforms mistakes into **personalized learning insights and actionable next steps**.

### Discover → Analyze → Improve → Prepare

---

## 🚀 Overview

Students often know **what they got wrong**, but not:

* Which concept they are missing
* Why they repeatedly make similar mistakes
* Which prerequisite concepts they need to strengthen
* What skills they are missing for their target career
* What they should learn next

AIFinity addresses this through three core AI-driven modules:

### 🧠 ConceptRoot AI

Analyzes incorrect answers to identify the **underlying conceptual weakness** rather than simply marking an answer as wrong.

It helps determine:

* The concept behind the mistake
* Possible root causes
* Missing prerequisite knowledge
* Recommended concepts to revise
* Targeted areas for further practice

### 📊 MistakeMap AI

Analyzes performance across multiple assessments and attempts to identify **recurring mistake patterns**.

It tracks patterns such as:

* Repeated conceptual mistakes
* Knowledge gaps
* Accuracy problems
* Performance trends
* Areas requiring additional practice

Rather than treating every wrong answer independently, MistakeMap builds a broader picture of the student's learning behavior.

### 🎯 SkillGap AI

Connects a student's current learning profile with their **target career or role**.

It can consider:

* Assessment performance
* Learning progress
* Skills
* Projects
* Resume information
* Target career goal

It then identifies relevant skill gaps and helps generate a **career-focused learning roadmap**.

---

## ✨ Core Features

### 🧠 ConceptRoot AI

* AI-powered root-cause analysis
* Concept-gap detection
* Prerequisite concept identification
* Personalized explanations
* Targeted learning recommendations
* Adaptive improvement guidance

### 📊 MistakeMap AI

* Assessment and attempt history
* Recurring mistake detection
* Performance trend analysis
* Identification of knowledge and accuracy gaps
* Personalized performance insights
* Progress visualization

### 🎯 SkillGap AI

* Career goal selection
* Current skill analysis
* Resume/project-based profile analysis
* Career skill-gap identification
* Personalized career-readiness roadmap
* Recommended areas for improvement

### 📝 Assessment System

Administrators can manage assessments through the admin dashboard, while students can attempt available assessments and receive performance insights based on their results.

### 👨‍💼 Admin Dashboard

The admin system provides management capabilities for:

* Assessments
* Questions
* Registered users
* Platform data

User information is retrieved from the application's database rather than relying on static mock users.

---

## 🔄 How AIFinity Works

```text
                    Student
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Assessments   Resume      Career Goal
          │            │            │
          └────────────┼────────────┘
                       ▼
                 AIFinity AI
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
 ConceptRoot       MistakeMap       SkillGap
       │               │               │
       ▼               ▼               ▼
 Concept Gaps     Mistake Patterns   Skill Gaps
       │               │               │
       └───────────────┼───────────────┘
                       ▼
             Personalized Roadmap
                       │
                       ▼
              Targeted Improvement
```

AIFinity focuses on one central question:

> **"Why am I making this mistake, and what should I learn next?"**

---

## � Live Demo

Check out the live demo: **[https://aifinity-frontend.onrender.com/](https://aifinity-frontend.onrender.com/)**

---

## �🏗️ System Architecture

```text
┌───────────────────────────────────────────────┐
│                   Student                     │
│        Assessments • Resume • Career Goal     │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│                    AIFinity                    │
│                                               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│  │ ConceptRoot│ │ MistakeMap │ │  SkillGap  │ │
│  │     AI     │ │     AI     │ │     AI     │ │
│  └────────────┘ └────────────┘ └────────────┘ │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
              Personalized Insights
                        │
                        ▼
              Learning / Career Roadmap
```

---

## 🛠️ Technology Stack

| Layer              | Technology           |
| ------------------ | -------------------- |
| Frontend           | React.js 19.2.8     |
| Styling            | Tailwind CSS 4.3.3   |
| Build Tool         | Vite 8.2.0           |
| Routing            | React Router DOM 7.18.2 |
| Icons              | Lucide React 1.33.0  |
| 3D Graphics        | Three.js 0.185.1     |
| Email Service      | EmailJS 4.4.1        |
| Charts             | Recharts 3.10.1      |
| Backend            | Node.js + Express.js 5.0.1 |
| Authentication     | JWT (jsonwebtoken 9.0.2) |
| Password Hashing   | bcryptjs 3.0.2       |
| API                | REST API             |
| AI                 | Google Generative AI 0.24.1 |
| AI                 | Groq SDK 1.6.0       |
| Database           | MongoDB (Mongoose 8.12.1) |
| Email              | Nodemailer 9.0.5     |
| Deployment         | Vercel + Render      |

---

## 📁 Project Structure

```text
AIFinity/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/
│   │   │   └── dashboard/
│   │   ├── pages/
│   │   │   └── admin/
│   │   ├── context/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── .oxlintrc.json
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── assessmentController.js
│   │   │   ├── authController.js
│   │   │   ├── conceptRootController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── mistakeMapController.js
│   │   │   ├── personalIntelligenceController.js
│   │   │   ├── roadmapController.js
│   │   │   └── skillGapController.js
│   │   ├── models/
│   │   │   ├── AdminSettings.js
│   │   │   ├── Assessment.js
│   │   │   ├── AttemptResult.js
│   │   │   ├── ChatMessage.js
│   │   │   ├── ChatSession.js
│   │   │   ├── ConceptRootAnalysis.js
│   │   │   ├── LearningContent.js
│   │   │   ├── SkillGapAnalysis.js
│   │   │   ├── User.js
│   │   │   └── UserRoadmap.js
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── analyticsRoutes.js
│   │   │   ├── assessmentRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── conceptRootRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   ├── mistakeMapRoutes.js
│   │   │   ├── personalIntelligenceRoutes.js
│   │   │   ├── roadmapRoutes.js
│   │   │   └── skillGapRoutes.js
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── scripts/
│   │   │   └── createAdmin.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── README.md
├── .gitignore
└── package-lock.json
```

---

## 🔐 Authentication & Data

AIFinity uses **JWT-based authentication** to provide secure access to user-specific functionality.

Application data, including users and assessments, is managed through **MongoDB Atlas**.

The platform is designed around real application data rather than relying on hard-coded mock users.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas account)
- **Groq API Key** (for AI features)
- **EmailJS credentials** (for contact form)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd project
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   Configure your `.env` file with the following variables:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/aifinity
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   COOKIE_SECRET=your_cookie_secret_key_here
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your_smtp_username
   SMTP_PASS=your_smtp_password
   MAIL_FROM=AIFinity <no-reply@example.com>
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   ```
   Configure your `.env` file with the following variables:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   VITE_EMAILJS_SERVICE_ID=your_service_id_here
   VITE_EMAILJS_TEMPLATE_ID=your_template_id_here
   VITE_EMAILJS_PUBLIC_KEY=your_public_key_here
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Creating an Admin User

To create an admin user, run:
```bash
cd backend
npm run create-admin
```

Follow the prompts to enter admin credentials.

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```

**Backend:**
```bash
cd backend
npm start
```

---

## 📊 Learning & Career Pipeline

```text
Assessment Attempts ────┐
                         │
Learning Progress ───────┤
                         │
Resume & Projects ───────┤
                         ├──► AIFinity AI
Career Goal ─────────────┤         │
                         │         ▼
Current Skills ──────────┘    Gap Analysis
                                   │
                                   ▼
                          Personalized Roadmap
```

AIFinity combines learning performance and career information to move beyond simple assessment scores and provide **actionable guidance**.

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify` - Verify authentication status

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/create-admin` - Create admin user
- `GET /api/admin/test` - Test admin authorization
- `GET /api/admin/settings` - Get admin settings
- `PUT /api/admin/settings` - Update admin settings

### Assessments
- `GET /api/assessments` - Get all assessments
- `GET /api/assessments/:id` - Get assessment by ID
- `POST /api/assessments` - Create assessment (Admin)
- `PUT /api/assessments/:id` - Update assessment (Admin)
- `DELETE /api/assessments/:id` - Delete assessment (Admin)
- `POST /api/assessments/:id/attempt` - Submit assessment attempt
- `GET /api/assessments/:id/results` - Get assessment results

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/recent-activity` - Get recent activity

### Analytics
- `GET /api/analytics/performance` - Get performance analytics
- `GET /api/analytics/trends` - Get learning trends

### ConceptRoot AI
- `POST /api/concept-root/analyze` - Analyze conceptual weaknesses
- `GET /api/concept-root/history` - Get analysis history

### MistakeMap AI
- `POST /api/mistake-map/analyze` - Analyze mistake patterns
- `GET /api/mistake-map/patterns` - Get mistake patterns

### SkillGap AI
- `POST /api/skill-gap/analyze` - Analyze skill gaps
- `GET /api/skill-gap/report` - Get skill gap report

### Personal Intelligence
- `POST /api/personal-intelligence/chat` - AI chat interaction
- `GET /api/personal-intelligence/sessions` - Get chat sessions

### Roadmap
- `GET /api/roadmap` - Get personalized roadmap
- `POST /api/roadmap/generate` - Generate new roadmap

---

## 🗄️ Database Models

### User
- `name` - User's full name
- `email` - User's email (unique)
- `password` - Hashed password
- `role` - User role (student/admin)
- `careerGoal` - Target career goal
- `resume` - Resume file path
- `skills` - Array of skills
- `projects` - Array of projects

### Assessment
- `title` - Assessment title
- `description` - Assessment description
- `category` - Assessment category
- `questions` - Array of questions
- `duration` - Time limit (minutes)
- `createdBy` - Admin user ID

### AttemptResult
- `userId` - User who attempted
- `assessmentId` - Assessment attempted
- `score` - Score obtained
- `totalScore` - Maximum possible score
- `answers` - User's answers
- `timeTaken` - Time taken to complete
- `completedAt` - Completion timestamp

### ConceptRootAnalysis
- `userId` - User ID
- `assessmentId` - Assessment ID
- `questionId` - Question ID
- `conceptGap` - Identified concept gap
- `rootCause` - Root cause analysis
- `prerequisites` - Missing prerequisites
- `recommendations` - Learning recommendations

### SkillGapAnalysis
- `userId` - User ID
- `careerGoal` - Target career
- `missingSkills` - Array of missing skills
- `recommendations` - Skill development recommendations
- `roadmap` - Learning roadmap

### UserRoadmap
- `userId` - User ID
- `careerGoal` - Career goal
- `milestones` - Learning milestones
- `resources` - Recommended resources
- `progress` - Progress tracking

---

## 📝 Available Scripts

### Backend
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run create-admin  # Create admin user interactively
```

### Frontend
```bash
npm run dev        # Start development server with Vite
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run oxlint for code linting
```

---

## 🎯 Expected Impact

AIFinity aims to help students:

* Understand the root cause of their mistakes
* Identify conceptual weaknesses
* Reduce repeated mistakes
* Track their learning progress
* Discover career-related skill gaps
* Prioritize what to learn next
* Follow a structured learning path
* Become better prepared for their target careers

---

## 🔮 Future Scope

The following capabilities can be expanded in future versions:

* 📄 Advanced resume analysis
* 👨‍🏫 Teacher/instructor dashboard
* 🎓 Expanded career-domain support
* 🎙️ Voice-based learning
* 📝 More adaptive assessment mechanisms
* 🤖 Deeper learning-behavior analytics
* 📚 Personalized resource recommendations

---

## 👥 Team

**AIFinity** is developed by:

* **Aman Negi**
* **Ishika Gaur**
* **Faiz Anwer**

---

## 📌 Project Vision

AIFinity is built around a simple idea:

> **Don't just measure what students know. Help them discover what they're missing.**

The goal is to transform student mistakes into **meaningful learning insights, targeted improvement, and better career readiness**.

---

## 📄 License

This project is developed as a team project for **educational and hackathon purposes**.

---

# AIFinity

### **From Mistakes to Meaningful Progress.** 🚀
