export function Chat() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Assistant</h2>
        <p className="text-muted-foreground">
          Get insights and recommendations from your analytics data
        </p>
      </div>
      
      <div className="rounded-lg border bg-card p-6 min-h-96">
        <div className="flex flex-col h-full">
          <div className="flex-1 space-y-4">
            <div className="text-center text-muted-foreground">
              Start a conversation with your AI assistant
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Ask about your analytics data..."
                className="flex-1 rounded-md border border-input bg-background px-3 py-2"
              />
              <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}