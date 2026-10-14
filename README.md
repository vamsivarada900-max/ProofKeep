

🛡️ ProofKeep — Warranty & Receipt Manager
<p align="center">
  <strong>Keep your receipts safe. Track your warranties. Never miss an expiry.</strong>
</p>

<p align="center">
  A full-stack web application to manage product purchases, store receipts securely, and track warranty periods from one dashboard.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React and TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js and Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas" />
  <img src="https://img.shields.io/badge/Cloudinary-Image%20Storage-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
</p>

📌 Table of Contents

📖 About the Project

✨ Features

🧰 Technology Stack

🏗️ System Architecture

📁 Project Structure

⚙️ Getting Started

🔐 Environment Variables

▶️ Running the Application

🔌 API Overview

🗺️ Roadmap

🤝 Contributing

👨‍💻 Author

📖 ABOUT THE PROJECT

ProofKeep is a warranty and receipt management web application designed to help users organize their purchased products and keep important purchase documents in one place.

Users can manage product information, upload receipt images, review warranty details, and identify warranties that are approaching expiry.

The application uses a React frontend, a Node.js and Express backend, MongoDB for persistent data storage, and Cloudinary for receipt image storage.

🎯 PROBLEM STATEMENT

People often lose physical receipts, forget warranty expiry dates, and struggle to find purchase information when they need repairs or replacements.

💡 SOLUTION

ProofKeep brings product records, digital receipts, and warranty information together in one accessible application.

✨ FEATURES

📊 Dashboard — View and organize registered products.

📦 Product Management — Add, view, edit, and delete product records.

🔐 User Authentication — Access user-specific product information.

👤 Data Ownership — Keep product records associated with their respective users.

🧾 Digital Receipt Storage — Upload and access receipt images.

☁️ Cloud Image Storage — Store receipt images using Cloudinary.

🗓️ Warranty Tracking — Record purchase dates and warranty durations.

⏰ Expiry Awareness — Identify warranties that are expired or approaching expiry.

📱 Responsive Interface — Use the application across supported screen sizes.

Note: Automated email reminders, production deployment, and comprehensive end-to-end testing are planned improvements until they have been implemented and verified.

## 🧰 TECHNOLOGY STACK

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + TypeScript | User interface |
| Styling | Tailwind CSS | Responsive design |
| Build Tool | Vite | Development and production builds |
| Backend | Node.js + Express.js | REST API |
| Database | MongoDB Atlas | Store application data |
| ODM | Mongoose | Database operations |
| Image Storage | Cloudinary | Store receipt images |
| HTTP Client | Axios | Frontend API requests |
| Version Control | Git + GitHub | Source control |

## 🏗️ SYSTEM ARCHITECTURE

```text
USER / BROWSER
       |
       v
FRONTEND: React + TypeScript + Vite
       |
       | HTTP / REST API
       v
BACKEND: Node.js + Express + TypeScript
       |
       +------------------+
       |                  |
       v                  v
DATABASE              IMAGE STORAGE
MongoDB Atlas         Cloudinary
Users & Products      Receipt Images
```
📁 PROJECT STRUCTURE

The project is organized into separate frontend and backend applications.



```text
ProofKeep/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── backend/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```
Important: This is a documentation example, not a guarantee that every listed folder or file exists in your current repository. Keep the actual file names and folders aligned with your code. For example, if Product.ts is directly inside backend/src, do not describe it as being inside a models folder unless you move it there.

⚙️ GETTING STARTED

Follow these instructions to run ProofKeep locally.

📋 PREREQUISITES

Install or prepare the following:

Node.js and npm

Git

A MongoDB Atlas account

A Cloudinary account for receipt image storage

1️⃣ Clone the Repository
git clone https://github.com/vamsivarada900-max/ProofKeep.git
cd ProofKeep
2️⃣ Install Backend Dependencies
cd backend
npm install
3️⃣ Configure Backend Environment Variables
Create a .env file inside the backend directory and add the variables required by your implementation.

Example template:

PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
Replace the example values with your own credentials. Variable names must match those referenced by your backend code. If your application uses different names or does not implement a particular feature, adjust this template accordingly. Never commit real credentials.

4️⃣ Install Frontend Dependencies
Open a second terminal at the project root:

cd frontend
npm install
5️⃣ Configure the Frontend API URL
If your frontend uses a Vite environment variable for the backend URL, create frontend/.env and configure the variable name expected by your code.

For example:

VITE_API_URL=http://localhost:5000
The exact variable name depends on your Axios configuration. Do not add this variable if the frontend currently uses a hardcoded API URL or a different environment variable without updating the code accordingly.

▶️ Running the Application
Start the backend and frontend in two separate terminals.

Terminal 1 — Backend
cd backend
npm run dev
The backend is expected to run on http://localhost:5000 if configured with port 5000.

Terminal 2 — Frontend
cd frontend
npm run dev
Open the local frontend URL printed by Vite, commonly:

http://localhost:5173

The commands above assume that the dev scripts exist in the corresponding package.json files.

🔐 ENVIRONMENTAL VARIABLES

Variable	Purpose
PORT	Backend server port
MONGODB_URI	MongoDB Atlas connection string
JWT_SECRET	Secret used for signing authentication tokens, if JWT is used
CLOUDINARY_CLOUD_NAME	Cloudinary account name
CLOUDINARY_API_KEY	Cloudinary API key
CLOUDINARY_API_SECRET	Cloudinary API secret
CLIENT_URL	Frontend origin allowed by backend CORS configuration
VITE_API_URL	Frontend API base URL, if used by the frontend
Only configure variables that your code actually uses. Keep .env files private and commit a safe .env.example template instead of real credentials.

🔌 API OVERVIEW

The backend exposes REST API endpoints for application operations.

The exact routes depend on your implementation. A typical product API may use the following pattern:

Method	Example Endpoint	Purpose
GET	/api/products	Retrieve products
POST	/api/products	Create a product
PUT	/api/products/:id	Update a product
DELETE	/api/products/:id	Delete a product
Authentication and receipt-upload endpoints may also be available.

Verify the actual routes in your backend before treating this table as a complete API reference.

🗺️ ROAD MAP

Initial full-stack application structure


Product management and dashboard


MongoDB integration


User authentication and product ownership


Receipt image storage integration


Warranty duration and expiry tracking


Automated email reminder delivery and verification


Comprehensive unit and end-to-end tests


Production deployment


Add verified application screenshots

Mark a task as completed only after testing the feature in the current version.

🔒 SECURITY CONSIDERATIONS

Store credentials in environment variables.

Never commit .env files or API secrets.

Validate incoming requests on the backend.

Protect private routes with authentication.

Verify resource ownership before allowing product updates or deletions.

Restrict upload types and file sizes.

Configure CORS for trusted frontend origins in production.

Use HTTPS for production deployments.

🤝 CONTRIBUTING

Contributions, suggestions, and bug reports are welcome.

Fork the repository.

Create a feature branch.

Implement and test your changes.

Commit your changes with a descriptive message.

Open a pull request.

👨‍💻 AUTHOR

VAMSI KRISHNA

B.Tech — Artificial Intelligence and Machine Learning

Vishnu Institute of Technology

🔗 GitHub: @vamsivarada900-max

📄 LICENSE

No license has been specified yet. Add a LICENSE file and update this section if you intend to distribute the project under an open-source license.

<p align="center">
  ⭐ If you find ProofKeep interesting, consider starring the repository!
</p>


