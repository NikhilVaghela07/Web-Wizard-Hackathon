import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../utils/api';
import { toast } from 'react-toastify';

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
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
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";

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
  User,
  Search,
  Filter,
  Sparkles,
  Zap,
  Heart,
  Star,
  Clock,
  Shield,
  Lock,
  Unlock
} from "lucide-react";

const RoomDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, admin, member

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

  useEffect(() => {
    filterRooms();
  }, [rooms, searchQuery, filterType]);

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

  const filterRooms = () => {
    let filtered = rooms;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType === 'admin') {
      filtered = filtered.filter(room => room.userRole === 'admin');
    } else if (filterType === 'member') {
      filtered = filtered.filter(room => room.userRole === 'member');
    }

    setFilteredRooms(filtered);
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

  const getRoomGradient = (index) => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-orange-500 to-red-600',
      'from-pink-500 to-rose-600',
      'from-indigo-500 to-blue-600',
      'from-cyan-500 to-blue-600'
    ];
    return gradients[index % gradients.length];
  };

  // Skeleton Loading Component
  const RoomCardSkeleton = () => (
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="flex justify-between">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header Skeleton */}
        <header className="border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mt-1"></div>
              </div>
            </div>
            <div className="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Action Buttons Skeleton */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 h-14 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex-1 h-14 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="flex-1 h-14 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>

          {/* Rooms Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <header className="border-b bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Chatrix Hub
                </h1>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Welcome back, {user.username}!
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 rounded-full px-4 py-2">
                  <Avatar className="w-8 h-8 ring-2 ring-blue-100">
                    <AvatarImage src={user.profilePicture} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.username}</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-xl border-0 bg-white/95 backdrop-blur-xl">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  My Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Enhanced Action Buttons */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6" onClick={handleEnterGlobalChat}>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <Globe className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Global Chat</h3>
                  <p className="text-blue-100 text-sm">Join the public conversation</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Create Room</h3>
                      <p className="text-green-100 text-sm">Start your own chat room</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateRoom}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Create New Room
                  </DialogTitle>
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
                      className="focus:ring-2 focus:ring-green-500"
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
                      className="focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPrivate"
                      checked={createForm.isPrivate}
                      onCheckedChange={(checked) => setCreateForm(prev => ({ ...prev, isPrivate: checked }))}
                    />
                    <Label htmlFor="isPrivate" className="flex items-center gap-2">
                      {createForm.isPrivate ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      Private room (invite only)
                    </Label>
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
                      className="focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    {createLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Room
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={joinModalOpen} onOpenChange={setJoinModalOpen}>
            <DialogTrigger asChild>
              <Card className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Join Room</h3>
                      <p className="text-purple-100 text-sm">Enter with a room code</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleJoinRoom}>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Join Room
                  </DialogTitle>
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
                      className="uppercase tracking-wider font-mono text-center text-lg focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setJoinModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={joinLoading} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                    {joinLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Join Room
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Your Rooms
              </h2>
              <p className="text-muted-foreground mt-1">
                {filteredRooms.length === 0 && rooms.length > 0
                  ? "No rooms match your search"
                  : `You're part of ${rooms.length} room${rooms.length === 1 ? '' : 's'}`}
              </p>
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search rooms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    {filterType === 'all' ? 'All Rooms' : filterType === 'admin' ? 'Admin Only' : 'Member Only'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterType('all')}>
                    All Rooms
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('admin')}>
                    <Crown className="w-4 h-4 mr-2" />
                    Admin Only
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterType('member')}>
                    <User className="w-4 h-4 mr-2" />
                    Member Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Enhanced Rooms Grid */}
        {filteredRooms.length === 0 && rooms.length === 0 ? (
          <Card className="p-16 text-center bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-dashed border-blue-200">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <Hash className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                No rooms yet
              </h3>
              <p className="text-muted-foreground mb-8 text-lg">
                Create your first room or join one with a room code to start chatting!
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setJoinModalOpen(true)}
                  className="border-2 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Join Room
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room, index) => (
              <Card
                key={room.id}
                className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-blue-500/10"
                onClick={() => handleEnterRoom(room.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-r ${getRoomGradient(index)} rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                        <Hash className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-lg truncate group-hover:text-blue-600 transition-colors">
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {room.userRole === 'admin' ? (
                            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0">
                              <Crown className="w-3 h-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-blue-200 text-blue-600">
                              <User className="w-3 h-3 mr-1" />
                              Member
                            </Badge>
                          )}
                          {room.isPrivate && (
                            <Badge variant="outline" className="border-red-200 text-red-600">
                              <Lock className="w-3 h-3 mr-1" />
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
                        >
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
                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-relaxed">
                      {room.description}
                    </p>
                  )}

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Room Code
                      </span>
                      <code className="bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-1 rounded-lg font-mono text-xs font-semibold text-gray-700 shadow-sm">
                        {room.roomCode}
                      </code>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Members
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-semibold text-sm">{room.memberCount}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-sm flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Last Active
                      </span>
                      <span className="text-sm font-medium">{formatDate(room.lastActivity)}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-300 group-hover:shadow-blue-500/25"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnterRoom(room.id);
                      }}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enter Room
                      <Zap className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomDashboard;