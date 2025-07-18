"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, ImageIcon, Code, Video, Music, Grid, Maximize2, FolderOpen } from "lucide-react"
import type { ViewType } from "@/app/page"
import { processDirectory } from "@/lib/fileProcessor"
import { supabase } from "@/lib/supabaseClient"

// Define the FileItem interface to match Supabase data + UI needs
interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string; // Placeholder, as size is not in DB yet
  modified: string; // Placeholder, as modified date is not in DB yet
  path: string;
  vectorGroup?: string; // Placeholder for grouping
  x?: number; // For map view
  y?: number; // For map view
}

interface SemanticExplorerProps {
  onFileSelect: (file: FileItem) => void;
  onViewChange: (view: ViewType) => void;
}

// Helper to infer file type from extension
const getFileType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
    case 'md':
    case 'xlsx':
    case 'csv':
      return 'document';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'image';
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'py':
    case 'java':
    case 'c':
    case 'cpp':
    case 'html':
    case 'css':
      return 'code';
    case 'mp4':
    case 'mov':
    case 'avi':
      return 'video';
    case 'mp3':
    case 'wav':
    case 'ogg':
      return 'audio';
    default:
      return 'unknown';
  }
};

export function SemanticExplorer({ onFileSelect, onViewChange }: SemanticExplorerProps) {
  const [viewMode, setViewMode] = useState<"map" | "grid">("grid"); // Default to grid view
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [files, setFiles] = useState<FileItem>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename, filepath'); // Select only necessary fields for display

      if (error) {
        console.error("Error fetching documents:", error);
        setFiles([]);
      } else {
        const fetchedFiles: FileItem[] = data.map((item: any) => ({
          id: item.id.toString(),
          name: item.filename,
          path: item.filepath,
          type: getFileType(item.filename),
          size: "N/A", // Placeholder
          modified: "N/A", // Placeholder
          vectorGroup: "Processed Files", // Generic group for now
          x: Math.random() * 100, // Random X for map view
          y: Math.random() * 100, // Random Y for map view
        }));
        setFiles(fetchedFiles);
      }
    } catch (err) {
      console.error("Unexpected error fetching documents:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleProcessDirectory = async () => {
    setProcessing(true);
    // Hardcode a test path for now. In a real app, you'd let the user select this.
    const testPath = "C:\\Users\\samcr\\BenchProject\\test_files"; // Adjust this to a path with test files
    try {
      await processDirectory(testPath);
      await fetchFiles(); // Refresh files after processing
    } catch (error) {
      console.error("Error processing directory:", error);
    } finally {
      setProcessing(false);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4" />;
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      case "code":
        return <Code className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "audio":
        return <Music className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  // Dynamic vector groups based on fetched data (simplified)
  const uniqueVectorGroups = Array.from(new Set(files.map(f => f.vectorGroup))).filter(Boolean);
  const displayVectorGroups = uniqueVectorGroups.map(groupName => ({
    name: groupName,
    color: "bg-gray-500", // All same color for now
    count: files.filter(f => f.vectorGroup === groupName).length,
  }));

  const filteredAndSortedFiles = files.filter(file => 
    selectedGroup === "all" || file.vectorGroup === selectedGroup
  ).sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "type":
        return a.type.localeCompare(b.type);
      // Add more sorting logic if size/modified are properly populated
      default:
        return a.name.localeCompare(b.name); // Default sort by name
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <Button onClick={handleProcessDirectory} disabled={processing} className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            {processing ? "Processing..." : "Scan Local Files"}
          </Button>
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
              {displayVectorGroups.map((group) => (
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
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="type">Type</SelectItem>
              {/* Add more sort options if size/modified are populated */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading files...
          </div>
        ) : filteredAndSortedFiles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No files found. Click "Scan Local Files" to populate.
          </div>
        ) : viewMode === "map" ? (
          <div className="relative w-full h-full bg-gradient-to-br from-background to-muted/20">
            {/* Vector group legend */}
            <div className="absolute top-4 right-4 z-10">
              <Card className="">
                <h4 className="font-medium mb-2">Vector Groups</h4>
                <div className="space-y-1">
                  {displayVectorGroups.map((group) => (
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
              {filteredAndSortedFiles.map((file) => (
                <div
                  key={file.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${file.x}%`, top: `${file.y}%` }}
                  onClick={() => {
                    onFileSelect(file);
                    onViewChange("document");
                  }}
                >
                  <div
                    className={`w-12 h-12 rounded-full ${displayVectorGroups.find(g => g.name === file.vectorGroup)?.color || "bg-gray-500"} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}
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
              {filteredAndSortedFiles.map((file) => (
                <Card
                  key={file.id}
                  className="cursor-pointer hover:shadow-md transition-shadow group"
                  onClick={() => {
                    onFileSelect(file);
                    onViewChange("document");
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${displayVectorGroups.find(g => g.name === file.vectorGroup)?.color || "bg-gray-500"} text-white`}>
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
  );
}