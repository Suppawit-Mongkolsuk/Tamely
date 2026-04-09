// ===== Chat Window — Header + Messages + Input =====
import { Send, Hash, Bell, MoreVertical, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import type { ChatRoom, DirectMessage, Message, ChatTab } from '@/types/chat-ui';

interface ChatWindowProps {
  activeTab: ChatTab;
  currentRoom: ChatRoom | undefined;
  currentDM: DirectMessage | undefined;
  messages: Message[];
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
}

export function ChatWindow({
  activeTab,
  currentRoom,
  currentDM,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
}: ChatWindowProps) {
  return (
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
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
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
            onChange={(e) => onMessageInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSendMessage()}
            className="flex-1"
          />
          <Button
            onClick={onSendMessage}
            className="bg-linear-to-r from-[#5EBCAD] to-[#46769B] hover:opacity-90 text-white"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Empty state when no room/DM is selected */
export function ChatEmptyState({ activeTab }: { activeTab: ChatTab }) {
  return (
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
  );
}
