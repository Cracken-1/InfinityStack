export interface ChatMessage {
  id: string;
  content: string;
  userId: string;
  userName: string;
  tenantId: string;
  channelId: string;
  timestamp: string;
  type: 'text' | 'file' | 'system';
}

export interface ChatChannel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  tenantId: string;
  members: string[];
  createdAt: string;
}

export class ChatManager {
  private messages: Map<string, ChatMessage[]> = new Map();
  private channels: Map<string, ChatChannel> = new Map();

  createChannel(channel: Omit<ChatChannel, 'id' | 'createdAt'>): ChatChannel {
    const newChannel: ChatChannel = {
      ...channel,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    this.channels.set(newChannel.id, newChannel);
    this.messages.set(newChannel.id, []);
    return newChannel;
  }

  sendMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const newMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    const channelMessages = this.messages.get(message.channelId) || [];
    channelMessages.push(newMessage);
    this.messages.set(message.channelId, channelMessages);

    return newMessage;
  }

  getMessages(channelId: string, limit = 50): ChatMessage[] {
    const messages = this.messages.get(channelId) || [];
    return messages.slice(-limit);
  }

  getChannels(tenantId: string, userId: string): ChatChannel[] {
    return Array.from(this.channels.values()).filter(channel => 
      channel.tenantId === tenantId && 
      (channel.type === 'public' || channel.members.includes(userId))
    );
  }

  joinChannel(channelId: string, userId: string) {
    const channel = this.channels.get(channelId);
    if (channel && !channel.members.includes(userId)) {
      channel.members.push(userId);
    }
  }
}