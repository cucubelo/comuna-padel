import React, { Suspense } from 'react';

// Skeleton genérico para componentes
export function GenericSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-bg-secondary rounded-lg h-full w-full"></div>
    </div>
  );
}

// Skeleton para tarjetas
export function CardSkeleton() {
  return (
    <div className="bg-bg-main rounded-xl border border-border p-6 animate-pulse">
      <div className="h-6 bg-bg-secondary rounded mb-4 w-3/4"></div>
      <div className="h-4 bg-bg-secondary rounded mb-2 w-full"></div>
      <div className="h-4 bg-bg-secondary rounded mb-4 w-2/3"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-bg-secondary rounded-full"></div>
        <div className="h-6 w-20 bg-bg-secondary rounded-full"></div>
      </div>
      <div className="h-10 w-32 bg-bg-secondary rounded-lg"></div>
    </div>
  );
}

// Skeleton para listas
export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-bg-main rounded-lg border border-border p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-bg-secondary rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-bg-secondary rounded mb-2 w-1/3"></div>
              <div className="h-3 bg-bg-secondary rounded w-2/3"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton para el header del dashboard
export function HeaderSkeleton() {
  return (
    <div className="bg-bg-main border-b border-border p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-bg-secondary rounded"></div>
          <div className="h-6 w-32 bg-bg-secondary rounded"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-10 w-24 bg-bg-secondary rounded-lg"></div>
          <div className="w-10 h-10 bg-bg-secondary rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton para el perfil de usuario
export function UserProfileSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-10 h-10 bg-bg-secondary rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-bg-secondary rounded mb-1 w-24"></div>
        <div className="h-3 bg-bg-secondary rounded w-16"></div>
      </div>
    </div>
  );
}

// Wrapper de Suspense con fallback personalizado
interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function SuspenseWrapper({ 
  children, 
  fallback = <GenericSkeleton />, 
  className = "" 
}: SuspenseWrapperProps) {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
}

// Suspense específico para componentes de dashboard
export function DashboardSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-secondary">
        <HeaderSkeleton />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </main>
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Suspense para componentes de grupo
export function GroupSuspense({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-secondary">
        <main className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <div className="h-10 w-24 bg-bg-main rounded-lg animate-pulse"></div>
          </div>
          <CardSkeleton />
          <div className="mt-6">
            <ListSkeleton items={5} />
          </div>
        </main>
      </div>
    }>
      {children}
    </Suspense>
  );
}

// Error Boundary para manejar errores de Suspense
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SuspenseErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Suspense Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-main mb-2">
              Algo salió mal
            </h2>
            <p className="text-text-secondary mb-4">
              Hubo un error al cargar este componente.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-accent-primary text-bg-main px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}