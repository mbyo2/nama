import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/test-register")({
  component: TestRegisterPage,
  head: () => ({
    meta: [
      { title: "Test Registration" },
    ],
  }),
});

function TestRegisterPage() {
  return (
    <div className="min-h-screen bg-paper text-foreground p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test Registration Page</h1>
        <p className="text-muted-foreground mb-8">
          This is a simple test page to verify navigation is working.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 border border-border rounded-sm">
            <h2 className="text-lg font-semibold mb-2">✅ Navigation Working!</h2>
            <p className="text-sm text-muted-foreground">
              If you can see this page, the navigation is working correctly.
            </p>
          </div>
          
          <div className="p-4 border border-green-500 bg-green-50 rounded-sm">
            <h2 className="text-lg font-semibold mb-2">🔍 Next Steps:</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Navigation is working</li>
              <li>2. The issue is with the main registration page</li>
              <li>3. Likely authentication or API issue</li>
            </ul>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => window.location.href = '/app'}
              className="px-4 py-2 bg-brass text-white rounded-sm hover:bg-brass/90"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => alert('Test button working!')}
              className="px-4 py-2 border border-border rounded-sm hover:bg-card"
            >
              Test JavaScript
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
