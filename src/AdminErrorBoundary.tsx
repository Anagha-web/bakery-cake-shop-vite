import { Component, type ReactNode } from 'react'

type State = { error: Error | null }

/** Last-resort screen if the admin fails to load (e.g. missing Supabase settings). */
export class AdminErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div role="alert" className="max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="font-serif text-2xl font-bold">The admin couldn't start</h1>
          <p className="mt-2 text-sm text-cocoa-light">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-full bg-cocoa px-5 py-2.5 text-sm font-medium text-cream hover:bg-cocoa-light"
          >
            Reload
          </button>
        </div>
      </div>
    )
  }
}
