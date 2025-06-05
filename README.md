🏓 Ping Pong Table Manager
A modern, single-page React application designed for ping pong bars or clubs to manage table rentals. It features individual timers for multiple tables, automatic cost calculation, and a persistent session history logged directly to Google Sheets.

Note: Replace the image URL above with a real screenshot of your application! You can upload an image to a service like Imgur to get a link.

✨ Key Features
Dynamic Table Management: Easily manage up to 12 individual ping pong tables from a single screen.
Dual Timer Modes: Each table can be run on two modes:
Standard Timer: A stopwatch that counts up from zero.
Countdown: Pre-set a duration (e.g., 1 hour) and have the timer count down.
Automatic Cost Calculation: The app automatically calculates the cost based on the configured hourly rate.
Persistent State: Uses browser localStorage to save the state of all timers. You can refresh the page without losing any active sessions.
Cloud-Based Session History: All completed sessions are automatically logged to a designated Google Sheet, creating a permanent, cloud-based record.
Sound Notifications: Audio cues for when a countdown timer finishes or a session is cleared.
Modern, Responsive Design: A clean, flat, and stylish interface inspired by table tennis aesthetics, designed to be intuitive and easy to use on various screen sizes.
🛠️ Tech Stack
Frontend: React (via Vite)
Styling: Pure CSS with modern features (Grid, Flexbox, Custom Properties)
State Management: React Hooks (useState, useEffect, useCallback)
Backend/API: Google Apps Script (used as a serverless backend)
Database: Google Sheets
Utilities: uuid for unique session IDs
🚀 Getting Started
Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

Prerequisites

Node.js (v16 or later)
npm or yarn package manager
Installation

Clone the repository:

Bash
git clone https://github.com/your-username/ping-pong-manager.git
cd ping-pong-manager
 Install NPM packages:

Bash
npm install
 Set up the Google Sheets backend (see section below).

Create an environment file:

Create a file named .env in the root of your project.
Add your Google Apps Script Web App URL to this file:
VITE_APPS_SCRIPT_WEB_APP_URL="YOUR_COPIED_WEB_APP_URL_HERE"
The App.jsx file is already configured to use this environment variable. The .env file is included in .gitignore to prevent you from accidentally committing your secret URL.
Run the development server:

Bash
npm run dev
 Open http://localhost:5173 (or the address shown in your terminal) to view it in the browser.

⚙️ Backend Setup (Google Sheets & Apps Script)
This application uses Google Apps Script to log session history to a Google Sheet. You must set this up for the feature to work.

Create the Google Sheet:

Go to sheets.google.com and create a new blank spreadsheet.
Rename it to "Ping Pong Bar Sessions".
Rename the first tab (e.g., "Sheet1") to "Session History".
Create the Apps Script:

In your Google Sheet, go to Extensions > Apps Script.
A new script editor tab will open. Paste the script code provided in the project documentation (or from your existing Code.gs file).
Deploy the Script:

In the Apps Script editor, click Deploy > New deployment.
Click the gear icon (⚙️) and select Web app.
Configure the deployment with these exact settings:
Execute as: Me ([your email address])
Who has access: Anyone, even anonymous
Click Deploy.
Authorize the script when prompted (you may need to go through an "Advanced" -> "Go to (unsafe)" flow, which is safe as it's your own script).
Copy the generated Web app URL. This is the URL you will add to your .env file.
Important: If you ever modify the Apps Script code, you must re-deploy it by going to Deploy > Manage deployments, editing your deployment, and creating a New version.

Usage
Start a Timer: Click the "Start" button on any available table. A modal will appear allowing you to choose between a standard count-up timer or a count-down timer with a specified duration.
Stop a Timer: Click the "Stop" button on a running table to pause it and finalize the elapsed time.
Pay & Clear: Click the "Pay & Clear" button to end a session. This resets the table, logs the session to the local history, and sends the data to your Google Sheet.
Session History: View all locally saved sessions in the table at the bottom of the page.
📄 License
This project is licensed under the MIT License - see the LICENSE.md file for details.

Markdown
# MIT License

Copyright (c) 2025 MatchPoint

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

📧 Contact

Project Link: https://github.com/tcavaa/matchpoint