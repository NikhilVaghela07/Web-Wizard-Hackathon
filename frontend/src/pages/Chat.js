import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { messagesAPI, roomsAPI } from '../utils/api';
import socketService from '../utils/socket';
import { formatDateTime } from '../utils/dateUtils';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { ScrollArea } from "../components/ui/scroll-area";
import { Separator } from "../components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

import { 
  MessageCircle, 
  Send, 
  Users, 
  MoreVertical, 
  LogOut,
  Settings,
  User,
  Loader2,
  Hash,
  ArrowLeft
} from "lucide-react";

const Chat = () => {
  const { user, logout } = useAuth();
  const { roomId } = useParams(); // Get roomId from URL params
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeUsers, setActiveUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomDetails, setRoomDetails] = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const optimisticTimeoutsRef = useRef(new Map());

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up optimistic messages that don't get confirmed within 10 seconds
  useEffect(() => {
    const cleanup = () => {
      optimisticTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      optimisticTimeoutsRef.current.clear();
    };

    return cleanup;
  }, []);

  // Load room details if roomId is provided
  useEffect(() => {
    const loadRoomDetails = async () => {
      if (!roomId) return;
      
      try {
        setRoomLoading(true);
        const response = await roomsAPI.getRoomDetails(roomId);
        setRoomDetails(response.data.room);
      } catch (error) {
        console.error('Error loading room details:', error);
        if (error.response?.status === 403 || error.response?.status === 404) {
          toast.error('Access denied or room not found');
          navigate('/rooms');
        } else {
          toast.error('Failed to load room details');
        }
      } finally {
        setRoomLoading(false);
      }
    };

    loadRoomDetails();
  }, [roomId, navigate]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await messagesAPI.getRecentMessages(roomId);
        setMessages(response.data.messages || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        setError('Failed to load messages');
        toast.error('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomId]);

  // Socket event handlers
  useEffect(() => {
    if (!socketService.isConnected()) {
      return;
    }

    // Join room when component mounts
    socketService.joinRoom(roomId || null);

    const handleNewMessage = (message) => {
      setMessages(prev => {
        // Check if this is a confirmation of an optimistic message
        const optimisticIndex = prev.findIndex(msg => 
          msg.isOptimistic && 
          msg.username === message.username && 
          msg.content === message.content
        );

        if (optimisticIndex !== -1) {
          // Clear the timeout for this optimistic message
          const optimisticMessage = prev[optimisticIndex];
          if (optimisticTimeoutsRef.current.has(optimisticMessage.id)) {
            clearTimeout(optimisticTimeoutsRef.current.get(optimisticMessage.id));
            optimisticTimeoutsRef.current.delete(optimisticMessage.id);
          }

          // Replace optimistic message with confirmed message
          const newMessages = [...prev];
          newMessages[optimisticIndex] = {
            ...message,
            isOptimistic: false
          };
          return newMessages;
        } else {
          // New message from another user or server
          return [...prev, message];
        }
      });
    };

    const handleUserJoined = (data) => {
      toast.info(`${data.username} joined the chat`, { autoClose: 2000 });
    };

    const handleUserLeft = (data) => {
      toast.info(`${data.username} left the chat`, { autoClose: 2000 });
    };

    const handleActiveUsers = (users) => {
      setActiveUsers(users);
    };

    const handleUserTyping = (data) => {
      if (data.username !== user.username) {
        if (data.isTyping) {
          setTypingUsers(prev => 
            prev.includes(data.username) 
              ? prev 
              : [...prev, data.username]
          );
        } else {
          setTypingUsers(prev => 
            prev.filter(username => username !== data.username)
          );
        }
      }
    };

    const handleError = (error) => {
      console.error('Socket error:', error);
      toast.error('Connection error occurred');
    };

    // Attach event listeners
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onActiveUsers(handleActiveUsers);
    socketService.onUserTyping(handleUserTyping);
    socketService.onError(handleError);

    // Cleanup event listeners
    return () => {
      socketService.offNewMessage(handleNewMessage);
      socketService.offUserJoined(handleUserJoined);
      socketService.offUserLeft(handleUserLeft);
      socketService.offActiveUsers(handleActiveUsers);
      socketService.offUserTyping(handleUserTyping);
      socketService.offError(handleError);
    };
  }, [user.username, roomId]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.sendTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.sendTyping(false);
    }, 1000);
  };

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    const messageContent = newMessage.trim();
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Optimistic UI update - add message immediately
    const optimisticMessage = {
      id: tempId,
      username: user.username,
      content: messageContent,
      timestamp: new Date(),
      isOptimistic: true // Flag to track optimistic messages
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    // Set timeout to remove optimistic message if not confirmed within 10 seconds
    const timeoutId = setTimeout(() => {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      toast.error('Message failed to send');
      optimisticTimeoutsRef.current.delete(tempId);
    }, 10000);
    
    optimisticTimeoutsRef.current.set(tempId, timeoutId);

    try {
      socketService.sendMessage(messageContent);
      
      // Clear typing indicator
      setIsTyping(false);
      socketService.sendTyping(false);
      clearTimeout(typingTimeoutRef.current);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      
      // Clear timeout
      if (optimisticTimeoutsRef.current.has(tempId)) {
        clearTimeout(optimisticTimeoutsRef.current.get(tempId));
        optimisticTimeoutsRef.current.delete(tempId);
      }
      
      // Restore the message in input
      setNewMessage(messageContent);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Handle back to rooms
  const handleBackToRooms = () => {
    navigate('/rooms');
  };

  if (loading || roomLoading) {
    return <LoadingSpinner message={roomId ? "Loading room..." : "Loading chat..."} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToRooms}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Rooms
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                {roomId ? <Hash className="w-4 h-4 text-primary-foreground" /> : <MessageCircle className="w-4 h-4 text-primary-foreground" />}
              </div>
              <div>
                <h1 className="text-xl font-semibold">
                  {roomId ? (roomDetails?.name || 'Room') : 'Global Chat'}
                </h1>
                {roomDetails && (
                  <p className="text-xs text-muted-foreground">
                    {roomDetails.description || `${roomDetails.memberCount} members`}
                  </p>
                )}
              </div>
            </div>
            {roomId && roomDetails && (
              <>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Code: </span>
                  <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                    {roomDetails.roomCode}
                  </code>
                </div>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{activeUsers.length} online</span>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="ml-2 hidden md:inline-block">{user.username}</span>
                  <MoreVertical className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Active Users */}
        <aside className="w-64 border-r bg-card/30 hidden lg:block">
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  ONLINE — {activeUsers.length}
                </h3>
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <div className="space-y-2">
                    {activeUsers.map((activeUser) => (
                      <div
                        key={activeUser.id}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                      >
                        <div className="relative">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-sm">
                              {activeUser.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {activeUser.username}
                            {activeUser.username === user.username && (
                              <span className="text-xs text-muted-foreground ml-1">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {/* Messages Container */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center mt-12 space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <MessageCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">No messages yet!</p>
                    <p className="text-sm text-muted-foreground">Be the first to start the conversation.</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id || message._id}
                    className={`flex gap-3 message-slide-in ${
                      message.username === user.username ? 'flex-row-reverse' : ''
                    } ${message.isOptimistic ? 'opacity-70' : ''}`}
                  >
                    <Avatar className="w-8 h-8 mt-0.5">
                      <AvatarFallback className="text-sm">
                        {message.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col space-y-1 max-w-xs lg:max-w-md ${
                      message.username === user.username ? 'items-end' : 'items-start'
                    }`}>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        {message.username !== user.username && (
                          <span className="font-medium">{message.username}</span>
                        )}
                        <span>{formatDateTime(message.timestamp || message.createdAt)}</span>
                        {message.isOptimistic && (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        )}
                      </div>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          message.username === user.username
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8 mt-0.5">
                    <AvatarFallback className="text-sm">
                      {typingUsers[0].charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span className="font-medium">
                        {typingUsers.length === 1
                          ? `${typingUsers[0]} is typing...`
                          : `${typingUsers.join(', ')} are typing...`}
                      </span>
                    </div>
                    <div className="bg-muted px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full typing-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t bg-card/50">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    placeholder="Type your message..."
                    className="min-h-[44px] resize-none"
                    maxLength={1000}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!newMessage.trim()}
                  size="lg"
                  className="px-4"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Press Enter to send • {1000 - newMessage.length} characters remaining
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chat;