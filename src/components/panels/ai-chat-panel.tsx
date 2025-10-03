"use client"

import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Send, User } from "lucide-react"

export function AiChatPanel() {
  const [messages, setMessages] = React.useState([
    {
      id: "1",
      role: "ai",
      content: "Hello! I am your image editing assistant, powered by the AI-MOS. How can I help you today?",
    },
  ])
  const [input, setInput] = React.useState("")

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, { id: Date.now().toString(), role: "user", content: input }])
      setInput("")
      // TODO: Add call to AI flow
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 p-4">
        <ScrollArea className="h-full">
            <div className="space-y-4">
            {messages.map((message) => (
                <div key={message.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 border">
                        {message.role === 'ai' ? <AvatarFallback><Bot className="h-4 w-4"/></AvatarFallback> : <AvatarFallback><User className="h-4 w-4"/></AvatarFallback>}
                    </Avatar>
                    <div className="flex-1 rounded-lg bg-muted/50 p-3 text-sm">
                        <p className="font-semibold">{message.role === "ai" ? "AI Assistant" : "You"}</p>
                        <p className="text-muted-foreground">{message.content}</p>
                    </div>
                </div>
            ))}
            </div>
        </ScrollArea>
      </div>
      <div className="border-t p-4">
        <div className="relative">
          <Input
            placeholder="Ask the AI about your image..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="pr-12"
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
            onClick={handleSendMessage}
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
