import React, { Fragment, PropsWithChildren } from "react";
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
import { UserType } from "../../../Types";
import { useAppContext } from "../../../Context";
import { createUseContext, useGenericForm } from "../../../utils";
import App from "../linked/App/App";

const [AuthContext, useAuthContext] = createUseContext<{
    user: UserType;
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

export default function UserPopover({ Trigger }: { Trigger: AbstractPopoverTrigger; open?: boolean }) {
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
                    {
                        name: 'offset',
                        options: {
                          offset: [0, 4],
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
    const { user } = useAppContext();
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: [user == null ? "/login" : "/profile"] }),
    });

    return (
        <Popover.Panel className="generic-panel" ref={setPopperElement} style={styles.popper} {...attributes.popper}>
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
            queryClient.setQueriesData({ queryKey: ["user_and_cart"] }, () => data);
            navigate({ to: "/profile" });
        },
    });

    return (
        <form
            className="generic-panel__body"
            onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ form: event.currentTarget });
            }}
        >
            <div className="generic-panel__title">Login</div>
            <hr className="app__x-divider"></hr>
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
                <button
                    className={`
                        mixin-button-like
                        mixin-button-base
                        theme-button-generic-yellow
                        justify-center
                    `}
                >
                    Login
                </button>
            </div>
            <hr className="app__x-divider"></hr>
            <Link
                to={"/register"}
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-green
                    justify-center
                `}
            >
                Go to Register
            </Link>
        </form>
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
        <form
            className="generic-panel__body"
            onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ form: event.currentTarget });
            }}
        >
            <div className="generic-panel__title">Register</div>
            <hr className="app__x-divider"></hr>
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
                <button
                    className={`
                        mixin-button-like
                        mixin-button-base
                        theme-button-generic-green
                        justify-center
                    `}
                >
                    Register
                </button>
            </div>
            <hr className="app__x-divider"></hr>
            <Link
                to={"/login"}
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-yellow
                    justify-center
                `}
            >
                Go to Login
            </Link>
        </form>
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
                    queryKey: ["user_and_cart"],
                },
                () => null,
            );
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
                <div className={`text-sm text-gray-900 hover:underline cursor-pointer w-fit`}>Orders</div>
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

UserPopover.FormError = ({ errors }: { errors?: FormErrors }) => {
    return (
        errors?.formErrors != null &&
        errors?.formErrors.length !== 0 && (
            <div className="border border-red-400 w-full py-2 px-4 flex flex-col gap-2">
                <div className="text-sm font-medium text-gray-900 leading-none">Form</div>
                <div className="flex flex-col gap-1">
                    {errors.formErrors.map((message, i) => (
                        <div className="text-sm text-gray-900 leading-none flex items-center gap-2" key={i}>
                            <div>•</div>
                            <div>{message}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    );
};
