"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, ImageIcon, Code, Video, Music, Clock, Star, Filter, Coffee } from "lucide-react"
import type { FileItem } from "@/app/page"
import { supabase } from "@/lib/supabaseClient"
import { generateEmbedding } from "@/lib/minilmEmbeddings"

interface SearchInterfaceProps {
  query: string
  onQueryChange: (query: string) => void
  onFileSelect: (file: FileItem) => void
}

const recentSearches = [
  "that PDF from last week",
  "vacation photos from summer",
  "python files I was working on",
  "meeting notes from Q4",
  "budget spreadsheets",
]

const searchSuggestions = [
  "Show me PDFs bigger than 5MB",
  "Find images from the last month",
  "Code files I touched this week",
  'Documents with "budget" in them',
  "All my work project files",
]

export function SearchInterface({ query, onQueryChange, onFileSelect }: SearchInterfaceProps) {
  const [searchResults, setSearchResults] = useState<(FileItem & { relevance: number; snippet: string })[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)

  const handleSearch = async () => {
    if (query.trim()) {
      setIsSearching(true)
      setShowSuggestions(false)

      try {
        // Generate embedding using Jina
        const { data: embeddingData, error: embeddingError } = await supabase.functions.invoke('jina-embed', {
          body: { text: query }
        });

        if (embeddingError) {
          console.error("Error generating embedding:", embeddingError);
          setSearchResults([]);
          setIsSearching(false);
          return;
        }

        const queryEmbedding = embeddingData.embedding;

        const { data, error } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding,
          match_threshold: 0.65, // Adjust this value based on your data and desired strictness
          match_count: 5, // Number of results to retrieve
        });

        if (error) {
          console.error("Error invoking match_documents function:", error);
          setSearchResults([]);
          return;
        }
        console.log("Supabase data:", data); // Log the data received from Supabase

        const mappedResults: (FileItem & { snippet: string })[] = data.map((item: any) => ({
          id: item.id,
          filename: item.filename,
          filepath: item.filepath,
          date_created: item.date_created,
          date_modified: item.date_modified,
          name: item.filename,
          modified: new Date(item.date_modified).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          path: item.filepath,
          snippet: item.filepath,
          type: item.filename.split('.').pop() || 'file',
          size: "N/A", 
          vectorGroup: "N/A",
        }));
        setSearchResults(mappedResults);
        console.log("Mapped search results:", mappedResults); // Log the mapped results
      } catch (err) {
        console.error("Unexpected error during search:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        console.log("isSearching after search:", false); // Log isSearching state
      }
    } else {
      setSearchResults([]);
      setShowSuggestions(true);
      console.log("query is empty, searchResults cleared, showSuggestions true"); // Log when query is empty
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
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <strong key={index} className="font-bold">
          {part}
        </strong>
      ) : (
        part
      ),
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="p-6 border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Just ask for what you need (e.g., 'show me all tax-related PDFs from 2023')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              className="pl-12 pr-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 shadow-md focus:shadow-lg transition-all duration-200"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => onQueryChange("")}
              >
                Clear
              </Button>
            )}
          </div>

          {query && (
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Coffee className="w-4 h-4" />
              <span>Smart search is doing its thing...</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {showSuggestions && !query && (
            <div className="space-y-6">
              {/* Recent Searches */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Recent Searches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((search, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => onQueryChange(search)}
                        className="text-left border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors"
                      >
                        {search}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Search Suggestions */}
              <Card className="border border-gray-200 dark:border-gray-700 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Try These
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {searchSuggestions.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => onQueryChange(suggestion)}
                      >
                        <Coffee className="w-4 h-4 mr-3 text-muted-foreground" />
                        <span>{suggestion}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span>Searching through your stuff...</span>
              </div>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  Found {searchResults.length} things for "{query}"
                </h2>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="space-y-4">
                {searchResults.map((result) => (
                  <Card
                    key={result.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
                    onClick={() => window.electron.openFile(result.filepath)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-muted rounded">{getFileIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-primary hover:underline">
                              {highlightText(result.name, query)}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {result.modified}
                          </p>
                          <p className="text-sm">{highlightText(result.snippet, query)}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {query && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Couldn't find anything</h3>
              <p className="text-muted-foreground mb-4">Try different keywords or check your spelling</p>
              <Button variant="outline" onClick={() => onQueryChange("")}>
                Clear search
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
