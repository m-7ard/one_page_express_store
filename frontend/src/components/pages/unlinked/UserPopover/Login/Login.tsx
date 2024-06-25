import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGenericForm } from "../../../../../utils";
import { Link, useNavigate } from "@tanstack/react-router";
import UserPopover from "../UserPopover";
import Fieldset from "../../../../elements/forms/Fieldset";
import { FormCharFieldWidget } from "../../../../elements/forms/widgets/FormCharFieldWidget";


export default function Login() {
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
            queryClient.setQueryData(["user_and_cart"], () => data);
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