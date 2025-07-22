"use client"

import { useState, useEffect } from "react"
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
import { supabase } from "@/lib/supabaseClient";
import type { ViewType, FileItem, SmartFolder } from "@/app/page"
import { SmartFolderView } from "@/components/smart-folder-view";

export default function AppClient() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard")
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [selectedSmartFolder, setSelectedSmartFolder] = useState<SmartFolder | null>(null);
  const [searchQuery, setSearchQuery] = useState("")
  const [smartFolders, setSmartFolders] = useState<SmartFolder[]>([]);

  const { isModelLoaded } = useModel();

  const fetchSmartFolders = async () => {
    const { data, error } = await supabase
      .from('smart_folders')
      .select('*')
      .eq('user_identifier', 'samcr');

    if (error) {
      console.error('Error fetching smart folders:', error);
    } else {
      const colors = ['from-purple-500 to-purple-700', 'from-blue-500 to-blue-700', 'from-green-500 to-green-700', 'from-yellow-500 to-yellow-700', 'from-red-500 to-red-700'];
      const dataWithColors = data.map((folder, index) => ({ ...folder, color: colors[index % colors.length] }));
      setSmartFolders(dataWithColors);
    }
  };

  useEffect(() => {
    fetchSmartFolders();
  }, []);

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
            smartFolders={smartFolders}
            onSmartFolderCreated={fetchSmartFolders}
          />
        )
      case "explorer":
        return (
          <SemanticExplorer
            onFileSelect={setSelectedFile}
            onViewChange={setCurrentView}
          />
        )
      case "search":
        return <SearchInterface query={searchQuery} onQueryChange={setSearchQuery} onFileSelect={setSelectedFile} />
      case "document":
        return <DocumentPanel file={selectedFile} onClose={() => setCurrentView("dashboard")} />
      case "smart-folder":
        return <SmartFolderView folder={selectedSmartFolder!} onBack={() => setCurrentView("dashboard")} onFileSelect={setSelectedFile} />
      default:
        return (
          <Dashboard
            onViewChange={setCurrentView}
            onFileSelect={setSelectedFile}
            smartFolders={smartFolders}
            onSmartFolderCreated={fetchSmartFolders}
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
          smartFolders={smartFolders}
          onSmartFolderSelect={(folder) => {
            setSelectedSmartFolder(folder);
            setCurrentView("smart-folder");
          }}
        />
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors" />
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">Bench</h1>
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
