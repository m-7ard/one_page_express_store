import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthContext } from "../_utils";

export default function Profile() {
    const queryClient = useQueryClient();
    const navigate = useNavigate({ from: "/profile" });
    const { user } = useAuthContext();

    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch("http://localhost:3001/api/users/logout", {
                method: "POST",
            });
            if (response.ok) {
                return response;
            }
            throw Error("Logout failed.");
        },
        onSuccess: () => {
            queryClient.setQueryData(["user_and_cart"], () => null);
            navigate({ to: "/login" });
        },
    });

    return (
        <div className="generic-panel__body">
            <div className="generic-panel__title">Profile</div>
            <hr className="app__x-divider"></hr>
            <div className="flex flex-row gap-2">
                <div className="relative w-12 h-12 bg-gray-200 border border-gray-900"></div>
                <div className="flex flex-col">
                    <div className="text-base text-gray-900 font-medium">{user.username}</div>
                    <div className="text-sm text-gray-900">884 Orders</div>
                </div>
            </div>
            <div>
                <div className={`text-sm text-gray-900 hover:underline cursor-pointer w-fit`}>Account Settings</div>
                <Link to={"/orders"} className={`text-sm text-gray-900 hover:underline cursor-pointer w-fit`}>
                    Orders
                </Link>
            </div>
            <hr className="app__x-divider"></hr>
            <button
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-yellow
                    justify-center
                `}
                onClick={() => {
                    mutation.mutate();
                }}
            >
                Logout
            </button>
        </div>
    );
}
