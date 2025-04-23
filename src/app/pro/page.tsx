"use client";
import React, { useState } from "react";
import { Check } from "lucide-react";

const Pro = () => {
  const [billingOption, setBillingOption] = useState("monthly");

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">Upgrade Plan</h1>
        <p className="text-gray-600">
          Fixoria pricing plan are designed to meet your needs as you grow
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex bg-purple-50 rounded-full p-1">
          <button
            className={`px-6 py-2 rounded-full ${
              billingOption === "monthly" ? "bg-white" : "bg-transparent"
            }`}
            onClick={() => setBillingOption("monthly")}
          >
            Monthly
          </button>
          <button
            className={`px-6 py-2 rounded-full ${
              billingOption === "annual"
                ? "bg-black  text-white"
                : "bg-transparent"
            }`}
            onClick={() => setBillingOption("annual")}
          >
            Annual <span className="text-sm">(Save 50%)</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Creator Plan */}
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Creator</h2>
          <p className="text-gray-600 mb-6">
            Unlock powerful AI tools to create your content, wherever you work
            online.
          </p>

          <div className="mb-6">
            <span className="text-4xl font-bold">$19</span>
            <p className="text-sm text-gray-600">Per user & per month</p>
          </div>

          <button className="w-full py-3 bg-gray-100 rounded-md font-medium mb-4">
            Current Plan
          </button>

          <div className="text-center text-sm mb-8">
            Start <span className="text-black">Free 7-Days Trial</span>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-2">Features</h3>
            <p className="text-sm text-gray-600 mb-4">
              Everything in our free plan includes
            </p>

            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">01 User Access</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">Access to Fixora AI Chatbot</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">Access to SEO Mode</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">
                  AI Image Generation and editing Tool
                </span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">03 Brand Voice Access</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">Use AI with Browser Extension</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="border rounded-lg p-6 bg-purple-50 relative">
          <div className="absolute right-4 top-6 bg-purple-100 px-3 py-1 rounded-full flex items-center">
            <div className="w-4 h-4 text-purple-600 mr-1">★</div>
            <span className="text-xs text-purple-600">Popular</span>
          </div>

          <h2 className="text-2xl font-bold mb-2">Pro Plan</h2>
          <p className="text-gray-600 mb-6">
            Leverage advanced AI to create content for multiple brands on
            campaigns.
          </p>

          <div className="mb-6">
            <span className="text-4xl font-bold">$99</span>
            <p className="text-sm text-gray-600">
              Per user, per month & billed annually
            </p>
          </div>

          <button className="w-full py-3 bg-white border border-black text-black rounded-md font-medium mb-4">
            Switch to this Plan
          </button>

          <div className="text-center text-sm mb-8">
            Start <span className="text-purple-600">Free 7-Days Trial</span>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-2">Features</h3>
            <p className="text-sm text-gray-600 mb-4">
              Everything in Creator & Plus
            </p>

            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">05 User Access</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">10 Knowledge Assets</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">Access to Pro SEO Mode</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">
                  Collaboration with our Management
                </span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">10 Brand Voice Access</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">01 Page Custom change Access</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Business Plan */}
        <div className="border rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Business Plan</h2>
          <p className="text-gray-600 mb-6">
            Personalized AI with enhanced control, security, team training, and
            tech support.
          </p>

          <div className="mb-6">
            <div className="flex items-end">
              <span className="text-sm text-gray-600 mr-1">Start from</span>
              <span className="text-4xl font-bold">$199</span>
            </div>
            <p className="text-sm text-gray-600">
              Custom Pricing, Custom Billing
            </p>
          </div>

          <button className="w-full py-3 bg-black text-white rounded-md font-medium mb-4">
            Contact Sales
          </button>

          <div className="text-center text-sm mb-8">
            Start <span className="text-purple-600">Free 15-Days Trial</span>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-bold mb-2">Features</h3>
            <p className="text-sm text-gray-600 mb-4">
              Everything in Creator, Plus & Business
            </p>

            <ul className="space-y-3">
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">Unlimited Feature Usage</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">
                  Performance Analytics & Insights
                </span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">
                  Custom Style Guides with New View
                </span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">Advanced Admin Panel Access</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">Group Document Collaboration</span>
              </li>
              <li className="flex items-center">
                <div className="mr-2 bg-purple-100 p-1 rounded-full">
                  <Check size={16} className="text-purple-600" />
                </div>
                <span className="text-sm">Hight Security Platform</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pro;
