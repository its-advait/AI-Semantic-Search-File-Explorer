"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles, X } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { openRouterService } from "@/lib/openRouterService"

export function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState([
    { type: "ai", text: "Hello! I'm your Bench assistant. How can I help you organize or find your files today?" },,
  ])
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);


  const tips = [
    "Try the 'Semantic Explorer' to see how your files are grouped by content.",
    "Use 'Smart Search' to ask natural language questions about your documents.",
    "Click 'Auto-organize' to let me suggest new folder structures for your unfiled items.",
    "Did you know I can summarize documents for you? Just open a file and go to 'AI Tools'.",
    "I can help you find similar documents based on their content. Give it a try!",
  ]

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      setMessages((prev) => [...prev, { type: "user", text: chatInput }])
      setChatInput("")
      // Simulate AI response
      setTimeout(() => {
        const randomTip = tips[Math.floor(Math.random() * tips.length)]
        setMessages((prev) => [...prev, { type: "ai", text: `That's a great question! For example, ${randomTip}` }])
      }, 1000)
    }
  }

  const handleTestOpenRouter = async () => {
    try {
      setApiError(null);
      const response = await openRouterService.generateText("Hello, world!");
      const message = response.choices[0].message.content;
      setApiResponse(message);
      console.log("OpenRouter Response:", message);
    } catch (error: any) {
      setApiError(error.message);
      console.error("OpenRouter Error:", error);
    }
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isOpen && (
          <Card className="w-80 shadow-xl glass-card">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Bench Assistant
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="h-64 overflow-y-auto mb-3 pr-2">
                {messages.map((msg, index) => (
                  <div key={index} className={`mb-2 ${msg.type === "user" ? "text-right" : "text-left"}`}>
                    <Badge
                      className={`max-w-[80%] text-wrap ${
                        msg.type === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {msg.text}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask me anything..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="flex-1 min-h-[40px] max-h-[100px] resize-none"
                />
                <Button size="icon" onClick={handleSendMessage}>
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handleTestOpenRouter}>Test OpenRouter</Button>
              {apiResponse && <p className="mt-2 p-2 bg-gray-100 rounded-md">{apiResponse}</p>}
              {apiError && <p className="mt-2 text-red-500">{apiError}</p>}
            </CardContent>
          </Card>
        )}

        {!isOpen && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="lg"
                className="rounded-full h-14 w-14 shadow-xl glass-button animate-float"
                onClick={() => setIsOpen(true)}
              >
                <Sparkles className="w-6 h-6" />
                <span className="sr-only">Open AI Assistant</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="font-semibold mb-1">Bench Assistant</p>
              <p className="text-sm text-muted-foreground">
                I can help you organize, search, and understand your files. Click to chat!
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
