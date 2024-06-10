import ReactDOM from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import Frontpage from "./components/pages/linked/App/Frontpage/Frontpage";
import Dashboard from "./components/pages/linked/App/Dashboard/Dashboard";
import App from "./components/pages/linked/App/App";
import { useRef } from "react";
import { QueryStringContext } from "./Context";

export function QueryStringProvider({ children }: React.PropsWithChildren) {
    const filterParams = useRef<Record<string, string>>({});
    const sortParams = useRef<{ sort?: string }>({});
    const page_index = useRef(1);
    const buildQueryString = () =>
        new URLSearchParams({
            ...sortParams.current,
            ...filterParams.current,
            page_index: `${page_index.current}`,
        }).toString();

    return (
        <QueryStringContext.Provider value={{ filterParams, sortParams, page_index, buildQueryString }}>
            {children}
        </QueryStringContext.Provider>
    );
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

const rootRoute = createRootRoute({
    component: () => <App />,
});

const frontpageRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => (
        <QueryStringProvider>
            <Frontpage />
        </QueryStringProvider>
    ),
});

const dashboardRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dashboard",
    component: () => (
        <QueryStringProvider>
            <Dashboard />
        </QueryStringProvider>
    ),
});

const routeTree = rootRoute.addChildren([frontpageRoute, dashboardRoute]);

const router = createRouter({
    routeTree,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
    </QueryClientProvider>,
);
