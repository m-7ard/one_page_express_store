import { useQueryClient } from "@tanstack/react-query";
import { createUseContext } from "../../../../utils";
import { UserRelatedData } from "../../linked/App/App";
import { Navigate } from "@tanstack/react-router";
import { OrderType, UserType } from "../../../../Types";
import { useAppContext } from "../../../../Context";

export const [AuthContext, useAuthContext] = createUseContext<{
    user: UserType;
    orders: OrderType[];
}>("useAuthContext has to be used within <AuthContext.Provider>");

export function AuthWrapper({ children }: React.PropsWithChildren) {
    const { user, orders } = useAppContext();

    if (user == null || orders == null) {
        return <Navigate to={"/login"} />;
    }

    return <AuthContext.Provider value={{ user, orders }}>{children}</AuthContext.Provider>;
}
