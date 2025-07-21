"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, ImageIcon, Code, Video, Music, Grid, Maximize2 } from "lucide-react"
import type { ViewType, FileItem } from "@/app/page"

interface SemanticExplorerProps {
  onFileSelect: (file: FileItem) => void
  onViewChange: (view: ViewType) => void
  // Removed initialSelectedGroup prop
}

// Mock data for semantic clusters
const mockFiles: FileItem[] = [
  // Work Projects cluster
  {
    id: "1",
    name: "Project_Proposal.pdf",
    type: "document",
    size: "2.4 MB",
    modified: "2 hours ago",
    path: "/work",
    vectorGroup: "Work Projects",
    x: 20,
    y: 30,
  },
  {
    id: "2",
    name: "meeting_notes.docx",
    type: "document",
    size: "156 KB",
    modified: "1 day ago",
    path: "/work",
    vectorGroup: "Work Projects",
    x: 25,
    y: 35,
  },
  {
    id: "3",
    name: "budget_analysis.xlsx",
    type: "document",
    size: "890 KB",
    modified: "3 hours ago",
    path: "/work",
    vectorGroup: "Work Projects",
    x: 30,
    y: 25,
  },

  // Personal cluster
  {
    id: "4",
    name: "vacation_2023.jpg",
    type: "image",
    size: "3.2 MB",
    modified: "1 week ago",
    path: "/personal",
    vectorGroup: "Personal",
    x: 70,
    y: 20,
  },
  {
    id: "5",
    name: "family_dinner.mp4",
    type: "video",
    size: "45 MB",
    modified: "2 days ago",
    path: "/personal",
    vectorGroup: "Personal",
    x: 75,
    y: 25,
  },
  {
    id: "6",
    name: "recipe_collection.pdf",
    type: "document",
    size: "1.1 MB",
    modified: "5 days ago",
    path: "/personal",
    vectorGroup: "Personal",
    x: 80,
    y: 30,
  },

  // Code cluster
  {
    id: "7",
    name: "main.py",
    type: "code",
    size: "12 KB",
    modified: "4 hours ago",
    path: "/code",
    vectorGroup: "Development",
    x: 50,
    y: 70,
  },
  {
    id: "8",
    name: "config.json",
    type: "code",
    size: "2 KB",
    modified: "6 hours ago",
    path: "/code",
    vectorGroup: "Development",
    x: 45,
    y: 75,
  },
  {
    id: "9",
    name: "README.md",
    type: "code",
    size: "4 KB",
    modified: "1 day ago",
    path: "/code",
    vectorGroup: "Development",
    x: 55,
    y: 65,
  },

  // Research cluster
  {
    id: "10",
    name: "research_paper.pdf",
    type: "document",
    size: "5.6 MB",
    modified: "1 week ago",
    path: "/research",
    vectorGroup: "Research",
    x: 15,
    y: 80,
  },
  {
    id: "11",
    name: "data_analysis.ipynb",
    type: "code",
    size: "234 KB",
    modified: "3 days ago",
    path: "/research",
    vectorGroup: "Research",
    x: 20,
    y: 85,
  },

  // Finance cluster
  {
    id: "12",
    name: "tax_documents.zip",
    type: "document",
    size: "12 MB",
    modified: "2 weeks ago",
    path: "/finance",
    vectorGroup: "Finance",
    x: 85,
    y: 70,
  },
  {
    id: "13",
    name: "bank_statements.pdf",
    type: "document",
    size: "3.4 MB",
    modified: "1 week ago",
    path: "/finance",
    vectorGroup: "Finance",
    x: 90,
    y: 75,
  },
]

const vectorGroups = [
  { name: "Work Projects", color: "bg-blue-500", count: 3 },
  { name: "Personal", color: "bg-green-500", count: 3 },
  { name: "Development", color: "bg-purple-500", count: 3 },
  { name: "Research", color: "bg-orange-500", count: 2 },
  { name: "Finance", color: "bg-pink-500", count: 2 },
]

export function SemanticExplorer({ onFileSelect, onViewChange }: SemanticExplorerProps) {
  const [viewMode, setViewMode] = useState<"map" | "grid">("map")
  const [selectedGroup, setSelectedGroup] = useState<string>("all") // Reverted to default "all"
  const [sortBy, setSortBy] = useState<string>("modified")
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>(mockFiles)

  // Removed useEffect for initialSelectedGroup

  useEffect(() => {
    let filtered = mockFiles

    if (selectedGroup !== "all") {
      filtered = filtered.filter((file) => file.vectorGroup === selectedGroup)
    }

    // Sort files
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "type":
          return a.type.localeCompare(b.type)
        case "size":
          // Assuming size is like "2.4 MB", extract number and convert
          const sizeA = Number.parseFloat(a.size.split(" ")[0])
          const sizeB = Number.parseFloat(b.size.split(" ")[0])
          return sizeA - sizeB
        default:
          return new Date(b.modified).getTime() - new Date(a.modified).getTime()
      }
    })

    setFilteredFiles(filtered)
  }, [selectedGroup, sortBy])

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
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getGroupColor = (groupName: string) => {
    const group = vectorGroups.find((g) => g.name === groupName)
    return group?.color || "bg-gray-500"
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant={viewMode === "map" ? "default" : "outline"} size="sm" onClick={() => setViewMode("map")}>
              <Maximize2 className="w-4 h-4 mr-2" />
              Map View
            </Button>
            <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
              <Grid className="w-4 h-4 mr-2" />
              Grid View
            </Button>
          </div>

          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {vectorGroups.map((group) => (
                <SelectItem key={group.name} value={group.name}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${group.color}`} />
                    <span>
                      {group.name} ({group.count})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modified">Modified</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              <SelectItem value="size">Size</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "map" ? (
          <div className="relative w-full h-full bg-gradient-to-br from-background to-muted/20">
            {/* Vector group legend */}
            <div className="absolute top-4 right-4 z-10">
              <Card className="p-3">
                <h4 className="font-medium mb-2">Vector Groups</h4>
                <div className="space-y-1">
                  {vectorGroups.map((group) => (
                    <div key={group.name} className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${group.color}`} />
                      <span>{group.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {group.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* File nodes */}
            <div className="relative w-full h-full">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${file.x}%`, top: `${file.y}%` }}
                  onClick={() => {
                    onFileSelect(file)
                    onViewChange("document")
                  }}
                >
                  <div
                    className={`w-12 h-12 rounded-full ${getGroupColor(file.vectorGroup!)} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {getFileIcon(file.type)}
                  </div>
                  <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-background border rounded px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    {file.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <Card
                  key={file.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => {
                    onFileSelect(file)
                    onViewChange("document")
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${getGroupColor(file.vectorGroup!)} text-white`}>
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate group-hover:text-primary transition-colors">{file.name}</h4>
                        <p className="text-sm text-muted-foreground">{file.size}</p>
                        <p className="text-xs text-muted-foreground">{file.modified}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {file.vectorGroup}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
