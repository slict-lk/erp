'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle,
    X,
    Send,
    Loader2,
    Sparkles,
    Bot,
    User,
    TrendingUp,
    Package,
    Users,
    Clock,
    Copy,
    RotateCcw,
    Trash2,
    ChevronDown,
    Plus,
    Menu,
    ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    role: 'USER' | 'ASSISTANT' | 'SYSTEM';
    content: string;
    functionCalls?: any[];
    createdAt: Date | string;
}

interface Conversation {
    id: string;
    title?: string;
    messages: Message[];
    createdAt: Date | string;
    updatedAt: Date | string;
}

export default function AIChatAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // TODO: wire up real auth/session for user and tenant
    const userId = 'user-1';
    const tenantId = 'tenant-1';

    useEffect(() => {
        if (isOpen && conversations.length === 0) {
            fetchConversations();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const deleteMessage = (id: string) => {
        setMessages(messages.filter(m => m.id !== id));
    };

    const fetchConversations = async () => {
        try {
            const response = await fetch(
                `/api/ai/chat/conversations?tenantId=${tenantId}`
            );
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            } else if (response.status === 401) {
                console.error('Unauthorized - please log in');
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchConversation = async (conversationId: string) => {
        try {
            const response = await fetch(
                `/api/ai/chat/${conversationId}?tenantId=${tenantId}`
            );
            if (response.ok) {
                const data = await response.json();
                setCurrentConversation(data);
                setMessages(data.messages);
            }
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const startNewConversation = async (message: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/ai/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tenantId,
                    message,
                }),
            });

            if (response.ok) {
                const conversation = await response.json();
                setCurrentConversation(conversation);
                setMessages(conversation.messages);
                setConversations([conversation, ...conversations]);
            } else if (response.status === 401) {
                console.error('Unauthorized - please log in');
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async (message: string) => {
        if (!message.trim()) return;

        if (!currentConversation) {
            await startNewConversation(message);
            setInput('');
            return;
        }

        // Add user message optimistically
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'USER',
            content: message,
            createdAt: new Date(),
        };
        setMessages([...messages, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Use new local AI engine endpoint
            const response = await fetch(`/api/ai/chat/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: currentConversation.id,
                    message,
                    tenantId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const assistantMessage: Message = {
                    id: data.message.id,
                    role: 'ASSISTANT',
                    content: data.message.content,
                    functionCalls: data.functionCall ? [data.functionCall] : undefined,
                    createdAt: data.message.createdAt,
                };
                setMessages((prev) => [...prev, assistantMessage]);
            } else if (response.status === 401) {
                console.error('Unauthorized - please log in');
            } else {
                const error = await response.json();
                console.error('Error:', error.error);
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const handleNewConversation = () => {
        setCurrentConversation(null);
        setMessages([]);
        setInput('');
        inputRef.current?.focus();
    };

    const suggestedQueries = [
        { icon: TrendingUp, label: 'Show sales summary', query: 'Show me sales summary for this month' },
        { icon: Package, label: 'Inventory status', query: 'What is my current inventory status?' },
        { icon: Users, label: 'Recent customers', query: 'Show me recent customers' },
        { icon: Clock, label: 'Pending tasks', query: 'What are my pending tasks?' },
    ];

    return (
        <>
            {/* Floating Chat Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                size="lg"
                                className="h-16 w-16 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-2xl hover:shadow-violet-500/50 transition-all duration-300"
                                onClick={() => setIsOpen(true)}
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                >
                                    <Sparkles className="h-6 w-6" />
                                </motion.div>
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.9 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-50 w-[500px] h-[700px] flex flex-col rounded-2xl shadow-2xl bg-white overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 p-4 text-white">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                        <Bot className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">AI Assistant</h3>
                                        <p className="text-xs text-white/80">Powered by Groq + Llama 3</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white hover:bg-white/20"
                                        onClick={() => setSidebarOpen(!sidebarOpen)}
                                    >
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-white hover:bg-white/20"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                            {currentConversation && (
                                <div className="text-xs text-white/90 truncate px-1">
                                    {currentConversation.title || 'Conversation'}
                                </div>
                            )}
                        </div>

                        {/* Main Content */}
                        <div className="flex flex-1 overflow-hidden">
                            {/* Sidebar */}
                            {sidebarOpen && (
                                <motion.div
                                    initial={{ x: -250, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -250, opacity: 0 }}
                                    className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col overflow-hidden"
                                >
                                    <div className="p-3 border-b border-gray-200">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="w-full justify-start gap-2 text-sm"
                                            onClick={handleNewConversation}
                                        >
                                            <Plus className="h-4 w-4" />
                                            New Chat
                                        </Button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto space-y-1 p-2">
                                        {conversations.length === 0 ? (
                                            <div className="text-xs text-gray-500 p-2 text-center py-4">
                                                No conversations yet
                                            </div>
                                        ) : (
                                            conversations.map((conv) => (
                                                <motion.button
                                                    key={conv.id}
                                                    whileHover={{ x: 4 }}
                                                    onClick={() => fetchConversation(conv.id)}
                                                    className={cn(
                                                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-start gap-2',
                                                        currentConversation?.id === conv.id
                                                            ? 'bg-violet-100 text-violet-900'
                                                            : 'text-gray-700 hover:bg-gray-200'
                                                    )}
                                                >
                                                    <MessageCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    <span className="truncate flex-1">
                                                        {conv.title || 'Untitled'}
                                                    </span>
                                                </motion.button>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Messages Area */}
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-violet-100 to-fuchsia-100 flex items-center justify-center mb-4">
                                                <Sparkles className="h-10 w-10 text-violet-600" />
                                            </div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                                                Welcome! How can I help?
                                            </h4>
                                            <p className="text-sm text-gray-600 mb-6">
                                                Ask me anything about your business or try one of these:
                                            </p>

                                            {/* Suggested Queries */}
                                            <div className="grid grid-cols-2 gap-2 w-full">
                                                {suggestedQueries.map((suggestion, idx) => (
                                                    <motion.button
                                                        key={idx}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => sendMessage(suggestion.query)}
                                                        className="p-3 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-all text-left group"
                                                    >
                                                        <suggestion.icon className="h-5 w-5 text-violet-600 mb-2 group-hover:scale-110 transition-transform" />
                                                        <p className="text-xs font-medium text-gray-700">
                                                            {suggestion.label}
                                                        </p>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message, idx) => (
                                                <motion.div
                                                    key={message.id || idx}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    onMouseEnter={() => setHoveredMessageId(message.id || idx.toString())}
                                                    onMouseLeave={() => setHoveredMessageId(null)}
                                                    className={cn(
                                                        'flex gap-3 group',
                                                        message.role === 'USER' ? 'justify-end' : 'justify-start'
                                                    )}
                                                >
                                                    {message.role === 'ASSISTANT' && (
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 shadow-md">
                                                            <Bot className="h-5 w-5 text-white" />
                                                        </div>
                                                    )}
                                                    <div className="flex items-end gap-2">
                                                        <div
                                                            className={cn(
                                                                'rounded-2xl px-4 py-3 max-w-sm shadow-sm',
                                                                message.role === 'USER'
                                                                    ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white'
                                                                    : 'bg-gray-100 text-gray-900'
                                                            )}
                                                        >
                                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                                                            {/* Function calls badge */}
                                                            {message.functionCalls && message.functionCalls.length > 0 && (
                                                                <div className="mt-2 pt-2 border-t border-gray-300/20">
                                                                    <p className={cn(
                                                                        'text-xs flex items-center gap-1',
                                                                        message.role === 'USER'
                                                                            ? 'text-white/80'
                                                                            : 'text-gray-600'
                                                                    )}>
                                                                        <Sparkles className="h-3 w-3" />
                                                                        Used {message.functionCalls.length} tool{message.functionCalls.length > 1 ? 's' : ''}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Message Actions */}
                                                        {hoveredMessageId === (message.id || idx.toString()) && (
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.8 }}
                                                                animate={{ opacity: 1, scale: 1 }}
                                                                className="flex gap-1"
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-7 w-7 p-0"
                                                                    onClick={() => copyToClipboard(message.content, message.id || idx.toString())}
                                                                    title="Copy message"
                                                                >
                                                                    {copiedId === (message.id || idx.toString()) ? (
                                                                        <span className="text-xs text-green-600">✓</span>
                                                                    ) : (
                                                                        <Copy className="h-4 w-4 text-gray-500" />
                                                                    )}
                                                                </Button>
                                                                {message.role === 'USER' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-7 w-7 p-0"
                                                                        onClick={() => deleteMessage(message.id || idx.toString())}
                                                                        title="Delete message"
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-gray-500" />
                                                                    </Button>
                                                                )}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                    {message.role === 'USER' && (
                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                                            <User className="h-5 w-5 text-white" />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                            {isLoading && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex gap-3"
                                                >
                                                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                                                        <Bot className="h-5 w-5 text-white" />
                                                    </div>
                                                    <div className="bg-gray-100 rounded-2xl px-4 py-3 flex items-center gap-1">
                                                        <div className="flex gap-1">
                                                            {[0, 1, 2].map((i) => (
                                                                <motion.div
                                                                    key={i}
                                                                    animate={{ y: [0, -8, 0] }}
                                                                    transition={{ delay: i * 0.1, duration: 0.6, repeat: Infinity }}
                                                                    className="w-2 h-2 rounded-full bg-violet-600"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 bg-white">
                                    <div className="flex gap-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Ask anything..."
                                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                                            disabled={isLoading}
                                        />
                                        <Button
                                            type="submit"
                                            size="lg"
                                            disabled={!input.trim() || isLoading}
                                            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                                        >
                                            {isLoading ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Send className="h-5 w-5" />
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
