import ReactDOM from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import Frontpage, { QueryStringProvider } from "./components/pages/linked/App/Frontpage/Frontpage";
import Dashboard from "./components/pages/linked/App/Dashboard/Dashboard";
import App from "./components/pages/linked/App/App";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

const rootRoute = createRootRoute({
    component: () => (
        <App />
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
    <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
    </QueryClientProvider>
);
