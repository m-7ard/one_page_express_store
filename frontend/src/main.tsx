import ReactDOM from "react-dom/client";
import App, { Providers } from "./components/blocks/App/App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <Providers>
        <App />
    </Providers>
);
