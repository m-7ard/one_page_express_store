import React, { Fragment, PropsWithChildren } from "react";
import {
    ArchiveBoxIcon,
    ArrowRightCircleIcon,
    ChevronDoubleRightIcon,
    ChevronRightIcon,
    Cog6ToothIcon,
    UserIcon,
} from "@heroicons/react/24/solid";
import { Popover } from "@headlessui/react";
import AbstractPopover, { AbstractPopoverPanel, AbstractPopoverTrigger } from "../../elements/abstract/AbstractPopover";
import Fieldset from "../../elements/forms/Fieldset";
import { FormCharFieldWidget } from "../../elements/forms/widgets/FormCharFieldWidget";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Link,
    Navigate,
    Outlet,
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    useNavigate,
} from "@tanstack/react-router";
import { FormErrors } from "./components/forms/GenericForm";
import { User } from "../../../Types";
import { useAppContext } from "../../../Context";
import { createUseContext, useGenericForm } from "../../../utils";
import App from "../App/App";

const [AuthContext, useAuthContext] = createUseContext<{
    user: User;
}>("useAuthContext has to be used within <AuthContext.Provider>");

function AuthWrapper({ children }: React.PropsWithChildren) {
    const { user } = useAppContext();
    if (user == null) {
        return <Navigate to={"/login"} />;
    }
    return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

const rootRoute = createRootRoute({
    component: () => <Outlet />,
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: Login,
});

const registerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/register",
    component: Register,
});

const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile",
    component: () => (
        <AuthWrapper>
            <Profile />
        </AuthWrapper>
    ),
});

const routeTree = rootRoute.addChildren([loginRoute, registerRoute, profileRoute]);

export default function UserPopover({ Trigger }: { Trigger: AbstractPopoverTrigger, open?: boolean }) {
    return (
        <AbstractPopover
            Trigger={Trigger}
            Panel={UserPopover.Panel}
            options={{
                placement: "bottom-end",
                strategy: "fixed",
                modifiers: [
                    {
                        name: "preventOverflow",
                        options: {
                            altAxis: true,
                        },
                    },
                ],
            }}
        />
    );
}

UserPopover.Panel = function Panel({
    setPopperElement,
    popper: { styles, attributes },
}: React.ComponentProps<AbstractPopoverPanel>) {
    const queryClient = useQueryClient();
    const user = queryClient.getQueryData<User>(["user"]);
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [user == null ? "/login" : "/profile"] }),
    });

    return (
        <Popover.Panel
            className="bg-gray-50 text-gray-900 p-4 mt-4 border border-gray-900 w-full max-w-72 shadow"
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
        >
            {<RouterProvider router={router} />}
        </Popover.Panel>
    );
};

function Login() {
    const queryClient = useQueryClient();
    const { errors, setErrors } = useGenericForm();
    const navigate = useNavigate({ from: "/login" });

    const mutation = useMutation({
        mutationFn: async ({ form }: { form: HTMLFormElement }) => {
            const response = await fetch("/api/users/login", {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
            });
            if (response.ok) {
                return await response.json();
            }

            const errors = await response.json();
            setErrors(errors);
            return Promise.reject(errors);
        },
        onSuccess: (data) => {
            queryClient.setQueriesData({ queryKey: ["user"] }, () => data);
            navigate({ to: "/profile" });
        },
    });

    return (
        <UserPopover.Body
            tag="form"
            onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ form: event.currentTarget });
            }}
        >
            <UserPopover.Title text="Login" />
            <App.Divider />
            <UserPopover.FormError errors={errors} />
            <div className="flex flex-col gap-2">
                <Fieldset
                    fields={[
                        {
                            name: "username",
                            label: "Username",
                            widget: FormCharFieldWidget({
                                autoComplete: "true",
                            }),
                        },
                        {
                            name: "password",
                            label: "Password",
                            widget: FormCharFieldWidget({
                                type: "password",
                            }),
                        },
                    ]}
                    errors={errors}
                />
                <button className={`${App.BaseButtonClassNames} justify-center bg-yellow-300 hover:bg-yellow-400`}>
                    Login
                </button>
            </div>
            <App.Divider />
            <Link
                to={"/register"}
                className={`${App.BaseButtonClassNames} justify-center bg-green-300 hover:bg-green-400`}
            >
                Go to Register
            </Link>
        </UserPopover.Body>
    );
}

function Register() {
    const queryClient = useQueryClient();
    const { errors, setErrors } = useGenericForm();
    const navigate = useNavigate({ from: "/register" });

    const mutation = useMutation({
        mutationFn: async ({ form }: { form: HTMLFormElement }) => {
            const response = await fetch("/api/users/register", {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
            });
            if (response.ok) {
                return await response.json();
            }

            const errors = await response.json();
            setErrors(errors);
            return Promise.reject(errors);
        },
        onSuccess: (data) => {
            queryClient.setQueriesData({ queryKey: ["user"] }, () => data);
            navigate({ to: "/profile" });
        },
    });

    return (
        <UserPopover.Body
            tag="form"
            onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ form: event.currentTarget });
            }}
        >
            <UserPopover.Title text="Register" />
            <App.Divider />
            <UserPopover.FormError errors={errors} />
            <div className="flex flex-col gap-2">
                <Fieldset
                    fields={[
                        {
                            name: "username",
                            label: "Username",
                            widget: FormCharFieldWidget({
                                autoComplete: "true",
                            }),
                        },
                        {
                            name: "password",
                            label: "Password",
                            widget: FormCharFieldWidget({
                                type: "password",
                            }),
                        },
                    ]}
                    errors={errors}
                />
                <button className={`${App.BaseButtonClassNames} justify-center bg-green-300 hover:bg-green-400`}>
                    Register
                </button>
            </div>
            <App.Divider />
            <Link
                to={"/login"}
                className={`${App.BaseButtonClassNames} justify-center bg-yellow-300 hover:bg-yellow-400`}
            >
                Go to Login
            </Link>
        </UserPopover.Body>
    );
}

function Profile() {
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
            queryClient.setQueriesData(
                {
                    queryKey: ["user"],
                },
                () => null,
            );
            navigate({ to: "/login" });
        },
    });

    return (
        <UserPopover.Body tag="div">
            <UserPopover.Title text="Profile" />
            <App.Divider />
            <div className="flex flex-row gap-2">
                <div className="relative w-12 h-12 bg-gray-200 border border-gray-900"></div>
                <div className="flex flex-col">
                    <div className="text-base text-gray-900 font-medium">{user.username}</div>
                    <div className="text-sm text-gray-900">884 Orders</div>
                </div>
            </div>
            <div>
                <div className={`text-sm text-gray-900 hover:underline cursor-pointer w-fit`}>Account Settings</div>
                <div className={`text-sm text-gray-900 hover:underline cursor-pointer w-fit`}>Orders</div>
            </div>
            <App.Divider />
            <button
                className={`${App.BaseButtonClassNames} justify-center bg-yellow-300 hover:bg-yellow-400`}
                onClick={() => {
                    mutation.mutate();
                }}
            >
                Logout
            </button>
        </UserPopover.Body>
    );
}

UserPopover.Body = <T extends keyof HTMLElementTagNameMap>({
    tag,
    children,
    ...props
}: PropsWithChildren<React.HTMLProps<HTMLElementTagNameMap[T]> & { tag: T }>) => {
    const Element = React.createElement(tag, {
        children,
        ...props,
        class: "flex flex-col gap-4",
    });
    return Element;
};

UserPopover.Title = function Title({ text }: { text: string }) {
    return <div className="text-lg font-bold">{text}</div>;
};

UserPopover.FormError = ({ errors }: { errors?: FormErrors }) => {
    return (
        errors?.formErrors != null &&
        errors?.formErrors.length !== 0 && (
            <div className="bg-red-400 w-full p-2 flex flex-col gap-2">
                <div className="text-sm font-semibold text-white leading-none">Form</div>
                <div className="flex flex-col gap-1">
                    {errors.formErrors.map((message, i) => (
                        <div className="text-sm text-white leading-none flex items-center gap-2" key={i}>
                            <div>•</div>
                            <div className="underline">{message}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    );
};
