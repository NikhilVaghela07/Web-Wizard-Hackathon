import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../utils/api';
import { toast } from 'react-toastify';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Checkbox } from "../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

import { 
  Plus, 
  Hash, 
  Users, 
  Settings, 
  LogOut,
  MessageCircle,
  Globe,
  Copy,
  MoreVertical,
  Crown,
  Calendar,
  UserPlus,
  User
} from "lucide-react";

const RoomDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Create Room Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    isPrivate: false,
    maxMembers: 50
  });
  const [createLoading, setCreateLoading] = useState(false);
  
  // Join Room Modal
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({ roomCode: '' });
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRooms();
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    
    if (!createForm.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    try {
      setCreateLoading(true);
      const response = await roomsAPI.createRoom(createForm);
      
      toast.success('Room created successfully!');
      setRooms(prev => [response.data.room, ...prev]);
      setCreateModalOpen(false);
      setCreateForm({ name: '', description: '', isPrivate: false, maxMembers: 50 });
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error(error.response?.data?.message || 'Failed to create room');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    
    if (!joinForm.roomCode.trim()) {
      toast.error('Room code is required');
      return;
    }

    try {
      setJoinLoading(true);
      const response = await roomsAPI.joinRoom(joinForm.roomCode.trim());
      
      toast.success('Successfully joined room!');
      
      // Check if room already exists in list
      const existingRoom = rooms.find(room => room.id === response.data.room.id);
      if (!existingRoom) {
        setRooms(prev => [response.data.room, ...prev]);
      }
      
      setJoinModalOpen(false);
      setJoinForm({ roomCode: '' });
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error(error.response?.data?.message || 'Failed to join room');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleEnterRoom = (roomId) => {
    navigate(`/chat/${roomId}`);
  };

  const handleEnterGlobalChat = () => {
    navigate('/chat');
  };

  const copyRoomCode = (roomCode) => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied to clipboard!');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">ChatRoom Hub</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user.username}!</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {user.username}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Action Buttons */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleEnterGlobalChat}
            className="flex-1 h-14 gap-3"
            variant="outline"
          >
            <Globe className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">Global Chat</div>
              <div className="text-sm text-muted-foreground">Join the public conversation</div>
            </div>
          </Button>

          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 h-14 gap-3">
                <Plus className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Create Room</div>
                  <div className="text-sm text-primary-foreground/80">Start your own chat room</div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreateRoom}>
                <DialogHeader>
                  <DialogTitle>Create New Room</DialogTitle>
                  <DialogDescription>
                    Create a private space for you and your friends to chat.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Room Name *</Label>
                    <Input
                      id="name"
                      value={createForm.name}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter room name"
                      maxLength={50}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="What's this room about? (optional)"
                      maxLength={200}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPrivate"
                      checked={createForm.isPrivate}
                      onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isPrivate: checked }))}
                    />
                    <Label htmlFor="isPrivate">Private room (invite only)</Label>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="maxMembers">Max Members</Label>
                    <Input
                      id="maxMembers"
                      type="number"
                      value={createForm.maxMembers}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, maxMembers: parseInt(e.target.value) || 50 }))}
                      min={2}
                      max={100}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? 'Creating...' : 'Create Room'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 h-14 gap-3">
                <UserPlus className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Join Room</div>
                  <div className="text-sm text-muted-foreground">Enter with a room code</div>
                </div>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleJoinRoom}>
                <DialogHeader>
                  <DialogTitle>Join Room</DialogTitle>
                  <DialogDescription>
                    Enter the room code to join an existing chat room.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="roomCode">Room Code *</Label>
                    <Input
                      id="roomCode"
                      value={joinForm.roomCode}
                      onChange={(e) => setJoinForm({ roomCode: e.target.value.toUpperCase() })}
                      placeholder="Enter 6-character room code"
                      maxLength={6}
                      className="uppercase tracking-wider font-mono"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setJoinModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={joinLoading}>
                    {joinLoading ? 'Joining...' : 'Join Room'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Rooms Grid */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Your Rooms</h2>
            <p className="text-muted-foreground">
              {rooms.length === 0 
                ? "You haven't joined any rooms yet. Create one or join with a room code!"
                : `You're part of ${rooms.length} room${rooms.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {rooms.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Hash className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No rooms yet</h3>
              <p className="text-muted-foreground mb-6">Create your first room or join one with a room code</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Room
                </Button>
                <Button variant="outline" onClick={() => setJoinModalOpen(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Join Room
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <Card 
                  key={room.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
                  onClick={() => handleEnterRoom(room.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Hash className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg truncate">{room.name}</h3>
                          <p className="text-sm text-muted-foreground flex items-center">
                            {room.userRole === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                            {room.userRole === 'admin' ? 'Admin' : 'Member'}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            copyRoomCode(room.roomCode);
                          }}>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Code
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {room.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {room.description}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Room Code</span>
                        <code className="bg-muted px-2 py-1 rounded font-mono text-xs">
                          {room.roomCode}
                        </code>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          Members
                        </span>
                        <span>{room.memberCount}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          Last Active
                        </span>
                        <span>{formatDate(room.lastActivity)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomDashboard;