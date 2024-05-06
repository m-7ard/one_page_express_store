import ReactDOM from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./components/blocks/App/App";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import Frontpage, { QueryStringProvider } from "./components/blocks/Frontpage/Frontpage";
import Dashboard from "./components/blocks/Dashboard/Dashboard";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

const rootRoute = createRootRoute({
    component: () => (
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    ),
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
        <Dashboard />
    ),
});

const routeTree = rootRoute.addChildren([frontpageRoute, dashboardRoute]);

const router = createRouter({
    routeTree,
})

ReactDOM.createRoot(document.getElementById("root")!).render(
    <RouterProvider router={router} />
);
