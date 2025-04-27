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
} from "lucide-react";
import Image from "next/image";
import toast, { Toaster } from "react-hot-toast";

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
  action: "login" | "query" | "upload" | "delete" | "rebuild";
  timestamp: string;
}

interface RegisteredUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

const AdminDashboard = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // New loading state
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "analytics">("upload");
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<
    "registered" | "visits" | "activities"
  >("registered");
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [userVisits, setUserVisits] = useState<UserVisit[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Format created_at timestamp
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

  // Check login state and fetch users
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

    // Fetch registered users from API
    const fetchUsers = async () => {
      setIsLoading(true); // Start loading
      try {
        const response = await fetch("/api/users", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch users");
        }

        setRegisteredUsers(data.data);
        toast.success("Users fetched successfully!", {
          position: "bottom-center",
          duration: 2000,
        });

        // Simulate user visits based on registered users
        const storedVisits = JSON.parse(
          localStorage.getItem("userVisits") || "[]"
        );
        const visits = data.data.map((user: RegisteredUser) => {
          const existingVisit = storedVisits.find(
            (visit: UserVisit) => visit.email === user.email
          );
          return (
            existingVisit || {
              email: user.email,
              visitCount: 1,
              lastVisit: new Date()
                .toISOString()
                .slice(0, 16)
                .replace("T", " "),
            }
          );
        });
        setUserVisits(visits);
        localStorage.setItem("userVisits", JSON.stringify(visits));

        // Simulate user activities (login) based on registered users
        const storedActivities = JSON.parse(
          localStorage.getItem("userActivities") || "[]"
        );
        const activities = data.data.map((user: RegisteredUser) => {
          const existingActivity = storedActivities.find(
            (activity: UserActivity) =>
              activity.email === user.email && activity.action === "login"
          );
          return (
            existingActivity || {
              email: user.email,
              action: "login" as const,
              timestamp: new Date()
                .toISOString()
                .slice(0, 16)
                .replace("T", " "),
            }
          );
        });
        const allActivities = [
          ...activities,
          ...storedActivities.filter(
            (activity: UserActivity) => activity.action !== "login"
          ),
        ];
        setUserActivities(allActivities);
        localStorage.setItem("userActivities", JSON.stringify(allActivities));
      } catch (err: any) {
        setError(err.message || "Failed to fetch users");
        toast.error(err.message || "Failed to fetch users", {
          position: "bottom-center",
          duration: 3000,
        });
        setRegisteredUsers([]);
      } finally {
        setIsLoading(false); // Stop loading
      }
    };

    fetchUsers();
  }, [router]);

  // Update current date and time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch PDF documents with retry logic
  const fetchDocuments = async (retries = 3, delay = 1000): Promise<void> => {
    setIsLoading(true); // Start loading
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch("/api/documents", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const documentNames: string[] = await response.json();
        console.log("Fetched document names:", documentNames);
        // Transform string array to PdfFile array
        const documents: PdfFile[] = documentNames.map((name) => ({
          id: name,
          name: name,
          uploadDate: new Date().toISOString().slice(0, 16).replace("T", " "), // Placeholder timestamp
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
        setIsLoading(false); // Stop loading
      }
    }
  };

  // Fetch documents when tab changes or login (for Upload tab)
  useEffect(() => {
    if (isLoggedIn && activeTab === "upload") {
      fetchDocuments();
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

  const handleMobileTabSelect = (tab: "upload" | "analytics") => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log("Starting upload for files:", files.length);
      setIsUploading(true);
      setUploadStatus("uploading");
      setError(null);

      // Set timer to switch to "Analyzing..." after 5 seconds
      uploadTimerRef.current = setTimeout(() => {
        setUploadStatus("analyzing");
      }, 5000);

      for (const file of Array.from(files)) {
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
            {
              id: optimisticId,
              name: file.name,
              uploadDate: timestamp,
            },
          ]);

          const uploadResponse = await fetch("/api/upload-pdf", {
            method: "POST",
            body: formData,
          });
          if (!uploadResponse.ok) {
            throw new Error(
              `Failed to upload PDF: ${uploadResponse.statusText}`
            );
          }
          const uploadData = await uploadResponse.json();
          const documentId = uploadData.id || file.name;

          const rebuildResponse = await fetch("/api/rebuild-index", {
            method: "POST",
          });
          if (!rebuildResponse.ok) {
            throw new Error(
              `Failed to rebuild index: ${rebuildResponse.statusText}`
            );
          }

          await fetchDocuments();

          setPdfFiles((prevFiles) =>
            prevFiles.filter((f) => f.id !== optimisticId)
          );

          const newActivities: UserActivity[] = [
            ...userActivities,
            { email: "admin@cime.ac.in", action: "upload" as const, timestamp },
            { email: "admin@cime.ac.in", action: "rebuild" as const, timestamp },
          ];
          setUserActivities(newActivities as UserActivity[]);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePdf = async (id: string) => {
    console.log("Deleting document from frontend:", id);
    setShowConfirmDeleteModal(null);
    setDeletingId(id);

    // Optimistically remove the PDF from the frontend
    const fileName = pdfFiles.find((file) => file.id === id)?.name || id;
    setPdfFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error(`Failed to delete PDF: ${response.statusText}`);
      }

      const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
      const newActivities = [
        ...userActivities,
        { email: "admin@cime.ac.in", action: "delete", timestamp },
      ];
      setUserActivities(
        newActivities.map((activity) => ({
          ...activity,
          action: activity.action as "upload" | "rebuild" | "login" | "query" | "delete",
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
      // Roll back the optimistic update
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

  const handleOpenPdf = async (id: string) => {
    const pdfUrl = `/api/documents/${encodeURIComponent(id)}`;
    try {
      const response = await fetch(pdfUrl, { method: "HEAD" });
      if (!response.ok) {
        throw new Error("PDF not found");
      }
      window.open(pdfUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setShowErrorModal(`Failed to open document "${id}". Please try again.`);
      toast.error(`Failed to open document "${id}"`, {
        position: "bottom-center",
        duration: 3000,
      });
    }
  };

  const totalVisitors = registeredUsers.length;
  const totalDocs = pdfFiles.length;
  const totalPdfs = pdfFiles.length;
  const userGrowth = totalVisitors > 0 ? (totalVisitors / 1) * 100 : 0;

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-poppins flex flex-col">
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
        }
      `}</style>
      {/* Header */}
      <div className="backdrop-blur-md bg-white border-b border-gray-200 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="animate-pulse rounded-full p-2">
              <Image
                src={"https://www.cime.ac.in/assets/image/logos/Logo.png"}
                alt="CIME Logo"
                width={45}
                height={45}
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              CIME GPT Admin
            </h1>
          </div>

          {/* Mobile Menu Button and Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              className="md:hidden bg-gray-100 hover:bg-gray-200 p-2 rounded-lg mr-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-700" />
              ) : (
                <Menu className="w-5 h-5 text-gray-700" />
              )}
            </button>

            <button
              onClick={handleHome}
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base shadow-md"
            >
              <Home className="w-4 h-4" />
              <span className="hidden xs:inline">Home</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-sm sm:text-base shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
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

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-gray-800 bg-opacity-50 md:hidden">
          <div className="bg-white h-auto w-full p-4 animate-slide-in-right">
            <div className="flex flex-col gap-2">
              <button
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  activeTab === "upload"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => handleMobileTabSelect("upload")}
              >
                <FileText className="w-5 h-5" />
                Upload Documents
              </button>
              <button
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  activeTab === "analytics"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-white text-gray-700"
                }`}
                onClick={() => handleMobileTabSelect("analytics")}
              >
                <BarChart2 className="w-5 h-5" />
                User Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Content */}
      <div className="max-w-7xl mx-auto p-3 sm:p-6 mt-2 sm:mt-8 flex-1">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent animate-fade-in">
          Admin Dashboard
        </h2>
        {/* Current Date and Time */}
        <div className="mb-4 sm:mb-6 text-sm sm:text-base text-gray-600 animate-slide-up">
          Current Date & Time: {currentDateTime.toLocaleString()}
        </div>
        {/* Dashboard Cards */}
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
              title: "Total PDFs",
              value: totalPdfs,
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
              <p className="text-lg sm:text-3xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs - Desktop Version */}
        <div className="hidden md:flex border-b border-gray-200 mb-6 w-full max-w-4xl mx-auto">
          <button
            className={`flex-1 px-4 py-2 font-medium text-sm sm:text-base text-center ${
              activeTab === "upload"
                ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors duration-200`}
            onClick={() => setActiveTab("upload")}
          >
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              Upload Documents
            </div>
          </button>
          <button
            className={`flex-1 px-4 py-2 font-medium text-sm sm:text-base text-center ${
              activeTab === "analytics"
                ? "text-blue-600 border-b-2 border-blue-600 font-semibold"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors duration-200`}
            onClick={() => setActiveTab("analytics")}
          >
            <div className="flex items-center justify-center gap-2">
              <BarChart2 className="w-4 h-4" />
              User Analytics
            </div>
          </button>
        </div>

        {/* Mobile Tabs Indicator */}
        <div className="md:hidden mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            {activeTab === "upload" ? (
              <>
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-blue-600">Upload Documents</span>
              </>
            ) : (
              <>
                <BarChart2 className="w-5 h-5 text-blue-600" />
                <span className="text-blue-600">User Analytics</span>
              </>
            )}
          </h3>
        </div>

        {/* Tab Content */}
        <div className="w-full max-w-4xl mx-auto">
          {activeTab === "upload" ? (
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 animate-fade-in w-full">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                Upload PDF Documents
              </h3>
              <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-base">
                Upload PDF files to enhance the CIME GPT's knowledge base. These
                documents will be processed and made available for user queries.
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
              {/* PDF Upload History (Document Section) */}
              {pdfFiles.length > 0 ? (
                <div>
                  <h4 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                    PDF Upload History
                  </h4>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 mobile-table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            data-label="Document ID"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Document ID
                          </th>
                          <th
                            data-label="Upload Date"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Upload Date
                          </th>
                          <th
                            data-label="Action"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pdfFiles.map((file) => (
                          <tr
                            key={file.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td
                              data-before="Document ID"
                              className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900"
                            >
                              <span className="sm:hidden font-medium">
                                Document ID:{" "}
                              </span>
                              <button
                                onClick={() => handleOpenPdf(file.id)}
                                className="text-blue-600 hover:underline focus:outline-none"
                                title={`Open ${file.name}`}
                              >
                                {file.name}
                              </button>
                            </td>
                            <td
                              data-before="Upload Date"
                              className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                            >
                              <span className="sm:hidden font-medium">
                                Upload Date:{" "}
                              </span>
                              {file.uploadDate || "N/A"}
                            </td>
                            <td
                              data-before="Action"
                              className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm"
                            >
                              <span className="sm:hidden font-medium">
                                Action:{" "}
                              </span>
                              <button
                                onClick={() => {
                                  console.log(
                                    "Trash icon clicked for ID:",
                                    file.id
                                  );
                                  setShowConfirmDeleteModal(file.id);
                                }}
                                disabled={deletingId === file.id}
                                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                              >
                                {deletingId === file.id ? (
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-5 h-5" />
                                )}
                              </button>
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
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6 animate-fade-in w-full">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-gray-800">
                User Analytics
              </h3>
              {error && (
                <div className="text-red-500 text-xs sm:text-sm mb-3 sm:mb-4 animate-slide-up">
                  {error}
                </div>
              )}
              {/* Analytics Tabs */}
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
              {/* Analytics Tab Content */}
              {activeAnalyticsTab === "registered" && (
                <div className="mb-4 sm:mb-6 w-full">
                  <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">
                    Registered Users
                  </h4>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 mobile-table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            data-label="ID"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            ID
                          </th>
                          <th
                            data-label="Name"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Name
                          </th>
                          <th
                            data-label="Email"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Email
                          </th>
                          <th
                            data-label="Created At"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Created At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {registeredUsers.length > 0 ? (
                          registeredUsers.map((user) => (
                            <tr
                              key={user.id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td
                                data-before="ID"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900"
                              >
                                <span className="sm:hidden font-medium">
                                  ID:{" "}
                                </span>
                                {user.id}
                              </td>
                              <td
                                data-before="Name"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900"
                              >
                                <span className="sm:hidden font-medium">
                                  Name:{" "}
                                </span>
                                {user.name}
                              </td>
                              <td
                                data-before="Email"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                              >
                                <span className="sm:hidden font-medium">
                                  Email:{" "}
                                </span>
                                {user.email}
                              </td>
                              <td
                                data-before="Created At"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                              >
                                <span className="sm:hidden font-medium">
                                  Created At:{" "}
                                </span>
                                {formatDate(user.created_at)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 text-center"
                            >
                              No registered users yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
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
                          <th
                            data-label="Email"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Email
                          </th>
                          <th
                            data-label="Visit Count"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Visit Count
                          </th>
                          <th
                            data-label="Last Visit"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Last Visit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userVisits.length > 0 ? (
                          userVisits.map((user, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td
                                data-before="Email"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900"
                              >
                                <span className="sm:hidden font-medium">
                                  Email:{" "}
                                </span>
                                {user.email}
                              </td>
                              <td
                                data-before="Visit Count"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                              >
                                <span className="sm:hidden font-medium">
                                  Visit Count:{" "}
                                </span>
                                {user.visitCount}
                              </td>
                              <td
                                data-before="Last Visit"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                              >
                                <span className="sm:hidden font-medium">
                                  Last Visit:{" "}
                                </span>
                                {user.lastVisit}
                              </td>
                            </tr>
                          ))
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
                </div>
              )}
              {activeAnalyticsTab === "activities" && (
                <div className="w-full">
                  <h4 className="text-base sm:text-lg font-semibold mb-2 text-gray-800">
                    User Activity Analysis
                  </h4>
                  <div className="overflow-x-auto w-full">
                    <table className="min-w-full divide-y divide-gray-200 mobile-table">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            data-label="Email"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Email
                          </th>
                          <th
                            data-label="Action"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Action
                          </th>
                          <th
                            data-label="Timestamp"
                            className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Timestamp
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userActivities.length > 0 ? (
                          userActivities.map((activity, index) => (
                            <tr
                              key={index}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td
                                data-before="Email"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900"
                              >
                                <span className="sm:hidden font-medium">
                                  Email:{" "}
                                </span>
                                {activity.email}
                              </td>
                              <td
                                data-before="Action"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                              >
                                <span className="sm:hidden font-medium">
                                  Action:{" "}
                                </span>
                                {activity.action.charAt(0).toUpperCase() +
                                  activity.action.slice(1)}
                              </td>
                              <td
                                data-before="Timestamp"
                                className="px-2 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500"
                              >
                                <span className="sm:hidden font-medium">
                                  Timestamp:{" "}
                                </span>
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
                              No user activities recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

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

        {/* Confirm Delete Modal */}
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
                  onClick={() => {
                    console.log(
                      "Delete confirmed for ID:",
                      showConfirmDeleteModal
                    );
                    handleDeletePdf(showConfirmDeleteModal);
                  }}
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
  );
};

export default AdminDashboard;
