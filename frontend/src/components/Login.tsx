import { SignIn } from '@clerk/clerk-react';

export function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            SmartJournal
          </h1>
          <p className="text-gray-600">Sign in to continue</p>
        </div>
        <SignIn />
      </div>
    </div>
  );
}
