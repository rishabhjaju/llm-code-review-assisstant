# LLM Code Review Assistant

A professional Next.js 15 application for LLM-powered code review with Monaco editor integration.

## ✨ Features

- 🚀 **Next.js 15** with App Router
- 💻 **Monaco Editor** integration with syntax highlighting
- 🤖 **LLM-powered** code analysis
- 📁 **Drag & Drop** file upload
- 📊 **Real-time metrics** and analysis
- 🎨 **Professional UI** with Tailwind CSS
- 🔧 **TypeScript** for type safety
- 📱 **Responsive design** for all devices

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Editor**: Monaco Editor
- **Icons**: Lucide React
- **Backend**: FastAPI (separate project)

## 📋 Prerequisites

- Node.js 18.18 or later
- npm or yarn package manager
- VS Code (recommended)

## 🚀 Quick Start

1. **Clone or extract the project**
   ```bash
   cd llm-code-review-nextjs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 🏗 Project Structure

```
llm-code-review-nextjs/
├── app/                    # Next.js 15 app router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Welcome page
│   ├── dashboard/         
│   │   └── page.tsx       # Dashboard page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   └── input.tsx
│   ├── WelcomeForm.tsx    # Welcome page form
│   ├── DashboardLayout.tsx # Dashboard layout
│   ├── FileUpload.tsx     # File upload component
│   ├── CodeEditor.tsx     # Monaco editor wrapper
│   └── MetricsPanel.tsx   # Analysis results panel
├── lib/                   # Utility functions
│   ├── utils.ts           # Helper functions
│   └── api.ts             # API client
├── types/                 # TypeScript types
│   └── index.ts
├── public/                # Static assets
└── Configuration files...
```

## 🎯 Usage

### Welcome Page
1. Visit the home page
2. Choose between:
   - **Temporary Use**: Quick analysis without API key
   - **Large File**: Advanced features with your API key

### Dashboard
1. Upload code files via drag & drop or file picker
2. Edit code in the Monaco editor
3. Click "Analyze Code" to get LLM-powered insights
4. View metrics, issues, and suggestions
5. Save your work

### Supported File Types
- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp)
- C# (.cs)
- PHP (.php)
- Ruby (.rb)
- Go (.go)
- Rust (.rs)
- And many more...

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file with:

```env
# LLM API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME="LLM Code Review Assistant"
NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Customization

- **Colors**: Edit `tailwind.config.js` to change the theme
- **Editor**: Modify `components/CodeEditor.tsx` for editor settings
- **API**: Update `lib/api.ts` for backend integration

## 🚀 Production Deployment

### Build the application
```bash
npm run build
```

### Start production server
```bash
npm run start
```

### Deploy to Vercel
```bash
npx vercel deploy
```

## 🔗 Backend Integration

This frontend is designed to work with a FastAPI backend. To set up the backend:

1. Create a separate FastAPI project
2. Implement the following endpoints:
   - `POST /api/analyze` - Code analysis
   - `POST /api/upload` - File upload
   - `GET /api/health` - Health check

3. Update `NEXT_PUBLIC_API_URL` in your environment variables

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide React](https://lucide.dev/) - Icon library

## 🐛 Troubleshooting

### Common Issues

1. **Monaco Editor not loading**
   - Check if webpack configuration is correct
   - Ensure proper imports in the component

2. **API connection issues**
   - Verify `NEXT_PUBLIC_API_URL` in environment variables
   - Check if backend server is running

3. **Build errors**
   - Run `npm run type-check` to identify TypeScript issues
   - Check for missing dependencies

### Support

For issues and questions:
1. Check the troubleshooting section
2. Review the documentation
3. Create an issue on GitHub

---

Made with ❤️ using Next.js 15 and modern web technologies.
