import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

/**
 * Creates an isolated QueryClient instance configured for testing with retries and caching disabled.
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export interface RenderWithQueryOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

export interface RenderWithQueryResult extends RenderResult {
  queryClient: QueryClient;
}

/**
 * Custom render helper that wraps UI components with TanStack QueryClientProvider and BrowserRouter.
 */
export function renderWithQuery(
  ui: ReactElement,
  options?: RenderWithQueryOptions
): RenderWithQueryResult {
  const queryClient = options?.queryClient || createTestQueryClient();

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

export default renderWithQuery;
