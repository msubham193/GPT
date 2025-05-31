"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  LogOut,
  BarChart2,
  FileText,
  Trash2,
  Loader2,
  Menu,
  X,
  Home,
  BookOpen,
  Users,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Star,
} from "lucide-react";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";
import Link from "next/link";

interface PdfFile {
  id: string;
  name: string;
  size?: number;
  uploadDate?: string;
}

interface UserVisit {
  email: string;
  visitCount: number;
  lastVisit: string;
}

interface UserActivity {
  email: string;
  action: "login" | "query" | "upload" | "delete" | "rebuild" | "signup";
  timestamp: string;
}

interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface SampleQuote {
  id: string;
  question: string;
  created_at: string;
}

interface UserFeedback {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 5;

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "knowledge" | "charts" | "quotes"
  >("dashboard");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<
    "registered" | "visits" | "activities"
  >("registered");
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [userVisits, setUserVisits] = useState<UserVisit[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [sampleQuotes, setSampleQuotes] = useState<SampleQuote[]>([]);
  const [userFeedback, setUserFeedback] = useState<UserFeedback[]>([]);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<
    "uploading" | "analyzing" | null
  >(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<string | null>(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState<
    string | null
  >(null);
  const [showConfirmDeleteQuoteModal, setShowConfirmDeleteQuoteModal] =
    useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newQuote, setNewQuote] = useState("");
  const [registeredPage, setRegisteredPage] = useState(1);
  const [visitsPage, setVisitsPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const [recentActivitiesPage, setRecentActivitiesPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Fetch sample quotes from backend
  const fetchSampleQuotes = async () => {
    try {
      const response = await fetch("/api/sample-questions", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      // console.log(data);

      if (!response.ok)
        throw new Error(data.error || "Failed to fetch sample quotes");
      setSampleQuotes(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch sample quotes");
      toast.error(err.message || "Failed to fetch sample quotes", {
        position: "bottom-center",
        duration: 3000,
      });
      setSampleQuotes([]);
    }
  };

  // Fetch user feedback from backend for all registered users
  const fetchUserFeedback = async (users: RegisteredUser[]) => {
    try {
      const feedbackPromises = users.map(async (user) => {
        const response = await fetch(
          `/api/user-feedback/${encodeURIComponent(user.id)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log(response);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `Failed to fetch feedback for user ${user.id}`
          );
        }
        return data; // Expecting an array of feedback objects
      });

      const feedbackResults = await Promise.allSettled(feedbackPromises);
      const allFeedback: UserFeedback[] = [];

      feedbackResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          allFeedback.push(...(result.value || []));
        } else {
          console.error(
            `Failed to fetch feedback for user ${users[index].id}:`,
            result.reason
          );
          // Optionally, you can add a toast notification for individual failures
        }
      });

      setUserFeedback(allFeedback);
      if (allFeedback.length > 0) {
        toast.success("User feedback fetched successfully!", {
          position: "bottom-center",
          duration: 2000,
        });
      } else {
        toast("No user feedback found.", {
          position: "bottom-center",
          duration: 2000,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch user feedback");
      toast.error(err.message || "Failed to fetch user feedback", {
        position: "bottom-center",
        duration: 3000,
      });
      setUserFeedback([]);
    }
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const currentUser = localStorage.getItem("currentUser");

    if (!loggedIn || currentUser !== "admin@cime.ac.in") {
      toast.error("Unauthorized access", {
        position: "bottom-center",
        duration: 3000,
      });
      router.push("/");
      return;
    }
    setIsLoggedIn(true);

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/users", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to fetch users");

        setRegisteredUsers(data.data);
        toast.success("Users fetched successfully!", {
          position: "bottom-center",
          duration: 2000,
        });

        // Dynamically generate user visits
        const visits = data.data.map((user: RegisteredUser) => ({
          email: user.email,
          visitCount: Math.floor(Math.random() * 10) + 1,
          lastVisit: new Date().toISOString().slice(0, 16).replace("T", " "),
        }));
        setUserVisits(visits);
        localStorage.setItem("userVisits", JSON.stringify(visits));

        // Dynamically generate user activities (login and signup)
        const activities = data.data.flatMap((user: RegisteredUser) => [
          {
            email: user.email,
            action: "signup" as const,
            timestamp: user.created_at,
          },
          {
            email: user.email,
            action: "login" as const,
            timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
          },
        ]);
        setUserActivities(activities);
        localStorage.setItem("userActivities", JSON.stringify(activities));

        // Fetch sample quotes
        await fetchSampleQuotes();
        // Fetch user feedback for all registered users
        await fetchUserFeedback(data.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch users");
        toast.error(err.message || "Failed to fetch users", {
          position: "bottom-center",
          duration: 3000,
        });
        setRegisteredUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchDocuments = async (retries = 3, delay = 1000): Promise<void> => {
    setIsLoading(true);
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch("/api/documents", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const documentNames = await response.json();
        const documents = documentNames.map((name: { id: string }) => ({
          id: name.id,
          name: name.id,
        }));
        setPdfFiles(documents);
        setError(null);
        return;
      } catch (err) {
        console.error(`Attempt ${attempt} failed:`, err);
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        setError(
          "Failed to load document list after multiple attempts. Please try again later."
        );
        setPdfFiles([]);
        toast.error("Failed to load document list. Please try again later.", {
          position: "bottom-center",
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (isLoggedIn && activeTab === "knowledge") {
      fetchDocuments();
    } else if (isLoggedIn && activeTab === "quotes") {
      fetchSampleQuotes();
    }
  }, [isLoggedIn, activeTab]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("currentUser");
    toast.success("Signed out successfully!", {
      position: "bottom-center",
      duration: 2000,
    });
    router.push("/");
  };

  const handleHome = () => {
    router.push("/");
  };

  const handleMobileTabSelect = (
    tab: "dashboard" | "knowledge" | "charts" | "quotes"
  ) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      setUploadStatus("uploading");
      setError(null);

      uploadTimerRef.current = setTimeout(
        () => setUploadStatus("analyzing"),
        5000
      );

      for (const file of Array.from(files)) {
        // Validate file size (5MB = 5 * 1024 * 1024 bytes)
        if (file.size > 5 * 1024 * 1024) {
          setShowErrorModal(
            `File "${file.name}" exceeds 5MB limit. Please upload a smaller file.`
          );
          toast.error(`File "${file.name}" exceeds 5MB limit`, {
            position: "bottom-center",
            duration: 3000,
          });
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("document_name", file.name);

        try {
          const timestamp = new Date()
            .toISOString()
            .slice(0, 16)
            .replace("T", " ");
          const optimisticId = `temp-${file.name}-${Date.now()}`;
          setPdfFiles((prevFiles) => [
            ...prevFiles,
            { id: optimisticId, name: file.name, uploadDate: timestamp },
          ]);

          const uploadResponse = await fetch("/api/upload-pdf", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok)
            throw new Error(
              `Failed to upload PDF: ${uploadResponse.statusText}`
            );

          const uploadData = await uploadResponse.json();
          const documentId = uploadData.id || file.name;

          const rebuildResponse = await fetch("/api/rebuild-index", {
            method: "POST",
          });
          if (!rebuildResponse.ok)
            throw new Error(
              `Failed to rebuild index: ${rebuildResponse.statusText}`
            );

          await fetchDocuments();

          setPdfFiles((prevFiles) =>
            prevFiles.filter((f) => f.id !== optimisticId)
          );

          const newActivities: UserActivity[] = [
            ...userActivities,
            { email: "admin@cime.ac.in", action: "upload" as const, timestamp },
            {
              email: "admin@cime.ac.in",
              action: "rebuild" as const,
              timestamp,
            },
          ];
          setUserActivities(newActivities);
          localStorage.setItem("userActivities", JSON.stringify(newActivities));
          setShowSuccessModal(`PDF "${file.name}" uploaded successfully.`);
          toast.success(`PDF "${file.name}" uploaded successfully!`, {
            position: "bottom-center",
            duration: 2000,
          });
        } catch (err) {
          console.error("Error uploading PDF:", err);
          setShowErrorModal(
            `Failed to upload "${file.name}". Please try again.`
          );
          toast.error(`Failed to upload "${file.name}"`, {
            position: "bottom-center",
            duration: 3000,
          });
          setPdfFiles((prevFiles) =>
            prevFiles.filter((f) => f.id !== `temp-${file.name}-${Date.now()}`)
          );
        }
      }
      setIsUploading(false);
      setUploadStatus(null);
      if (uploadTimerRef.current) {
        clearTimeout(uploadTimerRef.current);
        uploadTimerRef.current = null;
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePdf = async (id: string) => {
    setShowConfirmDeleteModal(null);
    setDeletingId(id);

    const fileName = pdfFiles.find((file) => file.id === id)?.name || id;
    setPdfFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok)
        throw new Error(`Failed to delete PDF: ${response.statusText}`);

      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const newActivities = [
        ...userActivities,
        { email: "admin@cime.ac.in", action: "delete", timestamp },
      ];
      setUserActivities(
        newActivities.map((activity) => ({
          ...activity,
          action: activity.action as
            | "upload"
            | "rebuild"
            | "login"
            | "query"
            | "delete"
            | "signup",
        }))
      );
      localStorage.setItem("userActivities", JSON.stringify(newActivities));

      setShowSuccessModal(`Document "${fileName}" deleted successfully.`);
      toast.success(`Document "${fileName}" deleted successfully!`, {
        position: "bottom-center",
        duration: 2000,
      });
    } catch (err) {
      console.error("Error deleting PDF:", err);
      await fetchDocuments();
      setShowErrorModal(`Failed to delete "${fileName}". Please try again.`);
      toast.error(`Failed to delete "${fileName}"`, {
        position: "bottom-center",
        duration: 3000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAddQuote = async () => {
    if (!newQuote.trim()) {
      toast.error("Quote cannot be empty", {
        position: "bottom-center",
        duration: 2000,
      });
      return;
    }

    if (sampleQuotes.length >= 4) {
      toast.error("Maximum 4 quotes allowed", {
        position: "bottom-center",
        duration: 2000,
      });
      return;
    }

    try {
      const response = await fetch("/api/sample-quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: newQuote }),
      });
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to add sample quote");

      const newQ: SampleQuote = data;
      setSampleQuotes((prev) => [...prev, newQ]);
      setNewQuote("");
      toast.success("Quote added successfully!", {
        position: "bottom-center",
        duration: 2000,
      });
    } catch (err: any) {
      setError(err.message || "Failed to add sample quote");
      toast.error(err.message || "Failed to add sample quote", {
        position: "bottom-center",
        duration: 3000,
      });
    }
  };

  const handleDeleteQuote = (id: string) => {
    setShowConfirmDeleteQuoteModal(id);
  };

  const confirmDeleteQuote = async (id: string) => {
    const quoteText = sampleQuotes.find((q) => q.id === id)?.question;
    setShowConfirmDeleteQuoteModal(null);

    try {
      const response = await fetch(`/api/sample-quotes/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to delete sample quote");

      setSampleQuotes((prev) => prev.filter((q) => q.id !== id));
      toast.success(
        data.message || `Quote "${quoteText}" deleted successfully!`,
        {
          position: "bottom-center",
          duration: 2000,
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to delete sample quote");
      toast.error(err.message || "Failed to delete sample quote", {
        position: "bottom-center",
        duration: 3000,
      });
      await fetchSampleQuotes();
    }
  };

  const cancelDeleteQuote = () => {
    setShowConfirmDeleteQuoteModal(null);
  };

  // Calculate average rating for a user
  const getUserAverageRating = (userId: string): number => {
    const userRatings = userFeedback
      .filter((fb) => fb?.user_id === userId)
      .map((fb) => fb.rating);

    if (userRatings.length === 0) return 0;
    const average =
      userRatings.reduce((sum, rating) => sum + rating, 0) / userRatings.length;
    return Math.round(average);
  };

  // Pagination logic
  const getPaginatedData = <T,>(data: T[], page: number): T[] => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };

  const totalVisitors = registeredUsers.length;
  const totalDocs = pdfFiles.length;
  const totalQueries = userActivities.filter(
    (a) => a.action === "query"
  ).length;
  const userGrowth = totalVisitors * 1;

  // Pagination controls
  const PaginationControls = ({
    page,
    setPage,
    totalItems,
  }: {
    page: number;
    setPage: (page: number) => void;
    totalItems: number;
  }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    return (
      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-poppins flex">
      <Toaster />
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        .custom-spin {
          animation: spin 1s linear infinite;
        }
        .mobile-table {
          width: 100%;
        }
        @media (max-width: 640px) {
          .mobile-table {
            display: block;
          }
          .mobile-table thead,
          .mobile-table tbody,
          .mobile-table th,
          .mobile-table td,
          .mobile-table tr {
            display: block;
          }
          .mobile-table thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          .mobile-table tr {
            border: 1px solid #ccc;
            margin-bottom: 10px;
            border-radius: 8px;
            overflow: hidden;
          }
          .mobile-table td {
            border: none;
            position: relative;
            padding-left: 50%;
            text-align: left;
            padding-top: 10px;
            padding-bottom: 10px;
          }
          .mobile-table td:before {
            position: absolute;
            left: 10px;
            width: 45%;
            padding-right: 10px;
            font-weight: bold;
            text-align: left;
          }
          .mobile-table td:nth-of-type(1):before {
            content: "ID";
          }
          .mobile-table td:nth-of-type(2):before {
            content: "Name";
          }
          .mobile-table td:nth-of-type(3):before {
            content: "Email";
          }
          .mobile-table td:nth-of-type(4):before {
            content: "Created At";
          }
          .mobile-table td:nth-of-type(5):before {
            content: "Rating";
          }
          .mobile-table.activities td:nth-of-type(1):before {
            content: "Email";
          }
          .mobile-table.activities td:nth-of-type(2):before {
            content: "Action";
          }
          .mobile-table.activities td:nth-of-type(3):before {
            content: "Timestamp";
          }
          .mobile-table.documents td:nth-of-type(1):before {
            content: "Document ID";
          }
          .mobile-table.documents td:nth-of-type(2):before {
            content: "Actions";
          }
          .mobile-table.quotes td:nth-of-type(1):before {
            content: "Quote";
          }
          .mobile-table.quotes td:nth-of-type(2):before {
            content: "Created At";
          }
          .mobile-table.quotes td:nth-of-type(3):before {
            content: "Action";
          }
        }
      `}</style>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Image
              src="https://www.cime.ac.in/assets/image/logos/Logo.png"
              alt="CIME Logo"
              width={40}
              height={40}
              className="animate-pulse"
            />
            <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Campus AI Admin
            </h1>
          </div>
        </div>
        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {[
              { name: "Dashboard", icon: Home, tab: "dashboard" as const },
              {
                name: "Knowledge Base",
                icon: BookOpen,
                tab: "knowledge" as const,
              },
              { name: "User Details", icon: Users, tab: "charts" as const },
              {
                name: "Sample Quotes",
                icon: HelpCircle,
                tab: "quotes" as const,
              },
            ].map((item) => (
              <li key={item.tab}>
                <button
                  onClick={() => handleMobileTabSelect(item.tab)}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.tab
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64">
        {/* Header */}
        <div className="backdrop-blur-md bg-white border-b border-gray-200 p-4 sticky top-0 z-20 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
            <button
              className="md:hidden bg-gray-100 hover:bg-gray-200 p-2 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <div className="flex-1 text-sm sm:text-base text-gray-600 animate-slide-up">
              Current Date & Time: {currentDateTime.toLocaleString()}
            </div>
            <button
              onClick={handleHome}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base shadow-md"
            >
              <Home className="w-4 h-4" />
              <span className="hidden xs:inline">Home</span>
            </button>
          </div>
        </div>

        {/* Full-Screen Loader */}
        {isLoading && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-gray-700 animate-spin" />
              <p className="mt-4 text-lg text-gray-700">Loading data...</p>
            </div>
          </div>
        )}

        {/* Admin Content */}
        <div className="max-w-7xl mx-auto p-3 sm:p-6 mt-2 sm:mt-8 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent animate-fade-in">
            Admin Dashboard
          </h2>

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-6 mb-6 sm:mb-8">
                {[
                  {
                    title: "Total Visitors",
                    value: totalVisitors,
                    gradient: "from-blue-400 to-blue-600",
                  },
                  {
                    title: "Total Documents",
                    value: totalDocs,
                    gradient: "from-green-400 to-green-600",
                  },
                  {
                    title: "Total Queries",
                    value: totalQueries,
                    gradient: "from-purple-400 to-purple-600",
                  },
                  {
                    title: "User Growth",
                    value: `${userGrowth.toFixed(1)}%`,
                    gradient: "from-orange-400 to-orange-600",
                  },
                ].map((metric, index) => (
                  <div
                    key={metric.title}
                    className={`bg-gradient-to-br ${metric.gradient} text-white rounded-xl p-3 sm:p-6 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 animate-slide-up`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <h4 className="text-xs sm:text-base font-semibold mb-1 sm:mb-2 opacity-90">
                      {metric.title}
                    </h4>
                    <p className="text-lg sm:text-3xl font-bold">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 animate-fade-in">
                <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                  Recent Activities
                </h3>
                <div className="overflow-x-auto w-full">
                  <table className="min-w-full divide-y divide-gray-200 mobile-table activities">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getPaginatedData(userActivities, recentActivitiesPage)
                        .length > 0 ? (
                        getPaginatedData(
                          userActivities,
                          recentActivitiesPage
                        ).map((activity, index) => (
                          <tr
                            key={index}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              {activity.email}
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {activity.action.charAt(0).toUpperCase() +
                                activity.action.slice(1)}
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                              {activity.timestamp}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center"
                          >
                            No recent activities recorded yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <PaginationControls
                  page={recentActivitiesPage}
                  setPage={setRecentActivitiesPage}
                  totalItems={userActivities.length}
                />
              </div>
            </div>
          )}

          {/* Knowledge Base Tab */}
          {activeTab === "knowledge" && (
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 animate-fade-in w-full">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                Knowledge Base Documents
              </h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-base">
                Upload PDF files to enhance the CIME GPT's knowledge base. These
                documents will be processed and made available for user queries.
                <br />
                <span className="text-red-500  text-sm">
                  No graphics PDFs will be accepted.
                </span>
                <br />
                <span className="text-red-500 text-sm">
                  The PDF should be a maximum of 5 MB.
                </span>
              </p>
              {error && (
                <div className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4 animate-slide-up">
                  {error}
                </div>
              )}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center mb-4 sm:mb-6 bg-gray-50">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf"
                  className="hidden"
                  multiple
                />
                <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-4 animate-pulse" />
                <p className="mb-2 text-xs sm:text-sm text-gray-500">
                  Drag and drop your PDF files here, or
                </p>
                <button
                  onClick={triggerFileInput}
                  disabled={isUploading}
                  className={`bg-black hover:bg-gray-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-xs sm:text-base flex items-center justify-center gap-2 mx-auto shadow-md ${
                    isUploading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {uploadStatus === "uploading"
                        ? "Uploading..."
                        : "Analyzing..."}
                    </>
                  ) : (
                    "Browse Files"
                  )}
                </button>
              </div>
              {pdfFiles.length > 0 ? (
                <div>
                  <h4 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                    PDF Upload History
                  </h4>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 mobile-table documents">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Document ID
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pdfFiles.map((file) => (
                          <tr
                            key={file.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                              <Link
                                href={`http://13.234.110.97:8000/documents/${encodeURIComponent(
                                  file.id
                                )}/pdf`}
                                passHref
                                legacyBehavior
                              >
                                <a
                                  className="text-blue-600 hover:underline focus:outline-none"
                                  title={`Open ${file.name}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {file.name}
                                </a>
                              </Link>
                            </td>
                            <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    setShowConfirmDeleteModal(file.id)
                                  }
                                  disabled={deletingId === file.id}
                                  className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                  title="Delete PDF"
                                >
                                  {deletingId === file.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-5 h-5" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-500 animate-fade-in">
                  No PDFs uploaded yet.
                </p>
              )}
            </div>
          )}

          {/* User Charts Tab */}
          {activeTab === "charts" && (
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 animate-fade-in w-full">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                User Analytics
              </h3>
              {error && (
                <div className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4 animate-slide-up">
                  {error}
                </div>
              )}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  className={`flex-1 px-4 py-2 font-medium text-sm text-center ${
                    activeAnalyticsTab === "registered"
                      ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  } transition-colors duration-200`}
                  onClick={() => setActiveAnalyticsTab("registered")}
                >
                  Registered Users
                </button>
                <button
                  className={`flex-1 px-4 py-2 font-medium text-sm text-center ${
                    activeAnalyticsTab === "visits"
                      ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  } transition-colors duration-200`}
                  onClick={() => setActiveAnalyticsTab("visits")}
                >
                  User Visits
                </button>
                <button
                  className={`flex-1 px-4 py-2 font-medium text-sm text-center ${
                    activeAnalyticsTab === "activities"
                      ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                      : "text-gray-500 hover:text-gray-700"
                  } transition-colors duration-200`}
                  onClick={() => setActiveAnalyticsTab("activities")}
                >
                  User Activities
                </button>
              </div>
              {activeAnalyticsTab === "registered" && (
                <div className="mb-4 sm:mb-6 w-full">
                  <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">
                    Registered Users
                  </h4>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 mobile-table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ID
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created At
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rating
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedData(registeredUsers, registeredPage)
                          .length > 0 ? (
                          getPaginatedData(registeredUsers, registeredPage).map(
                            (user, index) => {
                              const averageRating = getUserAverageRating(
                                user.id
                              );
                              return (
                                <tr
                                  key={user.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                                    {(registeredPage - 1) * ITEMS_PER_PAGE +
                                      index +
                                      1}
                                  </td>
                                  <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                    {user.name}
                                  </td>
                                  <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                    {user.email}
                                  </td>
                                  <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                    {formatDate(user.created_at)}
                                  </td>
                                  <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                    {averageRating > 0 ? (
                                      <div className="flex gap-1">
                                        {Array.from({ length: 5 }).map(
                                          (_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-4 h-4 ${
                                                i < averageRating
                                                  ? "text-yellow-400 fill-current"
                                                  : "text-gray-300"
                                              }`}
                                            />
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      ""
                                    )}
                                  </td>
                                </tr>
                              );
                            }
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center"
                            >
                              No registered users yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    page={registeredPage}
                    setPage={setRegisteredPage}
                    totalItems={registeredUsers.length}
                  />
                </div>
              )}
              {activeAnalyticsTab === "visits" && (
                <div className="mb-4 sm:mb-6 w-full">
                  <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">
                    User Visit Analytics
                  </h4>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 mobile-table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Visit Count
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Visit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedData(userVisits, visitsPage).length > 0 ? (
                          getPaginatedData(userVisits, visitsPage).map(
                            (user, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                  {user.email}
                                </td>
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                  {user.visitCount}
                                </td>
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                  {user.lastVisit}
                                </td>
                              </tr>
                            )
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center"
                            >
                              No user visits recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    page={visitsPage}
                    setPage={setVisitsPage}
                    totalItems={userVisits.length}
                  />
                </div>
              )}
              {activeAnalyticsTab === "activities" && (
                <div className="w-full">
                  <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">
                    User Activity Analysis
                  </h4>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 mobile-table activities">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                          <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getPaginatedData(userActivities, activitiesPage)
                          .length > 0 ? (
                          getPaginatedData(userActivities, activitiesPage).map(
                            (activity, index) => (
                              <tr
                                key={index}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                                  {activity.email}
                                </td>
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                  {activity.action.charAt(0).toUpperCase() +
                                    activity.action.slice(1)}
                                </td>
                                <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                                  {activity.timestamp}
                                </td>
                              </tr>
                            )
                          )
                        ) : (
                          <tr>
                            <td
                              colSpan={3}
                              className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center"
                            >
                              No user activities recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    page={activitiesPage}
                    setPage={setActivitiesPage}
                    totalItems={userActivities.length}
                  />
                </div>
              )}
            </div>
          )}

          {/* Sample Quotes Tab */}
          {activeTab === "quotes" && (
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 animate-fade-in w-full">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                Sample Quotes
              </h3>
              <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newQuote}
                    onChange={(e) => setNewQuote(e.target.value)}
                    placeholder="Enter a new sample quote"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    disabled={sampleQuotes.length >= 4}
                  />
                  <button
                    onClick={handleAddQuote}
                    disabled={sampleQuotes.length >= 4}
                    className={`bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm sm:text-base shadow-md ${
                      sampleQuotes.length >= 4
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    Add Quote
                  </button>
                </div>
                {sampleQuotes.length >= 4 && (
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Maximum 4 quotes reached. Delete a quote to add a new one.
                  </p>
                )}
              </div>
              <div className="overflow-x-auto w-full">
                <table className="min-w-full divide-y divide-gray-200 mobile-table quotes">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quote
                      </th>
                      <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sampleQuotes.length > 0 ? (
                      sampleQuotes.map((quote) => (
                        <tr
                          key={quote.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {quote.question}
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {formatDate(quote.created_at)}
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                            <button
                              onClick={() => handleDeleteQuote(quote.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center"
                        >
                          No sample quotes added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-xs sm:max-w-md animate-slide-up">
                <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  Success
                </h3>
                <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-6">
                  {showSuccessModal}
                </p>
                <button
                  onClick={() => setShowSuccessModal(null)}
                  className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-300 w-full shadow-md text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Error Modal */}
          {showErrorModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-xs sm:max-w-md animate-slide-up">
                <h3 className="text-base sm:text-xl font-semibold text-red-600 mb-3 sm:mb-4">
                  Error
                </h3>
                <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-6">
                  {showErrorModal}
                </p>
                <button
                  onClick={() => setShowErrorModal(null)}
                  className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg transition-all duration-300 w-full shadow-md text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Confirm Delete PDF Modal */}
          {showConfirmDeleteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-xs sm:max-w-md animate-slide-up">
                <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  Confirm Deletion
                </h3>
                <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Are you sure you want to delete document "
                  {pdfFiles.find((file) => file.id === showConfirmDeleteModal)
                    ?.name || showConfirmDeleteModal}
                  "?
                </p>
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmDeleteModal(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300 text-sm mb-2 sm:mb-0"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeletePdf(showConfirmDeleteModal)}
                    className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-all duration-300 text-sm shadow-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Delete Quote Modal */}
          {showConfirmDeleteQuoteModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 w-full max-w-xs sm:max-w-md animate-slide-up">
                <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
                  Confirm Deletion
                </h3>
                <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-6">
                  Are you sure you want to delete the quote "
                  {sampleQuotes.find(
                    (q) => q.id === showConfirmDeleteQuoteModal
                  )?.question || showConfirmDeleteQuoteModal}
                  "?
                </p>
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <button
                    onClick={cancelDeleteQuote}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-300 text-sm mb-2 sm:mb-0"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      confirmDeleteQuote(showConfirmDeleteQuoteModal)
                    }
                    className="px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-all duration-300 text-sm shadow-md"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
