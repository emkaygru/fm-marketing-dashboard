import Link from "next/link";
import { Calendar, BarChart3, FileText, User } from "lucide-react";

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                Plan and manage Instagram, Facebook, and LinkedIn content with approval workflows
              </p>
            </div>
          </Link>

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

          {/* Blog Posts - Coming Soon */}
          <div className="bg-white/50 rounded-lg shadow-xl p-6 cursor-not-allowed">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-300 rounded-lg mb-4">
              <FileText className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              Blog Posts
            </h3>
            <p className="text-sm text-gray-400">
              Coming soon: Blog planning and scheduling
            </p>
          </div>

          {/* Beth's LinkedIn - Coming Soon */}
          <div className="bg-white/50 rounded-lg shadow-xl p-6 cursor-not-allowed">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-300 rounded-lg mb-4">
              <User className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-500 mb-2">
              Beth's LinkedIn
            </h3>
            <p className="text-sm text-gray-400">
              Coming soon: LinkedIn content for Beth
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/60 text-sm">
            Phase 2: Social Calendar Complete • Phases 3-7 In Progress
          </p>
        </div>
      </div>
    </div>
  );
}
