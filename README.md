/pacs-admin-tools
├── lib/
│ ├── db.js
│ ├── session.js
├── components/
│ ├── Layout.js
│ ├── NavMenu.js
├── pages/
│ ├── index.js # Dashboard
│ ├── pacsutilization.js # PACSUtilization Page
│ ├── worklist.js # WorklistTools Page (ของเดิม)
│ ├── setting.js # Setting Page
│ ├── login.js
│ ├── api/
│ │ ├── login.js
│ │ ├── logout.js
│ │ ├── worklist.js
│ │ ├── pacsutilization.js # ✅ เพิ่มใหม่
│ └── \_app.js
└── package.json

npm install lucide-react
npm install xlsx file-saver
npm install axios
npm install date-fns
npm install recharts
npm install bcryptjs

docker run -d -p 80:3000 --name pacs-admin-container --restart unless-stopped --env-file /Users/kritsadaromsri/DevpCode/WorklistTools/pacs.env pacs-admin-app
