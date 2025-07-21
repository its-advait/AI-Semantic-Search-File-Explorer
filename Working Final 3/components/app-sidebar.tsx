"use client"

import { useState, useEffect } from "react"
import {
  Home,
  Search,
  Grid3X3,
  FileText,
  ImageIcon,
  Code,
  Video,
  Music,
  Bookmark,
  Clock,
  Settings,
  User,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ViewType, FileItem } from "@/app/page"

interface AppSidebarProps {
  currentView: ViewType
  onViewChange: (view: ViewType) => void
  onFileSelect: (file: FileItem) => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

const navigationItems = [
  { title: "Home", icon: Home, view: "dashboard" as ViewType, color: "text-gray-600" },
  { title: "Semantic Explorer", icon: Grid3X3, view: "explorer" as ViewType, color: "text-gray-700" },
  { title: "Smart Search", icon: Search, view: "search" as ViewType, color: "text-gray-800" },
]

const fileTypes = [
  { title: "Documents", icon: FileText, count: 1247, color: "text-gray-600" },
  { title: "Images", icon: ImageIcon, count: 892, color: "text-gray-700" },
  { title: "Code Files", icon: Code, count: 456, color: "text-gray-800" },
  { title: "Videos", icon: Video, count: 123, color: "text-gray-600" },
  { title: "Audio", icon: Music, count: 67, color: "text-gray-700" },
]

const smartGroups = [
  { name: "Work Projects", count: 234, color: "bg-gradient-to-r from-gray-500 to-gray-700" },
  { name: "Personal Stuff", count: 156, color: "bg-gradient-to-r from-gray-600 to-gray-800" },
  { name: "Research", count: 89, color: "bg-gradient-to-r from-gray-700 to-gray-900" },
  { name: "Money Stuff", count: 67, color: "bg-gradient-to-r from-gray-800 to-black" },
  { name: "Random", count: 45, color: "bg-gradient-to-r from-gray-400 to-gray-600" },
]

export function AppSidebar({ currentView, onViewChange, searchQuery, onSearchChange }: AppSidebarProps) {
  const [animatedCounts, setAnimatedCounts] = useState<{ [key: string]: number }>({})

  useEffect(() => {
    // Animate counts when sidebar loads
    ;[...fileTypes, ...smartGroups].forEach((item, index) => {
      const count = "count" in item ? item.count : 0
      const key = "title" in item ? item.title : item.name

      setTimeout(() => {
        let current = 0
        const increment = count / 30
        const timer = setInterval(() => {
          current += increment
          if (current >= count) {
            current = count
            clearInterval(timer)
          }
          setAnimatedCounts((prev) => ({
            ...prev,
            [key]: Math.floor(current),
          }))
        }, 50)
      }, index * 100)
    })
  }, [])

  return (
    <Sidebar className="glass border-r border-gray-200/60 shadow-lg shadow-gray-500/10">
      <SidebarHeader className="p-4">
        {/* Brand Section */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl glass-card">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-display clarity-text">librAIry</h2>
          </div>
        </div>

        {/* User Section */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-2xl glass-card">
          <Avatar className="h-10 w-10 ring-2 ring-gray-400/50">
            <AvatarImage src="/placeholder.svg?height=40&width=40" />
            <AvatarFallback className="bg-gradient-to-r from-gray-500 to-gray-700 text-white font-semibold">
              ME
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-700 truncate">My Files</p>
            <p className="text-xs text-gray-500/80 truncate font-body">Personal workspace</p>
          </div>
          <User className="w-4 h-4 text-gray-500" />
        </div>

        {/* Search */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-400/10 to-gray-400/10 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
          <Input
            placeholder="Find stuff..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 glass border-gray-200/60 focus:border-gray-400/80 rounded-xl placeholder:text-gray-500/60 transition-all duration-300 font-body"
            onFocus={() => onViewChange("search")}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-2">
            Navigate
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => onViewChange(item.view)}
                    isActive={currentView === item.view}
                    className={`rounded-xl transition-all duration-300 group relative overflow-hidden font-medium ${
                      currentView === item.view
                        ? "bg-gradient-to-r from-gray-500/20 to-gray-700/20 text-gray-700 backdrop-blur-sm shadow-lg"
                        : "hover:bg-white/20 text-gray-600"
                    }`}
                  >
                    {currentView === item.view && (
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-400/10 to-gray-400/10 animate-pulse-slow" />
                    )}
                    <item.icon className={`w-4 h-4 relative z-10 ${currentView === item.view ? item.color : ""}`} />
                    <span className="relative z-10">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-gradient-to-r from-transparent via-gray-200/60 to-transparent my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-2">
            File Types
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fileTypes.map((type) => (
                <SidebarMenuItem key={type.title}>
                  <SidebarMenuButton className="rounded-xl hover:bg-white/20 text-gray-600 transition-all duration-300 group font-body">
                    <type.icon
                      className={`w-4 h-4 ${type.color} group-hover:scale-110 transition-transform duration-300`}
                    />
                    <span>{type.title}</span>
                    <Badge className="ml-auto bg-gray-100/50 text-gray-700 border-0 animate-count-up font-medium">
                      {animatedCounts[type.title] || 0}
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-gradient-to-r from-transparent via-gray-200/60 to-transparent my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-2">
            Smart Groups
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {smartGroups.map((group) => (
                <SidebarMenuItem key={group.name}>
                  <SidebarMenuButton className="rounded-xl hover:bg-white/20 text-gray-600 transition-all duration-300 group font-body">
                    <div
                      className={`w-3 h-3 rounded-full ${group.color} group-hover:scale-125 transition-transform duration-300 shadow-lg`}
                    />
                    <span>{group.name}</span>
                    <Badge className="ml-auto bg-gray-100/50 text-gray-700 border-0 animate-count-up font-medium">
                      {animatedCounts[group.name] || 0}
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-gradient-to-r from-transparent via-gray-200/60 to-transparent my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-semibold text-xs uppercase tracking-wider mb-2">
            Quick Access
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="rounded-xl hover:bg-white/20 text-gray-600 transition-all duration-300 group font-body">
                  <Bookmark className="w-4 h-4 text-gray-500 group-hover:scale-110 transition-transform duration-300" />
                  <span>Favorites</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="rounded-xl hover:bg-white/20 text-gray-600 transition-all duration-300 group font-body">
                  <Clock className="w-4 h-4 text-gray-600 group-hover:scale-110 transition-transform duration-300" />
                  <span>Recent</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="rounded-xl hover:bg-white/20 text-gray-600 transition-all duration-300 group font-body">
              <Settings className="w-4 h-4 text-gray-700 group-hover:rotate-90 transition-transform duration-300" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
