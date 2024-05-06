import ReactDOM from "react-dom/client";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./components/blocks/App/App";
import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import Frontpage, { QueryStringProvider } from "./components/blocks/Frontpage/Frontpage";

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

const routeTree = rootRoute.addChildren([frontpageRoute]);

const router = createRouter({
    routeTree,
})

ReactDOM.createRoot(document.getElementById("root")!).render(
    <RouterProvider router={router} />
);
