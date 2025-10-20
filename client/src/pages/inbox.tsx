import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Search } from "lucide-react";
import type { Message, User } from "@shared/schema";

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export default function Inbox() {
  const [activeTab, setActiveTab] = useState("messages");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/conversations"],
  });

  const { data: requests } = useQuery<Conversation[]>({
    queryKey: ["/api/messages/requests"],
  });

  const { data: messages } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedConversation],
    enabled: !!selectedConversation,
  });

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    console.log("Sending message:", messageInput);
    setMessageInput("");
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Inbox</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 overflow-hidden flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="p-4 border-b border-border">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="messages" data-testid="tab-messages">
                  Messages
                  {conversations && conversations.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {conversations.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="requests" data-testid="tab-requests">
                  Requests
                  {requests && requests.length > 0 && (
                    <Badge className="ml-2 bg-accent">
                      {requests.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-9"
                  data-testid="input-search-conversations"
                />
              </div>
            </div>

            <TabsContent value="messages" className="flex-1 overflow-y-auto m-0">
              <div className="space-y-1 p-2">
                {conversations && conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <button
                      key={conversation.user.id}
                      onClick={() => setSelectedConversation(conversation.user.id)}
                      className={`w-full p-4 rounded-lg text-left hover-elevate transition-all ${
                        selectedConversation === conversation.user.id
                          ? "bg-accent/50"
                          : ""
                      }`}
                      data-testid={`conversation-${conversation.user.id}`}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={conversation.user.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {conversation.user.displayName?.charAt(0) || conversation.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm truncate">
                              {conversation.user.displayName || conversation.user.username}
                            </h4>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-accent text-accent-foreground shrink-0">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No messages yet
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="requests" className="flex-1 overflow-y-auto m-0">
              <div className="space-y-1 p-2">
                {requests && requests.length > 0 ? (
                  requests.map((request) => (
                    <div
                      key={request.user.id}
                      className="p-4 rounded-lg hover-elevate"
                      data-testid={`request-${request.user.id}`}
                    >
                      <div className="flex gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request.user.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {request.user.displayName?.charAt(0) || request.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">
                            {request.user.displayName || request.user.username}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {request.lastMessage.content}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button size="sm" variant="default" data-testid={`button-accept-${request.user.id}`}>
                              Accept
                            </Button>
                            <Button size="sm" variant="outline" data-testid={`button-decline-${request.user.id}`}>
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No requests
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      U
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">Creator Name</h3>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages && messages.length > 0 ? (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === "current-user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                      data-testid={`message-${message.id}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          message.senderId === "current-user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.createdAt!).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    Start your conversation
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Write a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    data-testid="input-message"
                  />
                  <Button
                    onClick={handleSendMessage}
                    data-testid="button-send-message"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              Select a conversation to start messaging
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
