import Link from "next/link";
import { Calendar, BarChart3, FileText, Linkedin, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-fm-navy to-fm-blue">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Female Mavericks
          </h1>
          <h2 className="text-2xl text-fm-yellow font-semibold mb-2">
            Marketing Dashboard
          </h2>
          <p className="text-white/80 text-lg">
            Content planning, analytics, and team collaboration
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Dashboard */}
          <Link href="/dashboard">
            <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow cursor-pointer group">
              <div className="flex items-center justify-center w-12 h-12 bg-fm-blue rounded-lg mb-4 group-hover:bg-fm-orange transition-colors">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Content Dashboard
              </h3>
              <p className="text-sm text-gray-600">
                Weekly overview of content flow: blogs → LinkedIn → social media
              </p>
            </div>
          </Link>

          {/* Social Calendar */}
          <Link href="/social-calendar">
            <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow cursor-pointer group">
              <div className="flex items-center justify-center w-12 h-12 bg-fm-blue rounded-lg mb-4 group-hover:bg-fm-orange transition-colors">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Social Calendar
              </h3>
              <p className="text-sm text-gray-600">
                Plan and manage Instagram, Facebook, and LinkedIn content
              </p>
            </div>
          </Link>

          {/* Blog Posts */}
          <Link href="/blog-posts">
            <div className="bg-white rounded-lg shadow-xl p-6 hover:shadow-2xl transition-shadow cursor-pointer group">
              <div className="flex items-center justify-center w-12 h-12 bg-fm-blue rounded-lg mb-4 group-hover:bg-fm-orange transition-colors">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Blog Posts
              </h3>
              <p className="text-sm text-gray-600">
                Plan and track Female Mavericks blog content (Wednesdays)
              </p>
            </div>
          </Link>

          {/* Beth's LinkedIn - Coming Soon */}
          <div className="bg-white/50 rounded-lg shadow-xl p-6 cursor-not-allowed">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-300 rounded-lg mb-4">
              <Linkedin className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              Beth's LinkedIn
            </h3>
            <p className="text-sm text-gray-400">
              Coming soon: LinkedIn content for Beth
            </p>
          </div>

          {/* Analytics - Coming Soon */}
          <div className="bg-white/50 rounded-lg shadow-xl p-6 cursor-not-allowed">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-300 rounded-lg mb-4">
              <BarChart3 className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              Analytics
            </h3>
            <p className="text-sm text-gray-400">
              Coming soon: GA4, Instagram, Facebook, and GHL metrics
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/60 text-sm">
            Phases 1-4 Complete • Phases 5-7 In Progress
          </p>
        </div>
      </div>
    </div>
  );
}
