// ===== Chat Rooms — Mock Data =====
import type { ChatRoom, DirectMessage, Message, Member } from './types';

export const mockRooms: ChatRoom[] = [
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

export const mockDirectMessages: DirectMessage[] = [
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

export const mockRoomMessages: Message[] = [
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

export const mockDmMessages: { [key: string]: Message[] } = {
  dm1: [
    { id: '1', sender: 'Sarah Johnson', avatar: 'SJ', content: 'Hi! Do you have a moment?', timestamp: '9:15 AM', isOwn: false },
    { id: '2', sender: 'You', avatar: 'JD', content: 'Sure! What do you need?', timestamp: '9:16 AM', isOwn: true },
    { id: '3', sender: 'Sarah Johnson', avatar: 'SJ', content: 'Can you review my PR? I need approval before we can merge it into the main branch.', timestamp: '9:17 AM', isOwn: false },
    { id: '4', sender: 'You', avatar: 'JD', content: "Of course! I'll take a look right now.", timestamp: '9:18 AM', isOwn: true },
    { id: '5', sender: 'Sarah Johnson', avatar: 'SJ', content: 'Thanks so much! Really appreciate it. 🙏', timestamp: '9:19 AM', isOwn: false },
  ],
  dm2: [
    { id: '1', sender: 'Mike Chen', avatar: 'MC', content: 'Hey, thanks for helping me debug that issue yesterday!', timestamp: 'Yesterday', isOwn: false },
    { id: '2', sender: 'You', avatar: 'JD', content: 'No problem at all! Glad we figured it out.', timestamp: 'Yesterday', isOwn: true },
    { id: '3', sender: 'Mike Chen', avatar: 'MC', content: 'It was a tricky one. Thanks for the help!', timestamp: '30m ago', isOwn: false },
  ],
  dm3: [
    { id: '1', sender: 'Emma Wilson', avatar: 'EW', content: 'Hey! I need to discuss the new design system with you.', timestamp: '1h ago', isOwn: false },
    { id: '2', sender: 'Emma Wilson', avatar: 'EW', content: 'Let me know when you are free for a quick call.', timestamp: '1h ago', isOwn: false },
  ],
};

export const mockMembers: Member[] = [
  { id: '1', name: 'Sarah Johnson', role: 'admin', status: 'online', avatar: 'SJ' },
  { id: '2', name: 'Mike Chen', role: 'moderator', status: 'online', avatar: 'MC' },
  { id: '3', name: 'Emma Wilson', role: 'member', status: 'online', avatar: 'EW' },
  { id: '4', name: 'John Doe', role: 'member', status: 'online', avatar: 'JD' },
  { id: '5', name: 'Alex Turner', role: 'member', status: 'away', avatar: 'AT' },
  { id: '6', name: 'Lisa Wang', role: 'member', status: 'online', avatar: 'LW' },
];

export const mockAvailableUsers = [
  { id: '7', name: 'David Brown', avatar: 'DB', status: 'online' as const },
  { id: '8', name: 'Sophie Martinez', avatar: 'SM', status: 'online' as const },
  { id: '9', name: 'Tom Wilson', avatar: 'TW', status: 'away' as const },
  { id: '10', name: 'Rachel Green', avatar: 'RG', status: 'offline' as const },
  { id: '11', name: 'James Anderson', avatar: 'JA', status: 'online' as const },
];
