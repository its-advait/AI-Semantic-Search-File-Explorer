"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  X,
  Download,
  Share,
  Edit,
  FileText,
  Image,
  Code,
  Video,
  Music,
  Bookmark,
  MessageSquare,
  Sparkles,
  Copy,
  Merge,
  HighlighterIcon as Highlight,
  Send,
  Search,
  HelpCircle,
} from "lucide-react"
import type { FileItem } from "@/app/page"

interface DocumentPanelProps {
  file: FileItem | null
  onClose: () => void
}

const mockAnnotations = [
  {
    id: "1",
    text: "Important deadline mentioned here",
    timestamp: "2 hours ago",
    position: { x: 45, y: 23 },
  },
  {
    id: "2",
    text: "Need to follow up on this section",
    timestamp: "1 day ago",
    position: { x: 60, y: 45 },
  },
]

const mockSummary = `This document contains a comprehensive project proposal for the Q4 marketing campaign. Key points include:

• Budget allocation of $50,000 for digital advertising
• Timeline spanning October to December 2024
• Target audience: 25-45 year olds in urban areas
• Expected ROI of 150% based on previous campaigns
• Integration with existing CRM systems required

The proposal emphasizes data-driven decision making and includes detailed analytics tracking for campaign performance measurement.`

const mockHighlights = [
  "Budget allocation of $50,000",
  "Timeline spanning October to December 2024",
  "Expected ROI of 150%",
  "Integration with existing CRM systems",
]

const mockRecommendedPrompts = [
  "Summarize this document for me.",
  "What are the key takeaways?",
  "Explain the budget breakdown.",
  "What is the project timeline?",
  "Who is the target audience?",
  "What is the expected ROI?",
  "Are there any action items?",
  "What technologies are mentioned?",
]

// Placeholder PDF URL for demonstration
const MOCK_PDF_URL = "https://www.africau.edu/images/default/sample.pdf"

export function DocumentPanel({ file, onClose }: DocumentPanelProps) {
  const [activeTab, setActiveTab] = useState<"insightful-view" | "pdf-view" | "annotations" | "chat">("insightful-view")
  const [newAnnotation, setNewAnnotation] = useState("")
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [chatMessages, setChatMessages] = useState([
    { type: "ai", text: "Hello! Ask me anything about this document." },
  ])
  const [chatInput, setChatInput] = useState("")
  const [isChatting, setIsChatting] = useState(false)

  const chatHistoryRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of chat history when messages change
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
    }
  }, [chatMessages])

  if (!file) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <p>Select a file to view its content</p>
        </div>
      </div>
    )
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-5 h-5" />
      case "image":
        return <Image className="w-5 h-5" />
      case "code":
        return <Code className="w-5 h-5" />
      case "video":
        return <Video className="w-5 h-5" />
      case "audio":
        return <Music className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const generateSummary = () => {
    setIsGeneratingSummary(true)
    setTimeout(() => {
      setIsGeneratingSummary(false)
    }, 2000)
  }

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      const userMessage = { type: "user", text: chatInput }
      setChatMessages((prev) => [...prev, userMessage])
      setChatInput("")
      setIsChatting(true)

      setTimeout(() => {
        let aiResponse =
          "I'm sorry, I couldn't find specific information related to that in the document. Can you rephrase or ask about a different topic?"

        const lowerCaseQuery = userMessage.text.toLowerCase()

        if (lowerCaseQuery.includes("summary") || lowerCaseQuery.includes("overview")) {
          aiResponse = `Here's a summary of the document: ${mockSummary.split("\n")[0]}...`
        } else if (lowerCaseQuery.includes("budget")) {
          aiResponse = `The document mentions a budget allocation of $50,000 for digital advertising.`
        } else if (lowerCaseQuery.includes("timeline")) {
          aiResponse = `The campaign timeline spans October to December 2024.`
        } else if (lowerCaseQuery.includes("roi")) {
          aiResponse = `The expected ROI is 150% based on previous campaigns.`
        } else if (lowerCaseQuery.includes("highlights") || lowerCaseQuery.includes("key points")) {
          aiResponse = `Some key highlights include: ${mockHighlights.join(", ")}.`
        } else if (lowerCaseQuery.includes("target audience")) {
          aiResponse = `The target audience is 25-45 year olds in urban areas.`
        } else if (lowerCaseQuery.includes("crm")) {
          aiResponse = `The proposal requires integration with existing CRM systems.`
        } else if (lowerCaseQuery.includes("action items")) {
          aiResponse = `The document doesn't explicitly list action items, but it implies tasks related to implementing the multi-channel approach and tracking analytics.`
        } else if (lowerCaseQuery.includes("technologies")) {
          aiResponse = `The document mentions "integration with existing CRM systems."`
        }

        setChatMessages((prev) => [...prev, { type: "ai", text: aiResponse }])
        setIsChatting(false)
      }, 1500)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded">{getFileIcon(file.type)}</div>
          <div>
            <h2 className="font-semibold">{file.name}</h2>
            <p className="text-sm text-muted-foreground">
              {file.size} • {file.modified} • {file.path}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Bookmark className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <Button
          variant={activeTab === "insightful-view" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("insightful-view")}
          className="rounded-none"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Insightful View
        </Button>
        {file.type === "document" && ( // Only show PDF tab for document types
          <Button
            variant={activeTab === "pdf-view" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("pdf-view")}
            className="rounded-none"
          >
            PDF View
          </Button>
        )}
        <Button
          variant={activeTab === "annotations" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("annotations")}
          className="rounded-none"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Annotations ({mockAnnotations.length})
        </Button>
        <Button
          variant={activeTab === "chat" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("chat")}
          className="rounded-none"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chat with Document
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "insightful-view" && (
          <div className="h-full flex">
            {/* Document Preview and AI Tools */}
            <div className="flex-1 p-6 overflow-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Document Preview */}
                {file.type === "document" && (
                  <div className="bg-white dark:bg-gray-900 border rounded-lg p-8 shadow-sm">
                    <div className="prose dark:prose-invert max-w-none">
                      <h1>{file.filename}</h1>
                      <p className="lead">
                        File Path: {file.filepath}
                      </p>
                    </div>
                  </div>
                )}

                {file.type === "image" && (
                  <div className="flex items-center justify-center h-full min-h-[300px] bg-muted/20 rounded-lg">
                    <div className="text-center">
                      <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center mb-4">
                        <Image className="w-16 h-16 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground">Image preview would appear here</p>
                    </div>
                  </div>
                )}

                {file.type === "code" && (
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto">
                    <pre>{`#!/usr/bin/env python3
"""
AI-powered file organizer
Automatically categorizes and organizes files using machine learning
"""

import os
import shutil
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans

class FileOrganizer:
    def __init__(self, base_path):
        self.base_path = Path(base_path)
        self.vectorizer = TfidfVectorizer()
        self.clusterer = KMeans(n_clusters=5)
    
    def analyze_file_content(self, file_path):
        """Extract text content from file for analysis"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except:
            return ""
    
    def organize_files(self):
        """Main function to organize files into semantic groups"""
        files = list(self.base_path.rglob('*'))
        # Implementation continues...`}</pre>
                  </div>
                )}

                {/* AI Tools Section */}
                <div className="space-y-6 mt-8">
                  {" "}
                  {/* Added margin-top for spacing */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        AI Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isGeneratingSummary ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Generating summary...
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm mb-4">{mockSummary}</p>
                          <Button variant="outline" size="sm" onClick={generateSummary}>
                            Regenerate Summary
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Highlight className="w-5 h-5" />
                        Key Highlights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {mockHighlights.map((highlight, index) => (
                          <div
                            key={index}
                            className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-2 border-yellow-400 text-sm"
                          >
                            {highlight}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  {/* New Card: Extract Key Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Extract Key Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Automatically pull out important entities, dates, and facts from the document.
                      </p>
                      <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Run Extraction
                      </Button>
                    </CardContent>
                  </Card>
                  {/* New Card: Find Similar Documents */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Find Similar Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Discover other documents in your Bench that are semantically related to this one.
                      </p>
                      <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                        <Merge className="w-4 h-4 mr-2" />
                        Search for Similar
                      </Button>
                    </CardContent>
                  </Card>
                  {/* New Card: Generate Questions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <HelpCircle className="w-5 h-5" />
                        Generate Questions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Let AI generate a list of questions you might have about the document's content.
                      </p>
                      <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Generate Questions
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Metadata Sidebar */}
            <div className="w-80 border-l p-4 overflow-auto">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{file.type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{file.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Modified:</span>
                      <span>{file.modified}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Group:</span>
                      <Badge variant="secondary">{file.vectorGroup}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                      <Merge className="w-4 h-4 mr-2" />
                      Merge with...
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pdf-view" && file.type === "document" && (
          <div className="h-full flex flex-col">
            <div className="flex-1 p-4">
              <iframe src={MOCK_PDF_URL} className="w-full h-full border rounded-lg shadow-md" title="PDF Viewer">
                This browser does not support PDFs. Please download the PDF to view it:{" "}
                <a href={MOCK_PDF_URL}>Download PDF</a>.
              </iframe>
            </div>
          </div>
        )}

        {activeTab === "annotations" && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Annotations</h3>
              <Button size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>

            <Card>
              <CardContent className="p-4">
                <Textarea
                  placeholder="Add a new annotation..."
                  value={newAnnotation}
                  onChange={(e) => setNewAnnotation(e.target.value)}
                  className="mb-3"
                />
                <Button size="sm">Save Annotation</Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {mockAnnotations.map((annotation) => (
                <Card key={annotation.id}>
                  <CardContent className="p-4">
                    <p className="text-sm mb-2">{annotation.text}</p>
                    <p className="text-xs text-muted-foreground">{annotation.timestamp}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="flex flex-col h-full p-6">
            <Card className="flex-1 glass-card flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Chat with Document
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4 pt-0 overflow-hidden">
                {/* This is the chat history area */}
                <div
                  ref={chatHistoryRef}
                  className="flex-grow h-0 overflow-y-auto mb-4 pr-2 border rounded-md p-3 bg-muted/20"
                >
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={`mb-3 ${msg.type === "user" ? "text-right" : "text-left"}`}>
                      <Badge
                        className={`max-w-[80%] text-wrap text-left text-base py-2 px-3 rounded-xl shadow-sm ${
                          msg.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {msg.text}
                      </Badge>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="text-left">
                      <Badge className="bg-secondary text-secondary-foreground animate-pulse-slow text-base py-2 px-3 rounded-xl shadow-sm">
                        AI is thinking...
                      </Badge>
                    </div>
                  )}
                </div>
                {/* This is the suggested prompts area - it will stay fixed */}
                <div className="mb-4 flex flex-wrap gap-3">
                  {mockRecommendedPrompts.map((prompt, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer text-sm px-4 py-2 rounded-full font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setChatInput(prompt)
                        handleChatSubmit() // Directly send the prompt
                      }}
                    >
                      {prompt}
                    </Badge>
                  ))}
                </div>
                {/* This is the prompt input area - it will stay fixed */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about the document..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSubmit()
                      }
                    }}
                    className="flex-1 min-h-[40px] max-h-[100px] resize-none text-base rounded-xl border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 shadow-sm focus:shadow-md transition-all duration-200"
                  />
                  <Button
                    size="icon"
                    onClick={handleChatSubmit}
                    disabled={isChatting}
                    className="glass-button rounded-xl"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
