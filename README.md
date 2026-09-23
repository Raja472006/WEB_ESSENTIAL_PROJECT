# NutriTrack – Food & Nutrition Tracker
> **Web Essentials Mini Project** — A full-stack, responsive web application for comprehensive dietary and macronutrient monitoring, goal tracking, and health metrics calculation.

---

## 📌 Project Overview
**NutriTrack** is built to bridge personal wellness and modern web technology. It allows users to register secure accounts, set personalized caloric and macronutrient budgets (protein, carbohydrates, fat), track daily meals across meal types, monitor water hydration with interactive visual counters, inspect historical trends with Chart.js, calculate Body Mass Index (BMI) dynamically, and perform complete CRUD operations on their food logs.

---

## ✨ Features
1. **Secure Authentication & Authorization**
   - User registration with profile stats (Age, Gender, Height, Weight).
   - Password hashing with 10 salt rounds via **bcryptjs**.
   - Stateless **JSON Web Token (JWT)** session management.
   - Protected API routes and automatic redirection upon session expiry.
2. **Interactive Real-Time Dashboard**
   - Live greeting with user's name and formatted date.
   - 4 KPI Nutrition Cards: **Calories, Protein, Carbohydrates, Fat** (consumed vs daily goal, percentage, and animated progress bars).
   - Dynamic Doughnut Chart for daily macronutrient ratio (Protein vs Carbs vs Fat).
   - Weekly Calories Bar Chart displaying consumption across days.
   - Intelligent Empty State (`"No food logged today"`) with quick meal logging action.
3. **Food Database & Smart Meal Logging**
   - 22+ pre-seeded Indian & global staples catalog (Idli, Dosa, Rice, Chapati, Chicken Breast, Egg, Milk, Curd, Paneer, Oats, Fish, Dal, etc.).
   - Auto-filling nutrient values upon food selection.
   - Full support for entering custom meals and editing quantities.
4. **Today's Meals CRUD Operations**
   - Complete tabular overview of today's consumed items.
   - Inline/Modal editing of food records with real-time updates.
   - Deletion of records with confirmation dialogs.
   - User isolation ensuring users can only read, edit, or delete their own records.
5. **Hydration (Water) Tracker**
   - Visual interactive water bottle fill animation.
   - One-click `+ Add Glass` and `- Remove Glass` buttons with instant database persistence.
   - Hydration streak and encouragement tips.
6. **Customizable Nutrition Goals**
   - Manage target Calories, Protein, Carbohydrates, Fat, and Water intake.
   - Live percentage preview calculating caloric equivalents ($4\text{ kcal/g}$ protein, $4\text{ kcal/g}$ carbs, $9\text{ kcal/g}$ fat).
7. **Nutritional History & Filtering**
   - Filter records by **Today**, **Last 7 Days**, **Last 30 Days**, or **Custom Date Range**.
   - Historical multi-axis line chart tracking calories and macronutrients over time.
8. **User Profile & Automatic BMI Calculator**
   - Live recalculation of Body Mass Index: $\text{BMI} = \frac{\text{Weight (kg)}}{(\text{Height (m)})^2}$.
   - Automatic classification into Underweight, Normal, Overweight, or Obesity with colored badges.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Modern Responsive Flexbox/Grid), JavaScript (ES6+), FontAwesome Icons, Chart.js CDN |
| **Backend** | Node.js, Express.js REST API |
| **Security** | bcryptjs, jsonwebtoken (JWT), CORS, Parameterized SQL Queries |
| **Database** | MySQL (with seamless embedded fallback for instant zero-configuration testing) |

---

## 📁 Project Structure

```text
food-nutrition-tracker/
├── frontend/
│   ├── index.html           # Landing page with hero, features, how it works, about, footer
│   ├── login.html           # Secure login with show/hide password and error handling
│   ├── register.html        # Registration with age, gender, height, weight & validation
│   ├── dashboard.html       # Main dashboard: 4 metric cards, 2 real-time Chart.js charts
│   ├── add-food.html        # Add food form with search/preset food picker & custom entry
│   ├── today.html           # Today's meals table with inline/modal edit and delete CRUD
│   ├── history.html         # Weekly/Monthly/Custom history with charts and daily aggregates
│   ├── goals.html           # Nutrition & water daily targets management
│   ├── water.html           # Interactive visual water intake tracker (+ / - glass buttons)
│   ├── profile.html         # User profile manager & automatic real-time BMI calculator
│   ├── css/
│   │   ├── style.css        # Core design system: colors, typography, layout, buttons, badges
│   │   ├── auth.css         # Auth screens: glass cards, floating inputs, alert banners
│   │   └── dashboard.css    # Dashboard layout: sidebar, cards, progress bars, tables, charts
│   └── js/
│       ├── api.js           # Centralized fetch client (JWT injection, error & 401 handling)
│       ├── auth.js          # Handles login, registration, token persistence & logout
│       ├── dashboard.js     # Loads dashboard summary cards & initializes Chart.js
│       ├── food.js          # Handles food presets, add food form, today's meals CRUD
│       ├── history.js       # History filters (7 days, 30 days, custom) & history charts
│       ├── goals.js         # Nutrition targets GET/PUT handlers
│       ├── water.js         # Water intake increment/decrement & visual animation
│       └── profile.js       # Profile update & BMI formula computation
├── backend/
│   ├── server.js            # Express app, CORS, static file serving, route registration
│   ├── config/
│   │   └── database.js      # MySQL connection pool + auto-table initialization & fallback
│   ├── middleware/
│   │   └── authMiddleware.js# JWT verification middleware protecting private endpoints
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── foodRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── goalRoutes.js
│   │   ├── waterRoutes.js
│   │   ├── historyRoutes.js
│   │   └── profileRoutes.js
│   └── controllers/
│       ├── authController.js
│       ├── foodController.js
│       ├── dashboardController.js
│       ├── goalController.js
│       ├── waterController.js
│       ├── historyController.js
│       └── profileController.js
├── database/
│   └── nutrition_tracker.sql # Complete MySQL database schema + 22+ food presets
├── .env.example
├── .env
├── package.json
└── README.md
```

---

## ⚙️ System Requirements
- **Node.js**: v16.0.0 or higher (v24.x tested)
- **npm**: v8.0.0 or higher
- **MySQL / MariaDB**: v5.7+ or v8.0+ (optional if using the built-in embedded fallback)
- Modern web browser (Chrome, Edge, Firefox, Safari)

---

## 🚀 Installation & Setup

### 1. Clone or Open Project Directory
```bash
cd food-nutrition-tracker
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Database Setup (MySQL)
Start your local MySQL service (e.g. via XAMPP, WampServer, or native MySQL Windows service) and import the schema:
```bash
mysql -u root -p < database/nutrition_tracker.sql
```
*(Note: If MySQL is not currently running, NutriTrack includes an automatic seamless failover to an embedded SQLite engine so you can run, test, and grade the project instantly without setup barriers).*

### 4. Configure Environment Variables
Copy `.env.example` to `.env` (already created by default):
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=nutrition_tracker
JWT_SECRET=supersecretnutritracktokenjwtkey2025
```

---

## ▶️ Running the Application

### Start the Unified Full-Stack Application:
```bash
npm start
```
The server will start on port `5000`:
- **Landing Page**: [http://localhost:5000](http://localhost:5000)
- **Login Page**: [http://localhost:5000/login.html](http://localhost:5000/login.html)
- **Register Page**: [http://localhost:5000/register.html](http://localhost:5000/register.html)
- **Dashboard**: [http://localhost:5000/dashboard.html](http://localhost:5000/dashboard.html)

*(The Express backend serves the static frontend directly from `frontend/`, allowing single-command startup. CORS is also enabled if serving frontend via Live Server on port 5500).*

---

## 📡 REST API Documentation

### Authentication Endpoints
- `POST /api/auth/register` — Registers new user and sets default nutrition targets.
- `POST /api/auth/login` — Validates credentials and returns JWT bearer token.
- `GET /api/auth/me` *(Protected)* — Returns currently logged in user info.

### Food & Meals Endpoints
- `GET /api/foods` — Returns catalog of preset foods for searching and selection.
- `POST /api/food-logs` *(Protected)* — Adds a meal record (`food_name`, `meal_type`, `calories`, `protein`, `carbohydrates`, `fat`, `quantity`).
- `GET /api/food-logs/today` *(Protected)* — Fetches today's logged meals and computed macronutrient totals.
- `GET /api/food-logs` *(Protected)* — Returns logs filtered by date or recent history.
- `PUT /api/food-logs/:id` *(Protected)* — Updates an existing food record (with user ownership check).
- `DELETE /api/food-logs/:id` *(Protected)* — Deletes a food record (with user ownership check).

### Dashboard & Analytics Endpoints
- `GET /api/dashboard` *(Protected)* — Returns today's consumed macros vs goals, percentages, 7-day weekly calories array, and recent logs.
- `GET /api/history` *(Protected)* — Query parameters: `period=today|7days|30days|custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`. Returns daily aggregates and chart series.

### Goals Endpoints
- `GET /api/goals` *(Protected)* — Returns user's daily goals.
- `PUT /api/goals` *(Protected)* — Updates user's daily targets for calories, protein, carbs, fat, and water.

### Water Endpoints
- `GET /api/water/today` *(Protected)* — Returns today's water intake in glasses.
- `POST /api/water` / `PUT /api/water` *(Protected)* — Increments, decrements, or sets today's water count.

### Profile Endpoints
- `GET /api/profile` *(Protected)* — Returns user details and calculated BMI with classification.
- `PUT /api/profile` *(Protected)* — Updates name, age, gender, height, and weight with live BMI re-computation.

---

## 📷 Screenshots Placeholder
- **Landing Page**: Hero presentation with feature showcase and responsive navigation.
- **Dashboard**: Real-time progress cards, Chart.js Doughnut macro breakdown, and weekly calorie histogram.
- **Add Food**: Instant auto-fill catalog dropdown and custom food entry.
- **Today's Meals**: Complete CRUD table with inline edit and delete confirmation dialogs.
- **Water Tracker**: Interactive bottle level meter and glass grid.
- **Profile & BMI**: Biological statistics and dynamic BMI gauge.

---

## 🔮 Future Enhancements
- Integration with third-party barcode scanning API (e.g. OpenFoodFacts).
- Export nutrition reports to PDF / CSV for medical consultations.
- Meal planning and recipe generation based on leftover macro targets.
- Progressive Web App (PWA) offline support and hydration push notifications.

---

## 👨‍🎓 Academic Submission Details
- **Project Title**: NutriTrack – Food & Nutrition Tracker
- **Subject**: Web Essentials Mini Project
- **Architecture**: Model-View-Controller (MVC) Full-Stack Web Application
