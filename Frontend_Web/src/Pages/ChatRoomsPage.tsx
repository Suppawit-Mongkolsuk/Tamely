import React, { useState } from 'react';
import {
  Send,
  Search,
  MoreVertical,
  Users,
  Hash,
  Crown,
  Shield,
  UserPlus,
  Bell,
  Plus,
  User,
  MessageCircle,
  UserMinus,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import { Avatar } from '../components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

interface ChatRoom {
  id: string;
  name: string;
  workspace: string;
  unread: number;
  lastMessage: string;
  lastMessageTime: string;
}

interface DirectMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  status: 'online' | 'away' | 'offline';
  unread: number;
  lastMessage: string;
  lastMessageTime: string;
}

interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface Member {
  id: string;
  name: string;
  role: 'admin' | 'moderator' | 'member';
  status: 'online' | 'away' | 'offline';
  avatar: string;
}

export function ChatRoomsPage() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'dms'>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<string>('1');
  const [selectedDM, setSelectedDM] = useState<string>('');
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateRoomDialogOpen, setIsCreateRoomDialogOpen] = useState(false);
  const [isInviteMemberDialogOpen, setIsInviteMemberDialogOpen] =
    useState(false);
  const [selectedUsersToInvite, setSelectedUsersToInvite] = useState<string[]>(
    [],
  );
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] =
    useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null);
  const [isLeaveRoomDialogOpen, setIsLeaveRoomDialogOpen] = useState(false);

  const rooms: ChatRoom[] = [
    {
      id: '1',
      name: 'General',
      workspace: 'Engineering',
      unread: 3,
      lastMessage: "Let's discuss the new feature...",
      lastMessageTime: '2m ago',
    },
    {
      id: '2',
      name: 'Design Reviews',
      workspace: 'Design',
      unread: 0,
      lastMessage: 'The mockups look great!',
      lastMessageTime: '1h ago',
    },
    {
      id: '3',
      name: 'Project Alpha',
      workspace: 'Engineering',
      unread: 5,
      lastMessage: 'We need to push the deadline',
      lastMessageTime: '3h ago',
    },
    {
      id: '4',
      name: 'Random',
      workspace: 'Company-wide',
      unread: 0,
      lastMessage: 'Anyone up for lunch?',
      lastMessageTime: '5h ago',
    },
  ];

  const directMessages: DirectMessage[] = [
    {
      id: 'dm1',
      userId: 'u1',
      userName: 'Sarah Johnson',
      avatar: 'SJ',
      status: 'online',
      unread: 2,
      lastMessage: 'Can you review my PR?',
      lastMessageTime: '5m ago',
    },
    {
      id: 'dm2',
      userId: 'u2',
      userName: 'Mike Chen',
      avatar: 'MC',
      status: 'online',
      unread: 0,
      lastMessage: 'Thanks for the help!',
      lastMessageTime: '30m ago',
    },
    {
      id: 'dm3',
      userId: 'u3',
      userName: 'Emma Wilson',
      avatar: 'EW',
      status: 'away',
      unread: 1,
      lastMessage: 'Let me know when you are free',
      lastMessageTime: '1h ago',
    },
    {
      id: 'dm4',
      userId: 'u4',
      userName: 'Alex Turner',
      avatar: 'AT',
      status: 'offline',
      unread: 0,
      lastMessage: 'See you tomorrow!',
      lastMessageTime: '3h ago',
    },
    {
      id: 'dm5',
      userId: 'u5',
      userName: 'Lisa Wang',
      avatar: 'LW',
      status: 'online',
      unread: 0,
      lastMessage: 'Perfect, that works for me',
      lastMessageTime: '1d ago',
    },
  ];

  const roomMessages: Message[] = [
    {
      id: '1',
      sender: 'Sarah Johnson',
      avatar: 'SJ',
      content:
        "Hey team, I've finished the initial implementation of the user authentication flow. Can someone review the PR?",
      timestamp: '10:30 AM',
      isOwn: false,
    },
    {
      id: '2',
      sender: 'Mike Chen',
      avatar: 'MC',
      content: "I'll take a look at it this afternoon!",
      timestamp: '10:32 AM',
      isOwn: false,
    },
    {
      id: '3',
      sender: 'You',
      avatar: 'JD',
      content:
        "Great work Sarah! I've added some comments on the code structure. Overall it looks solid.",
      timestamp: '10:45 AM',
      isOwn: true,
    },
    {
      id: '4',
      sender: 'Sarah Johnson',
      avatar: 'SJ',
      content:
        "Thanks for the feedback! I'll address those comments and push an update soon.",
      timestamp: '10:47 AM',
      isOwn: false,
    },
    {
      id: '5',
      sender: 'Emma Wilson',
      avatar: 'EW',
      content:
        "While we're on the topic, should we also update the password reset flow?",
      timestamp: '10:50 AM',
      isOwn: false,
    },
    {
      id: '6',
      sender: 'You',
      avatar: 'JD',
      content: "Good point Emma. Let's discuss that in tomorrow's standup.",
      timestamp: '10:52 AM',
      isOwn: true,
    },
  ];

  const dmMessages: { [key: string]: Message[] } = {
    dm1: [
      {
        id: '1',
        sender: 'Sarah Johnson',
        avatar: 'SJ',
        content: 'Hi! Do you have a moment?',
        timestamp: '9:15 AM',
        isOwn: false,
      },
      {
        id: '2',
        sender: 'You',
        avatar: 'JD',
        content: 'Sure! What do you need?',
        timestamp: '9:16 AM',
        isOwn: true,
      },
      {
        id: '3',
        sender: 'Sarah Johnson',
        avatar: 'SJ',
        content:
          'Can you review my PR? I need approval before we can merge it into the main branch.',
        timestamp: '9:17 AM',
        isOwn: false,
      },
      {
        id: '4',
        sender: 'You',
        avatar: 'JD',
        content: "Of course! I'll take a look right now.",
        timestamp: '9:18 AM',
        isOwn: true,
      },
      {
        id: '5',
        sender: 'Sarah Johnson',
        avatar: 'SJ',
        content: 'Thanks so much! Really appreciate it. 🙏',
        timestamp: '9:19 AM',
        isOwn: false,
      },
    ],
    dm2: [
      {
        id: '1',
        sender: 'Mike Chen',
        avatar: 'MC',
        content: 'Hey, thanks for helping me debug that issue yesterday!',
        timestamp: 'Yesterday',
        isOwn: false,
      },
      {
        id: '2',
        sender: 'You',
        avatar: 'JD',
        content: 'No problem at all! Glad we figured it out.',
        timestamp: 'Yesterday',
        isOwn: true,
      },
      {
        id: '3',
        sender: 'Mike Chen',
        avatar: 'MC',
        content: 'It was a tricky one. Thanks for the help!',
        timestamp: '30m ago',
        isOwn: false,
      },
    ],
    dm3: [
      {
        id: '1',
        sender: 'Emma Wilson',
        avatar: 'EW',
        content: 'Hey! I need to discuss the new design system with you.',
        timestamp: '1h ago',
        isOwn: false,
      },
      {
        id: '2',
        sender: 'Emma Wilson',
        avatar: 'EW',
        content: 'Let me know when you are free for a quick call.',
        timestamp: '1h ago',
        isOwn: false,
      },
    ],
  };

  const members: Member[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'admin',
      status: 'online',
      avatar: 'SJ',
    },
    {
      id: '2',
      name: 'Mike Chen',
      role: 'moderator',
      status: 'online',
      avatar: 'MC',
    },
    {
      id: '3',
      name: 'Emma Wilson',
      role: 'member',
      status: 'online',
      avatar: 'EW',
    },
    {
      id: '4',
      name: 'John Doe',
      role: 'member',
      status: 'online',
      avatar: 'JD',
    },
    {
      id: '5',
      name: 'Alex Turner',
      role: 'member',
      status: 'away',
      avatar: 'AT',
    },
    {
      id: '6',
      name: 'Lisa Wang',
      role: 'member',
      status: 'online',
      avatar: 'LW',
    },
  ];

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // Handle message sending
    setMessageInput('');
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsersToInvite((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleInviteMembers = () => {
    // Handle invitation logic
    console.log('Inviting users:', selectedUsersToInvite);
    setSelectedUsersToInvite([]);
    setInviteSearchQuery('');
    setIsInviteMemberDialogOpen(false);
  };

  const handleRemoveMember = () => {
    // Handle removal logic
    if (memberToRemove) {
      console.log('Removing member:', memberToRemove.name);
      setMemberToRemove(null);
      setIsRemoveMemberDialogOpen(false);
    }
  };

  // Get available users to invite (not already in the room)
  const currentMemberIds = members.map((m) => m.id);
  const availableUsers = [
    { id: '7', name: 'David Brown', avatar: 'DB', status: 'online' as const },
    {
      id: '8',
      name: 'Sophie Martinez',
      avatar: 'SM',
      status: 'online' as const,
    },
    { id: '9', name: 'Tom Wilson', avatar: 'TW', status: 'away' as const },
    {
      id: '10',
      name: 'Rachel Green',
      avatar: 'RG',
      status: 'offline' as const,
    },
    {
      id: '11',
      name: 'James Anderson',
      avatar: 'JA',
      status: 'online' as const,
    },
  ].filter((user) => !currentMemberIds.includes(user.id));

  const filteredAvailableUsers = availableUsers.filter((user) =>
    user.name.toLowerCase().includes(inviteSearchQuery.toLowerCase()),
  );

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredDMs = directMessages.filter((dm) =>
    dm.userName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const currentRoom = rooms.find((r) => r.id === selectedRoom);
  const currentDM = directMessages.find((dm) => dm.id === selectedDM);
  const currentMessages =
    activeTab === 'rooms' ? roomMessages : dmMessages[selectedDM] || [];

  return (
    <div className="flex h-full bg-muted">
      {/* Left Sidebar - Rooms/DMs List */}
      <div className="w-80 bg-white border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'rooms' | 'dms')}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rooms" className="gap-2">
                <Hash className="size-4" />
                Rooms
              </TabsTrigger>
              <TabsTrigger value="dms" className="gap-2">
                <MessageCircle className="size-4" />
                Direct Messages
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Search */}
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === 'rooms' ? 'Search rooms...' : 'Search people...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Rooms/DMs List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {activeTab === 'rooms' ? (
              <>
                {/* Create Room Button */}
                <Dialog
                  open={isCreateRoomDialogOpen}
                  onOpenChange={setIsCreateRoomDialogOpen}
                >
                  <DialogTrigger asChild>
                    <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors text-sm text-muted-foreground">
                      <div className="size-8 rounded-lg bg-[#5EBCAD] flex items-center justify-center">
                        <Plus className="size-4 text-white" />
                      </div>
                      <span>Create New Room</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-125">
                    <DialogHeader>
                      <DialogTitle>Create New Room</DialogTitle>
                      <DialogDescription>
                        Set up a new chat room for your team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="roomName">Room Name</Label>
                        <Input
                          id="roomName"
                          placeholder="e.g., Project Updates"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="workspace">Workspace</Label>
                        <Select>
                          <SelectTrigger id="workspace" className="mt-1">
                            <SelectValue placeholder="Select workspace" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engineering">
                              Engineering
                            </SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="company">
                              Company-wide
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="What's this room about?"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="private" />
                        <Label htmlFor="private" className="cursor-pointer">
                          Make this room private
                        </Label>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreateRoomDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
                          onClick={() => setIsCreateRoomDialogOpen(false)}
                        >
                          Create Room
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Room List */}
                {filteredRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => {
                      setSelectedRoom(room.id);
                      setSelectedDM('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      selectedRoom === room.id && activeTab === 'rooms'
                        ? 'bg-[#5EBCAD]/10 border-l-2 border-[#5EBCAD]'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Hash className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{room.name}</span>
                      </div>
                      {room.unread > 0 && (
                        <Badge className="bg-[#5EBCAD] text-white shrink-0">
                          {room.unread}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate pl-6">
                      {room.lastMessage}
                    </p>
                    <div className="flex items-center justify-between mt-1 pl-6">
                      <span className="text-xs text-muted-foreground">
                        {room.workspace}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {room.lastMessageTime}
                      </span>
                    </div>
                  </button>
                ))}
              </>
            ) : (
              <>
                {/* Direct Messages List */}
                {filteredDMs.map((dm) => (
                  <button
                    key={dm.id}
                    onClick={() => {
                      setSelectedDM(dm.id);
                      setSelectedRoom('');
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                      selectedDM === dm.id && activeTab === 'dms'
                        ? 'bg-[#5EBCAD]/10 border-l-2 border-[#5EBCAD]'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                          {dm.avatar}
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                            dm.status === 'online'
                              ? 'bg-green-500'
                              : dm.status === 'away'
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="truncate">{dm.userName}</span>
                          {dm.unread > 0 && (
                            <Badge className="bg-[#5EBCAD] text-white shrink-0">
                              {dm.unread}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {dm.lastMessage}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {dm.lastMessageTime}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Center - Chat Area */}
      {selectedRoom || selectedDM ? (
        <>
          <div className="flex-1 flex flex-col bg-white">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeTab === 'rooms' ? (
                  <>
                    <div className="size-10 rounded-lg bg-[#003366] flex items-center justify-center">
                      <Hash className="size-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base">{currentRoom?.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentRoom?.workspace}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                        {currentDM?.avatar}
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                          currentDM?.status === 'online'
                            ? 'bg-green-500'
                            : currentDM?.status === 'away'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-base">{currentDM?.userName}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {currentDM?.status}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeTab === 'rooms' && (
                  <Button variant="ghost" size="sm">
                    <Bell className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm">
                  <MoreVertical className="size-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-4">
                {currentMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`size-10 rounded-full flex items-center justify-center text-white shrink-0 ${
                        message.isOwn ? 'bg-[#003366]' : 'bg-[#75A2BF]'
                      }`}
                    >
                      {message.avatar}
                    </div>
                    <div
                      className={`flex-1 max-w-2xl ${message.isOwn ? 'text-right' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!message.isOwn && (
                          <span className="text-sm">{message.sender}</span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp}
                        </span>
                      </div>
                      <div
                        className={`inline-block p-3 rounded-2xl ${
                          message.isOwn
                            ? 'bg-[#003366] text-white rounded-br-none'
                            : 'bg-muted rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder={
                    activeTab === 'rooms'
                      ? `Message #${currentRoom?.name}`
                      : `Message ${currentDM?.userName}`
                  }
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Details */}
          <div className="w-80 bg-white border-l border-border p-4 space-y-6">
            {activeTab === 'rooms' ? (
              <>
                {/* Room Members */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base">Members ({members.length})</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsInviteMemberDialogOpen(true)}
                    >
                      <UserPlus className="size-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="relative">
                          <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                            {member.avatar}
                          </div>
                          <div
                            className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                              member.status === 'online'
                                ? 'bg-green-500'
                                : member.status === 'away'
                                  ? 'bg-yellow-500'
                                  : 'bg-gray-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{member.name}</p>
                          <div className="flex items-center gap-1">
                            {member.role === 'admin' && (
                              <Crown className="size-3 text-yellow-600" />
                            )}
                            {member.role === 'moderator' && (
                              <Shield className="size-3 text-blue-600" />
                            )}
                            <span className="text-xs text-muted-foreground capitalize">
                              {member.role}
                            </span>
                          </div>
                        </div>
                        {/* Remove button - show on hover, not for admins */}
                        {member.role !== 'admin' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMemberToRemove(member);
                              setIsRemoveMemberDialogOpen(true);
                            }}
                          >
                            <UserMinus className="size-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Announcements */}
                <div>
                  <h3 className="text-base mb-3">Related Announcements</h3>
                  <div className="space-y-2">
                    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm mb-1">Q1 Product Roadmap Review</p>
                      <p className="text-xs text-muted-foreground">
                        2 hours ago
                      </p>
                    </Card>
                    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <p className="text-sm mb-1">Sprint Planning - Week 5</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </Card>
                  </div>
                </div>

                {/* Leave Room Button */}
                <div className="pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setIsLeaveRoomDialogOpen(true)}
                  >
                    <LogOut className="size-4 mr-2" />
                    Leave Room
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* DM User Info */}
                <div className="text-center">
                  <div className="relative inline-block mb-3">
                    <div className="size-20 rounded-full bg-[#75A2BF] flex items-center justify-center text-white text-2xl">
                      {currentDM?.avatar}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 size-4 rounded-full border-2 border-white ${
                        currentDM?.status === 'online'
                          ? 'bg-green-500'
                          : currentDM?.status === 'away'
                            ? 'bg-yellow-500'
                            : 'bg-gray-400'
                      }`}
                    />
                  </div>
                  <h3 className="text-base mb-1">{currentDM?.userName}</h3>
                  <p className="text-sm text-muted-foreground capitalize mb-4">
                    {currentDM?.status}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // View user profile
                    }}
                  >
                    <User className="size-4 mr-2" />
                    View Profile
                  </Button>
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="text-sm mb-3">Quick Actions</h4>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Bell className="size-4 mr-2" />
                      Mute Conversation
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="size-4 mr-2" />
                      Create Group Chat
                    </Button>
                  </div>
                </div>

                {/* Shared Files */}
                <div>
                  <h4 className="text-sm mb-3">Shared Files</h4>
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-xs">No files shared yet</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="size-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">
              {activeTab === 'rooms'
                ? 'Select a room to start chatting'
                : 'Select a conversation'}
            </p>
            <p className="text-sm">
              {activeTab === 'rooms'
                ? 'Choose a room from the list or create a new one'
                : 'Choose someone to message'}
            </p>
          </div>
        </div>
      )}

      {/* Invite Member Dialog */}
      <Dialog
        open={isInviteMemberDialogOpen}
        onOpenChange={setIsInviteMemberDialogOpen}
      >
        <DialogContent className="sm:max-w-137.5">
          <DialogHeader>
            <DialogTitle>Invite Members to {currentRoom?.name}</DialogTitle>
            <DialogDescription>
              Select team members to invite to this room
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={inviteSearchQuery}
                onChange={(e) => setInviteSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Selected Count */}
            {selectedUsersToInvite.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-[#5EBCAD]/10 rounded-lg">
                <UserPlus className="size-4 text-[#5EBCAD]" />
                <span className="text-sm">
                  {selectedUsersToInvite.length} member
                  {selectedUsersToInvite.length > 1 ? 's' : ''} selected
                </span>
              </div>
            )}

            {/* User List */}
            <ScrollArea className="h-75 pr-3">
              <div className="space-y-2">
                {filteredAvailableUsers.length > 0 ? (
                  filteredAvailableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => toggleUserSelection(user.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedUsersToInvite.includes(user.id)
                          ? 'bg-[#5EBCAD]/10 border-2 border-[#5EBCAD]'
                          : 'border-2 border-transparent hover:bg-muted'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                          {user.avatar}
                        </div>
                        <div
                          className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                            user.status === 'online'
                              ? 'bg-green-500'
                              : user.status === 'away'
                                ? 'bg-yellow-500'
                                : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user.status}
                        </p>
                      </div>
                      <div
                        className={`size-5 rounded border-2 flex items-center justify-center ${
                          selectedUsersToInvite.includes(user.id)
                            ? 'bg-[#5EBCAD] border-[#5EBCAD]'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {selectedUsersToInvite.includes(user.id) && (
                          <svg
                            className="size-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="size-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">
                      {inviteSearchQuery
                        ? 'No members found'
                        : 'No available members to invite'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-between items-center gap-2 pt-4 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUsersToInvite([])}
                disabled={selectedUsersToInvite.length === 0}
              >
                Clear Selection
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInviteMemberDialogOpen(false);
                    setSelectedUsersToInvite([]);
                    setInviteSearchQuery('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
                  onClick={handleInviteMembers}
                  disabled={selectedUsersToInvite.length === 0}
                >
                  <UserPlus className="size-4 mr-2" />
                  Invite{' '}
                  {selectedUsersToInvite.length > 0
                    ? `(${selectedUsersToInvite.length})`
                    : ''}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog
        open={isRemoveMemberDialogOpen}
        onOpenChange={setIsRemoveMemberDialogOpen}
      >
        <DialogContent className="sm:max-w-137.5">
          <DialogHeader>
            <DialogTitle>Remove Member from {currentRoom?.name}</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToRemove?.name} from this
              room?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* User Info */}
            {memberToRemove && (
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-[#75A2BF] flex items-center justify-center text-white">
                    {memberToRemove.avatar}
                  </div>
                  <div
                    className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${
                      memberToRemove.status === 'online'
                        ? 'bg-green-500'
                        : memberToRemove.status === 'away'
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm">{memberToRemove.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {memberToRemove.status}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRemoveMemberDialogOpen(false);
                  setMemberToRemove(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleRemoveMember}
              >
                <UserMinus className="size-4 mr-2" />
                Remove Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Leave Room Dialog */}
      <Dialog
        open={isLeaveRoomDialogOpen}
        onOpenChange={setIsLeaveRoomDialogOpen}
      >
        <DialogContent className="sm:max-w-137.5">
          <DialogHeader>
            <DialogTitle>Leave {currentRoom?.name}</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this room?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Warning Message */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="size-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-amber-900 mb-1">
                  You will no longer have access to this room's messages and
                  files.
                </p>
                <p className="text-xs text-amber-700">
                  You can rejoin if you're invited again by a member.
                </p>
              </div>
            </div>

            {/* Room Info */}
            <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
              <div className="size-12 rounded-lg bg-[#003366] flex items-center justify-center">
                <Hash className="size-6 text-white" />
              </div>
              <div>
                <p className="text-sm">{currentRoom?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentRoom?.workspace}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setIsLeaveRoomDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  console.log('Leaving room:', currentRoom?.name);
                  setIsLeaveRoomDialogOpen(false);
                  // Optionally redirect or change selected room
                }}
              >
                <LogOut className="size-4 mr-2" />
                Leave Room
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
