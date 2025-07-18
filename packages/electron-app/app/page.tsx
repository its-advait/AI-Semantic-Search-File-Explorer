"use client"

import { useState } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Dashboard } from "@/components/dashboard"
import { SemanticExplorer } from "@/components/semantic-explorer"
import { SearchInterface } from "@/components/search-interface"
import { DocumentPanel } from "@/components/document-panel"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Settings, HelpCircle, AppWindowIcon as Apps } from "lucide-react"
import { AiAssistant } from "@/components/ai-assistant"
import { ModelProvider, useModel } from "@/components/model-provider"
import { Loading } from "@/components/ui/loading"

export type ViewType = "dashboard" | "explorer" | "search" | "document"

export interface FileItem {
  id: string
  filename: string
  filepath: string
  date_created: string
  date_modified: string
  type?: "document" | "image" | "code" | "video" | "audio" | "other" | "folder" // Keep for UI, can be derived
  size?: string // Keep for UI, can be derived
  vectorGroup?: string // Keep for UI, can be derived
  similarity?: number
  preview?: string
  x?: number
  y?: number
}

export default function Home() {
  return (
    <ModelProvider>
      <HomeContent />
    </ModelProvider>
  );
}

function HomeContent() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const { isModelLoaded } = useModel();

  if (!isModelLoaded) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loading />
        <p className="ml-4 text-lg">Loading AI model...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            onViewChange={setCurrentView}
            onFileSelect={setSelectedFile}
            // Removed onGroupSelect prop
          />
        )
      case "explorer":
        return (
          <SemanticExplorer
            onFileSelect={setSelectedFile}
            onViewChange={setCurrentView}
            // Removed initialSelectedGroup prop
          />
        )
      case "search":
        return <SearchInterface query={searchQuery} onQueryChange={setSearchQuery} onFileSelect={setSelectedFile} />
      case "document":
        return <DocumentPanel file={selectedFile} onClose={() => setCurrentView("dashboard")} />
      default:
        return (
          <Dashboard
            onViewChange={setCurrentView}
            onFileSelect={setSelectedFile}
            // Removed onGroupSelect prop
          />
        )
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white dark:bg-gray-900">
        <AppSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onFileSelect={setSelectedFile}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <div className="flex-1 flex flex-col">
          {/* Google Drive Style Header */}
          <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" />
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">LibrAIry</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="p-2">
                <HelpCircle className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <Apps className="w-5 h-5" />
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-hidden bg-white dark:bg-gray-900">{renderContent()}</main>
        </div>
        <AiAssistant />
      </div>
    </SidebarProvider>
  )
}
