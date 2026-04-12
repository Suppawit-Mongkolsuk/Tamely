// ===== Chat Rooms — Mock Data =====
import type { ChatRoom, DirectMessage, Message, Member } from '@/types/chat-ui';

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

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); })();

export const mockRoomMessages: Message[] = [
  { id: '1', sender: 'Sarah Johnson', avatar: 'SJ', date: YESTERDAY, content: "Hey team, I've finished the initial implementation of the user authentication flow. Can someone review the PR?", timestamp: '10:30', isOwn: false },
  { id: '2', sender: 'Mike Chen',     avatar: 'MC', date: YESTERDAY, content: "I'll take a look at it this afternoon!", timestamp: '10:32', isOwn: false },
  { id: '3', sender: 'You',           avatar: 'JD', date: YESTERDAY, content: "Great work Sarah! I've added some comments on the code structure. Overall it looks solid.", timestamp: '10:45', isOwn: true },
  { id: '4', sender: 'Sarah Johnson', avatar: 'SJ', date: YESTERDAY, content: "Thanks for the feedback! I'll address those comments and push an update soon.", timestamp: '10:47', isOwn: false },
  { id: '5', sender: 'Emma Wilson',   avatar: 'EW', date: TODAY,     content: "While we're on the topic, should we also update the password reset flow?", timestamp: '09:50', isOwn: false },
  { id: '6', sender: 'You',           avatar: 'JD', date: TODAY,     content: "Good point Emma. Let's discuss that in tomorrow's standup.", timestamp: '09:52', isOwn: true },
];

export const mockDmMessages: { [key: string]: Message[] } = {
  dm1: [
    { id: '1', sender: 'Sarah Johnson', avatar: 'SJ', date: TODAY, content: 'Hi! Do you have a moment?', timestamp: '09:15', isOwn: false },
    { id: '2', sender: 'You', avatar: 'JD', date: TODAY, content: 'Sure! What do you need?', timestamp: '09:16', isOwn: true },
    { id: '3', sender: 'Sarah Johnson', avatar: 'SJ', date: TODAY, content: 'Can you review my PR? I need approval before we can merge it into the main branch.', timestamp: '09:17', isOwn: false },
    { id: '4', sender: 'You', avatar: 'JD', date: TODAY, content: "Of course! I'll take a look right now.", timestamp: '09:18', isOwn: true },
    { id: '5', sender: 'Sarah Johnson', avatar: 'SJ', date: TODAY, content: 'Thanks so much! Really appreciate it. 🙏', timestamp: '09:19', isOwn: false },
  ],
  dm2: [
    { id: '1', sender: 'Mike Chen', avatar: 'MC', date: YESTERDAY, content: 'Hey, thanks for helping me debug that issue yesterday!', timestamp: '18:00', isOwn: false },
    { id: '2', sender: 'You', avatar: 'JD', date: YESTERDAY, content: 'No problem at all! Glad we figured it out.', timestamp: '18:05', isOwn: true },
    { id: '3', sender: 'Mike Chen', avatar: 'MC', date: TODAY, content: 'It was a tricky one. Thanks for the help!', timestamp: '09:30', isOwn: false },
  ],
  dm3: [
    { id: '1', sender: 'Emma Wilson', avatar: 'EW', date: TODAY, content: 'Hey! I need to discuss the new design system with you.', timestamp: '10:00', isOwn: false },
    { id: '2', sender: 'Emma Wilson', avatar: 'EW', date: TODAY, content: 'Let me know when you are free for a quick call.', timestamp: '10:01', isOwn: false },
  ],
};

export const mockMembers: Member[] = [
  { id: '1', name: 'Sarah Johnson', role: 'OWNER', status: 'online', avatar: 'SJ' },
  { id: '2', name: 'Mike Chen', role: 'ADMIN', status: 'online', avatar: 'MC' },
  { id: '3', name: 'Emma Wilson', role: 'MODERATOR', status: 'online', avatar: 'EW' },
  { id: '4', name: 'John Doe', role: 'MEMBER', status: 'online', avatar: 'JD' },
  { id: '5', name: 'Alex Turner', role: 'MEMBER', status: 'away', avatar: 'AT' },
  { id: '6', name: 'Lisa Wang', role: 'MEMBER', status: 'online', avatar: 'LW' },
];

export const mockAvailableUsers = [
  { id: '7', name: 'David Brown', avatar: 'DB', status: 'online' as const },
  { id: '8', name: 'Sophie Martinez', avatar: 'SM', status: 'online' as const },
  { id: '9', name: 'Tom Wilson', avatar: 'TW', status: 'away' as const },
  { id: '10', name: 'Rachel Green', avatar: 'RG', status: 'offline' as const },
  { id: '11', name: 'James Anderson', avatar: 'JA', status: 'online' as const },
];
