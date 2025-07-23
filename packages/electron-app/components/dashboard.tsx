"use client"
import { Card, CardContent } from "@/components/ui/card"
import type React from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Briefcase,
  Brain,
  Tag,
  Layers,
  Grid3X3,
  List,
  Info,
  FlipVerticalIcon as MoreVert,
  Star,
  FileText,
  Folder,
  ImageIcon,
  Code,
  Video,
  Music,
  CalendarDays,
  CheckCircle,
  Sparkles,
  Loader2,
} from "lucide-react"
import type { ViewType, FileItem } from "@/app/page"
import { Badge } from "@/components/ui/badge"

import { supabase } from "@/lib/supabaseClient";

import type { ViewType, FileItem, SmartFolder } from "@/app/page"

interface DashboardProps {
  onViewChange: (view: ViewType) => void
  onFileSelect: (file: FileItem) => void
  smartFolders: SmartFolder[];
  onSmartFolderCreated: () => void;
  // Removed onGroupSelect prop
}

const recentFiles = [
  {
    id: "1",
    name: "Q4 Marketing Strategy.pdf",
    type: "document",
    size: "2.4 MB",
    modified: "2 hours ago",
    owner: "You",
    icon: FileText,
    thumbnail: "/placeholder.svg?height=120&width=120",
    tags: ["Marketing", "Strategy", "Q4", "PDF"],
    aiSuggestion: "Suggest related documents",
    aiConfidence: 95,
    category: "Work Projects",
    date: "2024-10-26T10:00:00Z",
  },
  {
    id: "2",
    name: "Budget Analysis 2024",
    type: "folder",
    size: "12 items",
    modified: "Yesterday",
    owner: "You",
    icon: Folder,
    thumbnail: "/placeholder.svg?height=120&width=120",
    tags: ["Finance", "Budget", "2024"],
    aiSuggestion: "Summarize key financial insights",
    aiConfidence: 88,
    category: "Finance", // Reverted
    date: "2024-10-25T14:30:00Z",
  },
  {
    id: "3",
    name: "Team Photos - Retreat",
    type: "image",
    size: "45 items",
    modified: "3 days ago",
    owner: "You",
    icon: ImageIcon,
    thumbnail: "/placeholder.svg?height=120&width=120",
    tags: ["Personal", "Photos", "Team", "Retreat"],
    aiSuggestion: "Create a photo album",
    aiConfidence: 70,
    category: "Personal", // Reverted
    date: "2024-10-23T09:15:00Z",
  },
  {
    id: "4",
    name: "Project Timeline.xlsx",
    type: "document",
    size: "890 KB",
    modified: "1 week ago",
    owner: "You",
    icon: FileText,
    thumbnail: "/placeholder.svg?height=120&width=120",
    tags: ["Project", "Timeline", "Excel"],
    aiSuggestion: "Extract project milestones",
    aiConfidence: 92,
    category: "Work Projects",
    date: "2024-10-19T16:45:00Z",
  },
  {
    id: "5",
    name: "Meeting Notes - Jan",
    type: "document",
    size: "156 KB",
    modified: "2 weeks ago",
    owner: "You",
    icon: FileText,
    thumbnail: "/placeholder.svg?height=120&width=120",
    tags: ["Meeting", "Notes", "January"],
    aiSuggestion: "Identify action items",
    aiConfidence: 85,
    category: "Work Projects",
    date: "2024-10-12T11:00:00Z",
  },
  {
    id: "6",
    name: "Design Assets - Website",
    type: "image",
    size: "23 items",
    modified: "3 weeks ago",
    owner: "You",
    icon: ImageIcon,
    thumbnail: "/placeholder.svg?height=120&width=120",
    tags: ["Design", "Website", "Assets"],
    aiSuggestion: "Optimize images for web",
    aiConfidence: 78,
    category: "Creative", // Reverted
    date: "2024-10-05T13:00:00Z",
  },
  {
    id: "7",
    name: "Research Paper - AI Ethics.pdf",
    type: "document",
    size: "5.6 MB",
    modified: "1 month ago",
    owner: "You",
    icon: FileText,
    thumbnail: "/placeholder.svg?height=120&width=120",
    tags: ["Research", "AI", "Ethics", "PDF"],
    aiSuggestion: "Summarize key arguments",
    aiConfidence: 98,
    category: "Research",
    date: "2024-09-26T09:00:00Z",
  },
  {
    id: "8",
    name: "Python Script - Data Cleanup.py",
    type: "code",
    size: "12 KB",
    modified: "1 month ago",
    owner: "You",
    icon: Code,
    thumbnail: "/placeholder.svg?height=120&width=120",
    tags: ["Code", "Python", "Data"],
    aiSuggestion: "Suggest code improvements",
    aiConfidence: 90,
    category: "Development", // Reverted
    date: "2024-09-20T17:00:00Z",
  },
]

const quickAccess = [
  {
    name: "Finance",
    icon: Briefcase,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    count: "234 files",
    shelfStyle: "bg-gradient-to-br from-gray-700 to-gray-900 text-white border-gray-600 shadow-lg",
  },
  {
    name: "Creative",
    icon: Star,
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    count: "156 files",
    shelfStyle: "bg-gradient-to-br from-amber-700 to-amber-900 text-white border-amber-600 shadow-lg",
  },
  {
    name: "Documents",
    icon: FileText,
    color: "text-green-600",
    bgColor: "bg-green-50",
    count: "89 files",
    shelfStyle: "bg-gradient-to-br from-slate-200 to-slate-400 text-gray-800 border-slate-300 shadow-lg",
  },
  {
    name: "Development",
    icon: Code,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    count: "67 files",
    shelfStyle: "bg-gradient-to-br from-purple-700 to-purple-900 text-white border-purple-600 shadow-lg",
  },
]

export function Dashboard({ onViewChange, onFileSelect, smartFolders, onSmartFolderCreated }: DashboardProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAutoSorting, setIsAutoSorting] = useState(false)
  const [isCreatingSmartFolder, setIsCreatingSmartFolder] = useState(false);
  const [isCreatingTopicFolder, setIsCreatingTopicFolder] = useState(false);
  const [topic, setTopic] = useState("");
  const [smartFolderResult, setSmartFolderResult] = useState<any>(null);
  const [smartFolderError, setSmartFolderError] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onViewChange("search")
  }

  const handleFileClick = (file: any) => {
    const fileItem: FileItem = {
      id: file.id,
      name: file.name,
      type: file.type === "folder" ? "document" : file.type, // Assuming folders open as documents for now
      size: file.size,
      modified: file.modified,
      path: "/",
      vectorGroup: file.category,
      preview: file.thumbnail,
      content: "Mock content for " + file.name,
    }
    onFileSelect(fileItem)
    onViewChange("document")
  }

  const handleAutoSort = () => {
    setIsAutoSorting(true)
    setTimeout(() => {
      setIsAutoSorting(false)
      // In a real app, this would trigger the actual sorting logic
      alert("Files auto-sorted! (Mock action)")
    }, 2000)
  }

  const handleCreateSmartFolder = async () => {
    setIsCreatingSmartFolder(true);
    setSmartFolderError(null);
    setSmartFolderResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('organize-files', {
        body: { user_identifier: 'samcr' } // Assuming 'samcr' for now
      });

      if (error) throw error;

      setSmartFolderResult(data);
      onSmartFolderCreated(); // Call the callback to refresh the sidebar
    } catch (err: any) {
      setSmartFolderError(err.message);
    } finally {
      setIsCreatingSmartFolder(false);
    }
  };

  const handleCreateTopicFolder = async () => {
    if (!topic) return;
    setIsCreatingTopicFolder(true);
    setSmartFolderError(null);
    setSmartFolderResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-topic-folder', {
        body: { user_identifier: 'samcr', topic },
      });

      if (error) throw error;

      setSmartFolderResult(data);
      onSmartFolderCreated();
    } catch (err: any) {
      setSmartFolderError(err.message);
    } finally {
      setIsCreatingTopicFolder(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4" />
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "code":
        return <Code className="w-4 h-4" />
      case "video":
        return <Video className="w-4 h-4" />
      case "audio":
        return <Music className="w-4 h-4" />
      case "folder":
        return <Folder className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Top Search Bar - Google Drive Style */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSearchSubmit} className="max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search in Bench"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 text-base rounded-full border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 bg-gray-50 dark:bg-gray-800"
              onFocus={() => onViewChange("search")}
            />
          </div>
        </form>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Quick Access Section - Themed Shelves */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Your Smart Shelves</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 [column-fill:_balance]">
              {quickAccess.map((item, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer hover:shadow-xl transition-all duration-300 border ${item.shelfStyle}`}
                  onClick={() => onViewChange("explorer")} // Reverted to original behavior
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center h-32">
                    <div className={`p-3 rounded-full mb-2 ${item.bgColor} dark:bg-gray-700/50`}>
                      <item.icon className={`w-6 h-6 ${item.color} dark:text-gray-300`} />
                    </div>
                    <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                    <p className="text-sm opacity-80">{item.count}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="mt-8 mb-8">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Suggested</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-fade-in-slide-up"
                style={{ animationDelay: "0s" }}
                onClick={() => onViewChange("explorer")}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-gray-700">
                      <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">Explore by similarity</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">See your files grouped by content</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-fade-in-slide-up col-span-1 md:col-span-2"
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-gray-700">
                      <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">Create Folder from Topic</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">e.g., "Photos from my trip to Japan"</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Input 
                      placeholder="Enter a topic..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                    <Button onClick={handleCreateTopicFolder} disabled={isCreatingTopicFolder || !topic}>
                      {isCreatingTopicFolder ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-fade-in-slide-up"
                style={{ animationDelay: "0.3s" }}
                onClick={handleCreateSmartFolder}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-50 dark:bg-gray-700">
                      {isCreatingSmartFolder ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 dark:border-yellow-400"></div>
                      ) : (
                        <Sparkles className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">Create Smart Folder</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isCreatingSmartFolder ? "Analyzing your files..." : "Let AI find and group related files"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {smartFolderResult && (
              <div className="mt-4 p-4 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-200">Smart Folder Created!</h4>
                <p className="text-sm text-green-700 dark:text-green-300">Name: {smartFolderResult.name}</p>
                <p className="text-sm text-green-700 dark:text-green-300">Description: {smartFolderResult.description}</p>
              </div>
            )}
            {smartFolderError && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
                <h4 className="font-semibold text-red-800 dark:text-red-200">Error Creating Smart Folder</h4>
                <p className="text-sm text-red-700 dark:text-red-300">{smartFolderError}</p>
              </div>
            )}
          </div>

          {/* Recent Files Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Recent Files</h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("timeline")}
                  className={`p-2 ${viewMode === "timeline" ? "bg-gray-100 dark:bg-gray-700" : ""}`}
                >
                  <CalendarDays className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Info className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Files Grid/List/Timeline */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 [column-fill:_balance]">
                {recentFiles.map((file, index) => (
                  <Card
                    key={file.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group rounded-xl overflow-hidden animate-fade-in-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => handleFileClick(file)}
                  >
                    <CardContent className="p-4">
                      <div className="relative mb-3">
                        {/* File Thumbnail */}
                        <div className="aspect-video bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2 overflow-hidden">
                          {file.type === "image" || file.type === "video" ? (
                            <img
                              src={file.thumbnail || "/placeholder.svg"}
                              alt={`Thumbnail for ${file.name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <file.icon
                              className={`w-12 h-12 ${file.type === "folder" ? "text-blue-500" : "text-gray-600 dark:text-gray-400"}`}
                            />
                          )}
                        </div>

                        {/* Action Menu */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 shadow-sm rounded-full"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle menu click
                          }}
                        >
                          <MoreVert className="w-4 h-4" />
                        </Button>
                      </div>

                      <div>
                        <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate mb-1">
                          {file.name}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {file.modified} • {file.size}
                        </p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {file.tags?.slice(0, 3).map((tag, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Sparkles className="w-4 h-4" />
                          <span className="text-xs italic">{file.aiSuggestion}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {viewMode === "list" && (
              <div className="space-y-1">
                {recentFiles.map((file, index) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer group transition-colors animate-fade-in-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => handleFileClick(file)}
                  >
                    <div className="flex-shrink-0">{getFileIcon(file.type)}</div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">{file.name}</h3>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                      <span className="w-20 text-right">{file.owner}</span>
                      <span className="w-24 text-right">{file.modified}</span>
                      <span className="w-16 text-right">{file.size}</span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle menu click
                      }}
                    >
                      <MoreVert className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {viewMode === "timeline" && (
              <div className="relative pl-8">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                {recentFiles
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((file, index) => (
                    <div
                      key={file.id}
                      className="mb-8 relative animate-fade-in-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary dark:bg-white" />
                      <div className="ml-4">
                        <Card
                          className="cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-xl"
                          onClick={() => handleFileClick(file)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 p-2 bg-muted rounded-lg">{getFileIcon(file.type)}</div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                                  {file.name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  {new Date(file.date).toLocaleDateString()} • {file.size}
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                  <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    AI Confidence: {file.aiConfidence}%
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    Category: {file.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
