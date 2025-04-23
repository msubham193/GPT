"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Sparkles,
  LogIn,
  UserPlus,
  History,
  Copy,
  Trash2,
  Pencil,
  ChevronDown,
  AlignJustify,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AnimatedGradientText from "./ui/animated-gradient-text";
import { cn } from "@/lib/utils";
import ShineBorder from "./ui/shine-border";
import toast, { Toaster } from "react-hot-toast";

// Define interfaces for type safety
interface Message {
  type: "user" | "bot";
  content: string;
  context?: string[];
}

interface ChatResponse {
  answer: string;
  context: string[];
}

interface UserActivity {
  email: string;
  action: "login" | "query" | "register";
  timestamp: string;
}

interface ChatHistoryItem {
  id: string;
  query: string;
  response: string;
  timestamp: string;
}

// Sample queries for the initial screen
const sampleQueries = [
  "What is the history of CIME?",
  "Who are the key faculty members at CIME?",
  "What are the campus facilities like?",
  "How do I apply for scholarships at CIME?",
];

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [showContext, setShowContext] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to the bottom of the chat when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load login state and chat history from localStorage on mount
  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const savedUser = localStorage.getItem("currentUser");
    if (loggedIn && savedUser) {
      setIsLoggedIn(loggedIn);
      setCurrentUser(savedUser);
      const savedHistory = localStorage.getItem(`chatHistory_${savedUser}`);
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    }
  }, []);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      localStorage.setItem(
        `chatHistory_${currentUser}`,
        JSON.stringify(chatHistory)
      );
    }
  }, [chatHistory, currentUser, isLoggedIn]);

  // Handle form submission to send a chat message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { type: "user", content: input }]);
    const userQuery = input;
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userQuery }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from chat API");
      }

      const data: ChatResponse = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content: data.answer,
          context: data.context,
        },
      ]);

      if (isLoggedIn) {
        const newHistoryItem: ChatHistoryItem = {
          id: crypto.randomUUID(),
          query: userQuery,
          response: data.answer,
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        };
        setChatHistory((prev) => [newHistoryItem, ...prev]);
      }

      if (isLoggedIn) {
        setUserActivities((prev) => [
          ...prev,
          {
            email: currentUser || "admin@cime.ac.in",
            action: "query",
            timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          },
        ]);
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to get response. Please try again.");
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          content:
            "I apologize, but I'm having trouble processing your request right now. Please try again later.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle sample query clicks
  const handleSampleQuery = (query: string) => {
    setInput(query);
  };

  // Handle user login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (email === "admin@cime.ac.in" && password === "admin123") ||
      checkUserCredentials(email, password)
    ) {
      setIsLoggedIn(true);
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("currentUser", email);
      setCurrentUser(email);
      setShowLoginModal(false);
      const savedHistory = localStorage.getItem(`chatHistory_${email}`);
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
      setUserActivities((prev) => [
        ...prev,
        {
          email,
          action: "login",
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        },
      ]);
      setError(null);
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  // Handle user registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    if (users.some((user: { email: string }) => user.email === email)) {
      setError("Email already registered. Please login instead.");
      return;
    }

    const newUser = { name, email, password };
    localStorage.setItem(
      "registeredUsers",
      JSON.stringify([...users, newUser])
    );

    setUserActivities((prev) => [
      ...prev,
      {
        email,
        action: "register",
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      },
    ]);

    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", email);
    setCurrentUser(email);

    setShowRegisterModal(false);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
  };

  // Check user credentials for login
  const checkUserCredentials = (email: string, password: string): boolean => {
    const users = JSON.parse(localStorage.getItem("registeredUsers") || "[]");
    return users.some(
      (user: { email: string; password: string }) =>
        user.email === email && user.password === password
    );
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Handle user logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser("");
    setChatHistory([]);
    setShowProfileDropdown(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
  };

  // Toggle context visibility for bot messages
  const toggleContext = (index: number) => {
    setShowContext(showContext === index ? null : index);
  };

  // Switch to registration modal
  const switchToRegister = () => {
    setShowLoginModal(false);
    setShowRegisterModal(true);
    setError(null);
  };

  // Switch to login modal
  const switchToLogin = () => {
    setShowRegisterModal(false);
    setShowLoginModal(true);
    setError(null);
  };

  // Toggle history sidebar visibility
  const toggleHistorySidebar = () => {
    setShowHistorySidebar(!showHistorySidebar);
  };

  // Handle clicking on a chat history item
  const handleHistoryClick = (item: ChatHistoryItem) => {
    setMessages([
      { type: "user", content: item.query },
      { type: "bot", content: item.response },
    ]);
    setInput("");
  };

  // Initiate chat history deletion
  const handleDeleteHistory = (id: string) => {
    setShowDeleteConfirm(id);
  };

  // Confirm chat history deletion
  const confirmDeleteHistory = (id: string) => {
    setIsDeleting(id);
    setChatHistory((prev) => {
      const newHistory = prev.filter((item) => item.id !== id);
      return newHistory;
    });
    setShowDeleteConfirm(null);
    setIsDeleting(null);
    toast.success("Chat history deleted!", {
      position: "bottom-center",
      duration: 2000,
    });
  };

  // Cancel chat history deletion
  const cancelDeleteHistory = () => {
    setShowDeleteConfirm(null);
  };

  // Copy message to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success("Message copied to clipboard!", {
          position: "bottom-center",
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        toast.error("Failed to copy message.", {
          position: "bottom-center",
        });
      });
  };

  // Edit a message by setting it as the input
  const handleEditMessage = (content: string) => {
    setInput(content);
  };

  // Format text for rendering (e.g., Markdown-like formatting)
  const formatText = (text: string) => {
    let formattedText = text.replace(/^[\s]*[-*][\s]+(.+)$/gm, "<li>$1</li>");
    formattedText = formattedText.replace(/<\/li>\n<li>/g, "</li><li>");
    formattedText = formattedText.replace(
      /<li>(.+?)(<\/li>)+/gs,
      "<ul>$&</ul>"
    );
    formattedText = formattedText.replace(
      /^[\s]*(\d+)\.[\s]+(.+)$/gm,
      "<li>$2</li>"
    );
    formattedText = formattedText.replace(
      /<li>(.+?)(<\/li>)+/gs,
      "<ol>$&</ol>"
    );
    formattedText = formattedText.replace(/<ul><ul>/g, "<ul>");
    formattedText = formattedText.replace(/<\/ul><\/ul>/g, "</ul>");
    formattedText = formattedText.replace(/<ol><ol>/g, "<ol>");
    formattedText = formattedText.replace(/<\/ol><\/ol>/g, "</ol>");
    formattedText = formattedText.replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    );
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<em>$1</em>");
    formattedText = formattedText.replace(/^# (.*?)$/gm, "<h2>$1</h2>");
    formattedText = formattedText.replace(/^## (.*?)$/gm, "<h3>$1</h3>");
    formattedText = formattedText.replace(/^### (.*?)$/gm, "<h4>$1</h4>");
    formattedText = formattedText.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    formattedText = formattedText.replace(
      /```([^`]+)```/g,
      "<pre><code>$1</code></pre>"
    );
    formattedText = formattedText.replace(/`([^`]+)`/g, "<code>$1</code>");
    formattedText = formattedText.replace(/([^>])\n([^<])/g, "$1<br />$2");
    return formattedText;
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-poppins flex flex-col">
      <Toaster />
      {/* Header */}
      <div className="backdrop-blur-md bg-white border-gray-200 p-2 sm:p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-4">
            {isLoggedIn && (
              <button
                onClick={toggleHistorySidebar}
                className="flex items-center gap-1 sm:gap-2 bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 sm:px-2 sm:py-2 rounded-lg transition-all duration-300 text-xs sm:text-base"
              >
                <AlignJustify className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">History</span>
              </button>
            )}
            <div
              className="custom-gradient-shadow rounded-full p-1 sm:p-2"
              onClick={() => setShowLoginModal(true)}
            >
              <Image
                src={"https://www.cime.ac.in/assets/image/logos/Logo.png"}
                alt="CIME Logo"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
            </div>
            <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent flex items-center gap-1 sm:gap-2">
              CIME GPT
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center gap-1 sm:gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 sm:px-4 sm:py-2  transition-all duration-300 text-xs sm:text-base"
                >
                  {currentUser.slice(0, 1).toUpperCase()}
                </button>
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-20">
                    <div className="px-4 py-2 text-xs sm:text-sm text-gray-700 border-b border-gray-200">
                      {currentUser}
                    </div>
                    {currentUser === "admin@cime.ac.in" && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-xs sm:text-sm text-blue-500 hover:bg-gray-100"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <Link
                      href="/pro"
                      className="block w-full text-left px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Upgrade to Pro
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="flex items-center gap-1 sm:gap-2 bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-xs sm:text-base"
                >
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Register</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface and History Sidebar */}
      <div className="flex flex-1 flex-col min-h-[calc(100vh-4rem)]">
        {/* History Sidebar */}
        {isLoggedIn && (
          <div
            className={`fixed inset-y-0 left-0 z-20 bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
              showHistorySidebar ? "translate-x-0" : "-translate-x-full"
            } w-64 sm:w-80 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Chat History</h2>
              <button
                onClick={toggleHistorySidebar}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {chatHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No chat history yet.</p>
            ) : (
              <div className="space-y-3">
                {chatHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center justify-between"
                  >
                    <div
                      className="cursor-pointer flex-1 max-w-[80%]"
                      onClick={() => handleHistoryClick(item)}
                    >
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {item.query}
                      </p>
                      <p className="text-xs text-gray-500">{item.timestamp}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteHistory(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete chat"
                      disabled={isDeleting === item.id}
                    >
                      {isDeleting === item.id ? (
                        <svg
                          className="w-4 h-4 animate-spin text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8 8 8 0 01-8-8z"
                          />
                        </svg>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Chat Interface */}
        <div className="flex flex-col flex-1.5 max-w-4xl mx-auto p-2 sm:p-4 w-full">
          <div className="flex-1 overflow-y-auto mb-2 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-gray-100 min-h-[60vh]">
            {messages.length === 0 && (
              <div className="text-center mt-4 mb-3 sm:mt-20 sm:mb-4 animate-fadeIn w-full px-2">
                <div className="inline-block rounded-full p-2 sm:p-4 mb-2 sm:mb-3 custom-gradient-shadow">
                  <Image
                    src={"https://www.cime.ac.in/assets/image/logos/Logo.png"}
                    alt="CIME Logo"
                    width={52}
                    height={52}
                    className="w-8 h-8 sm:w-12 sm:h-12"
                  />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold mb-1 sm:mb-2 bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent px-2">
                  Welcome to College of IT & Management Education Bhubaneswar
                  GPT
                </h2>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex mt-10 items-start gap-2 sm:gap-4 relative ${
                  message.type === "user" ? "justify-end" : ""
                } animate-fadeIn w-full`}
              >
                {message.type === "bot" && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-100 to-blue-100 flex items-center justify-center shadow-lg shadow-blue-400/20 flex-shrink-0">
                    <Image
                      src={"https://www.cime.ac.in/assets/image/logos/Logo.png"}
                      alt="CIME Logo"
                      width={25}
                      height={25}
                      className="w-4 h-4 sm:w-5 sm:h-5"
                    />
                  </div>
                )}
                <div className="flex flex-col items-start">
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] p-2 sm:p-3 rounded-lg backdrop-blur-md shadow-lg ${
                      message.type === "user"
                        ? "bg-blue-500/80 shadow-blue-400/20 text-white"
                        : "bg-gray-100/80 shadow-gray-200/20 text-gray-900"
                    }`}
                  >
                    {message.type === "bot" ? (
                      <div
                        className="markdown-content text-xs sm:text-sm"
                        dangerouslySetInnerHTML={{
                          __html: formatText(message.content),
                        }}
                      />
                    ) : (
                      <div className="text-xs sm:text-sm">
                        {message.content}
                      </div>
                    )}
                    {message.type === "bot" && message.context && (
                      <div>
                        <button
                          onClick={() => toggleContext(index)}
                          className="text-xs text-gray-500 mt-1 sm:mt-2 hover:text-gray-700"
                        >
                          {showContext === index
                            ? "Hide context"
                            : "Show context"}
                        </button>
                        {showContext === index && (
                          <div className="mt-1 sm:mt-2 text-xs text-gray-600 border-t border-gray-200 pt-1 sm:pt-2">
                            <h4 className="font-medium mb-1">Sources:</h4>
                            <ul className="list-disc pl-4 text-xs">
                              {message.context.map((source, i) => (
                                <li key={i}>{source}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-1">
                    {message.type === "user" ? (
                      <>
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="text-slate-600 hover:text-gray-700 transition-colors"
                          title="Copy message"
                        >
                          <Copy className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => handleEditMessage(message.content)}
                          className="text-slate-600 hover:text-gray-700 transition-colors"
                          title="Edit message"
                        >
                          <Pencil className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => copyToClipboard(message.content)}
                        className="text-slate-600 hover:text-gray-700 transition-colors"
                        title="Copy message"
                      >
                        <Copy className="w-4 h-4 sm:w-4 sm:h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {message.type === "user" && (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-400/20 flex-shrink-0">
                    <User className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500 animate-fadeIn w-full">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-400/20">
                  <Bot className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex gap-1 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce shadow-lg shadow-blue-400/50"></span>
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s] shadow-lg shadow-blue-400/50"></span>
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s] shadow-lg shadow-blue-400/50"></span>
                </div>
              </div>
            )}
            {error && (
              <div className="text-red-500 text-center text-xs sm:text-sm w-full">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Sample Queries */}
          {messages.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-3 mb-4 w-full px-2">
              {sampleQueries.map((query, index) => (
                <ShineBorder
                  className="text-xs sm:text-sm relative flex h-[80%] w-full flex-col items-center justify-center overflow-hidden backdrop-blur-md border md:shadow-xl bg-white/80 text-gray-900 hover:bg-gray-50/80 transition-all duration-300 text-left hover:shadow-lg hover:shadow-blue-400/20 group rounded-lg"
                  color={["#3B82F6", "#60A5FA", "#93C5FD"]}
                  key={index}
                >
                  <button
                    onClick={() => handleSampleQuery(query)}
                    className="p-2 sm:p-4 relative w-full text-left"
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mb-1 sm:mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                    {query}
                  </button>
                </ShineBorder>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSubmit}
            className="sticky bottom-0 w-full px-2 pb-4 sm:pb-6 bg-white"
          >
            <div className="relative max-w-4xl mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="w-full text-xs sm:text-sm backdrop-blur-md bg-gray-50/80 rounded-lg pl-3 sm:pl-4 pr-10 sm:pr-12 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-400/50 border border-gray-200 focus:border-blue-400/50 transition-all duration-300 text-gray-900"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-black hover:bg-gray-800 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-gray-400/20"
              >
                <Send className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">
              Confirm Deletion
            </h3>
            <p className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6">
              Are you sure you want to delete this chat history?
            </p>
            <div className="flex justify-end gap-2 sm:gap-3">
              <button
                onClick={cancelDeleteHistory}
                className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300 text-xs sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDeleteHistory(showDeleteConfirm)}
                className="px-2 sm:px-4 py-1 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-300 text-xs sm:text-base"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-lg shadow-xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md">
            <h3 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">
              Login
            </h3>
            <form onSubmit={handleLogin}>
              <div className="mb-3 sm:mb-4">
                <label
                  htmlFor="email"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-xs sm:text-base"
                  required
                />
              </div>
              <div className="mb-4 sm:mb-6">
                <label
                  htmlFor="password"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-xs sm:text-base"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4">
                  {error}
                </div>
              )}
              <div className="flex justify-between items-center mb-4"></div>
              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300 text-xs sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 sm:px-4 py-1 sm:py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-all duration-300 text-xs sm:text-base"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-lg shadow-xl p-3 sm:p-6 w-full max-w-xs sm:max-w-md">
            <h3 className="text-base sm:text-xl font-bold mb-3 sm:mb-4">
              Create an Account
            </h3>
            <form onSubmit={handleRegister}>
              <div className="mb-3 sm:mb-4">
                <label
                  htmlFor="name"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-xs sm:text-base"
                  required
                />
              </div>
              <div className="mb-3 sm:mb-4">
                <label
                  htmlFor="register-email"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-xs sm:text-base"
                  required
                />
              </div>
              <div className="mb-3 sm:mb-4">
                <label
                  htmlFor="register-password"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-xs sm:text-base"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 6 characters
                </p>
              </div>
              <div className="mb-4 sm:mb-6">
                <label
                  htmlFor="confirm-password"
                  className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400/50 text-xs sm:text-base"
                  required
                />
              </div>
              {error && (
                <div className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4">
                  {error}
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="text-blue-500 hover:text-blue-700 text-xs sm:text-sm"
                >
                  Already have an account? Login
                </button>
              </div>
              <div className="flex justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300 text-xs sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-300 text-xs sm:text-base"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx global>{`
        .custom-gradient-shadow {
          box-shadow: 0 4px 8px rgba(55, 65, 81, 0.3),
            0 6px 12px rgba(209, 213, 219, 0.2);
        }

        @media (min-width: 475px) {
          .xs\\:inline {
            display: inline;
          }
        }

        .markdown-content ul,
        .markdown-content ol {
          padding-left: 1rem;
          margin: 0.5rem 0;
        }

        .markdown-content ul {
          list-style-type: disc;
        }

        .markdown-content ol {
          list-style-type: decimal;
        }

        .markdown-content h2 {
          font-size: 1.1rem;
          font-weight: bold;
          margin: 0.75rem 0 0.5rem 0;
        }

        .markdown-content h3 {
          font-size: 1rem;
          font-weight: bold;
          margin: 0.6rem 0 0.4rem 0;
        }

        .markdown-content h4 {
          font-size: 0.9rem;
          font-weight: bold;
          margin: 0.5rem 0 0.3rem 0;
        }

        .markdown-content code {
          background-color: rgba(209, 213, 219, 0.3);
          padding: 0.1rem 0.3rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.85em;
        }

        .markdown-content pre {
          background-color: rgba(209, 213, 219, 0.3);
          padding: 0.5rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }

        .markdown-content strong {
          font-weight: bold;
        }

        .markdown-content em {
          font-style: italic;
        }

        .markdown-content a {
          color: #3b82f6;
          text-decoration: underline;
        }

        @media (min-width: 640px) {
          .markdown-content h2 {
            font-size: 1.25rem;
          }

          .markdown-content h3 {
            font-size: 1.125rem;
          }

          .markdown-content h4 {
            font-size: 1rem;
          }

          .markdown-content ul,
          .markdown-content ol {
            padding-left: 1.5rem;
          }

          .markdown-content pre {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
