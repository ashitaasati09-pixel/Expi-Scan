Now build the BACKEND IMPLEMENTATION for the existing Expi-Scan web application.

IMPORTANT:
The frontend UI is already completed. DO NOT redesign, replace, or modify the existing frontend pages, colors, layout, navigation, typography, or components. Keep the current frontend exactly as it is.

I want to make the existing Expi-Scan frontend fully functional by connecting it with a backend and database.

PROJECT:
Expi-Scan – Medicine Expiry Detection & Smart Medicine Management System

BACKEND STACK:
- Next.js
- TypeScript
- Node.js runtime
- MongoDB
- Mongoose
- REST API routes
- Authentication

IMPLEMENT THE FOLLOWING:

1. USER AUTHENTICATION
Create backend functionality for:
- User registration
- User login
- Logout
- User profile
- Secure password handling
- User-specific data

Each user's medicines, prescriptions, reminders and refill requests must be associated with their user account.

2. MEDICINE MANAGEMENT
Connect the existing “My Medicines” and “Add Medicine” pages to the backend.

Create CRUD functionality:
- Add medicine
- View medicines
- Edit medicine
- Delete medicine
- View medicine details

Store:
- Medicine name
- Usage
- Manufacturing date
- Expiry date
- Quantity
- User ID
- Source (manual/scan)
- Created date

Automatically calculate medicine status:
- VALID
- NEAR EXPIRY
- EXPIRED

3. MEDICINE SCAN
Connect the existing medicine scanning feature with the backend.

When a medicine is scanned:
- Receive the detected medicine information
- Extract readable medicine name, expiry date and other available information
- Show the result to the user
- Allow the user to confirm the information
- Save the confirmed medicine to MongoDB

DO NOT use the term “OCR” anywhere in the interface or documentation.

Use the wording:
“Digitally extracted readable medicine information.”

4. PRESCRIPTION MANAGEMENT
Connect the existing “Prescriptions” section.

Allow users to:
- Upload a doctor's prescription
- Store prescription information
- View prescription history
- Delete prescriptions
- View extracted prescription details

Digitally extract readable:
- Medicine names
- Dosage instructions
- Frequency
- Duration
- Prescription-related information

Store the prescription information securely and associate it with the logged-in user.

5. REMINDERS
Connect the existing “Reminders” section.

Create backend functionality for:
- Medicine consumption reminders
- Expiry reminders
- Prescription reminders

Store:
- Medicine/prescription
- Reminder type
- Date
- Time
- Reminder status
- User ID

6. NOTIFICATIONS
Connect the existing notification system.

Generate notifications when:
- Medicine is approaching expiry
- Medicine has expired
- A medicine reminder is due
- A prescription reminder is due
- A refill may be required

Show notification count in the existing navbar notification icon.

7. REFILL MANAGEMENT
Create backend functionality for medicine refill requests.

A user should be able to:
- Select a medicine
- Enter required quantity
- Create a refill request
- View request status

Statuses:
- Pending
- Contacted
- Completed

8. MEDICAL STORE MANAGEMENT
Connect the existing “Medical Stores” page with backend data.

Store:
- Store name
- Location
- Contact information
- Refill support
- Availability/status

Allow users to view nearby medical stores and directly interact/contact the store for refill assistance.

9. DASHBOARD
Connect the existing Dashboard with real database data.

Display:
- Total medicines
- Valid medicines
- Near-expiry medicines
- Expired medicines
- Active prescriptions
- Pending refill requests
- Recent notifications
- Recent medicine activity

Do not use dummy/static data after backend integration.

10. DATABASE MODELS

Create suitable MongoDB/Mongoose models for:

User
Medicine
Prescription
Reminder
Notification
RefillRequest
MedicalStore

Use proper relationships through userId and relevant document IDs.

11. API STRUCTURE

Create clean REST API routes such as:

/api/auth
/api/medicines
/api/medicines/[id]
/api/medicines/scan
/api/prescriptions
/api/prescriptions/[id]
/api/reminders
/api/notifications
/api/refills
/api/medical-stores
/api/profile

Use GET, POST, PUT/PATCH and DELETE wherever appropriate.

12. FRONTEND CONNECTION

Connect the existing frontend components to these backend routes.

For example:

Add Medicine
→ POST medicine data
→ MongoDB
→ Return saved medicine
→ Update My Medicines

My Medicines
→ GET user's medicines
→ Display real records

Delete Medicine
→ DELETE request
→ Remove from MongoDB
→ Update UI

Prescription Upload
→ Backend processing
→ Save prescription information
→ Display in Prescriptions

Reminder
→ Save reminder
→ Generate notification
→ Display in Notifications

Refill
→ Create refill request
→ Store request
→ Show status to user

13. ERROR HANDLING

Add proper handling for:
- Invalid login
- Missing medicine information
- Invalid dates
- Expired sessions
- Database errors
- Failed uploads
- Empty records

Show simple user-friendly error messages.

14. SECURITY

Implement basic security practices:
- Authentication
- Password hashing
- User-specific data access
- Protected backend routes
- Input validation
- Do not expose passwords or sensitive credentials

15. IMPORTANT DESIGN RULE

DO NOT CREATE A NEW FRONTEND.

DO NOT CHANGE THE CURRENT Expi-Scan DESIGN.

The current Figma frontend is already approved.

Only add the backend implementation and connect the existing UI to real backend functionality.

The final result should make Expi-Scan a working full-stack application:

USER
↓
EXPI-SCAN FRONTEND
↓
NEXT.JS BACKEND
↓
REST API
↓
MONGODB DATABASE
↓
MEDICINES / PRESCRIPTIONS / REMINDERS / NOTIFICATIONS / REFILLS