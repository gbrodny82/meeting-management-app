import { Button } from "@/components/ui/button";
import { Shield, Mail } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Pending</h1>
          <p className="text-gray-600">
            Your account is waiting for administrator approval. Please contact the administrator to gain access to the meeting tracker application.
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-red-600 mr-2" />
            <div className="text-left">
              <p className="text-sm font-medium text-red-800">
                Administrator Contact Required
              </p>
              <p className="text-sm text-red-600 mt-1">
                Please reach out to the application administrator to request access approval.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button asChild className="w-full">
            <a href="/api/logout">
              Sign Out
            </a>
          </Button>
          
          <Button variant="outline" asChild className="w-full">
            <a href="/api/login">
              Try Signing In Again
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}