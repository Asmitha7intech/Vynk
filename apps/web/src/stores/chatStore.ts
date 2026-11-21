import { create } from 'zustand';
import { Conversation, Message } from '@vynk/types';

interface ChatState {
  activeConversationId: string | null;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  setActiveConversation: (id: string | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  setTyping: (conversationId: string, username: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  conversations: [],
  messages: {},
  typingUsers: {},
  setActiveConversation: (id) => set({ activeConversationId: id }),
  setConversations: (conversations) => set({ conversations }),
  addMessage: (conversationId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: [...(state.messages[conversationId] || []), message],
    },
  })),
  setMessages: (conversationId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: messages,
    },
  })),
  setTyping: (conversationId, username, isTyping) => set((state) => {
    const current = state.typingUsers[conversationId] || [];
    const updated = isTyping
      ? Array.from(new Set([...current, username]))
      : current.filter((u) => u !== username);
    return {
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: updated,
      },
    };
  }),
}));
