import { Button } from "@/components/ui/button";
import { Users, Calendar, CheckSquare, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Meeting Tracker</span>
            </div>
            <Button asChild>
              <a href="/api/login" className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign In
              </a>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="py-20 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Track Your Team
            <span className="text-blue-600"> Meetings</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Streamline your one-on-ones, track action items, and keep your team organized with our powerful meeting management platform.
          </p>
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3">
            <a href="/api/login">
              Get Started
            </a>
          </Button>
        </div>

        {/* Features */}
        <div className="py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to manage meetings
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Management</h3>
              <p className="text-gray-600">
                Keep track of your team members, their roles, and relationship dynamics in one organized place.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <Calendar className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Meeting Notes</h3>
              <p className="text-gray-600">
                Document meeting discussions with rich markdown formatting and keep all your notes organized.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <CheckSquare className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Action Items</h3>
              <p className="text-gray-600">
                Track action items with priorities and statuses to ensure nothing falls through the cracks.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="py-20 bg-white rounded-lg shadow-sm border">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Built for Modern Teams
            </h2>
            <p className="text-xl text-gray-600">
              Simple, powerful, and designed to fit your workflow
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">Easy Setup</div>
              <p className="text-gray-600">Get started in minutes, not hours</p>
            </div>
            <div>
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">Organized</div>
              <p className="text-gray-600">Keep all meeting data structured</p>
            </div>
            <div>
              <CheckSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900 mb-2">Actionable</div>
              <p className="text-gray-600">Turn discussions into results</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-12 text-center">
          <p className="text-gray-600">
            Ready to transform your team meetings?
          </p>
          <Button asChild size="lg" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
            <a href="/api/login">
              Sign In Now
            </a>
          </Button>
        </footer>
      </div>
    </div>
  );
}