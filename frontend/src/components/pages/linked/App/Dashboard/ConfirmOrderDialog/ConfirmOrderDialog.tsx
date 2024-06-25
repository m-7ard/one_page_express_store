import {
    Navigate,
    Outlet,
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
} from "@tanstack/react-router";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useOrderContext } from "../_utils";
import AbstractDialog, { AbstractDialogTrigger } from "../../../../../elements/abstract/AbstractDialog";
import { useRef } from "react";
import { Dialog } from "@headlessui/react";
import { useGenericForm } from "../../../../../../utils";
import { useMutation } from "@tanstack/react-query";
import Fieldset from "../../../../../elements/forms/Fieldset";
import { FormCharFieldWidget } from "../../../../../elements/forms/widgets/FormCharFieldWidget";
import { FormTextAreaWidget } from "../../../../../elements/forms/widgets/FormTextAreaWidget";
import { useAbstractDialogContext } from "../../../../../../Context";

const rootRoute = createRootRoute({
    component: () => <Outlet />,
});

const formRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: ConfirmOrderForm,
});

const successRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/success",
    component: Success,
});

const routeTree = rootRoute.addChildren([formRoute, successRoute]);

export default function ConfirmOrderDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    return <AbstractDialog Trigger={Trigger} Panel={ConfirmOrderDialog.Panel} />;
}

ConfirmOrderDialog.Panel = function Panel({ onClose }: { onClose: () => void }) {
    const router = useRef(
        createRouter({
            routeTree,
            history: createMemoryHistory({ initialEntries: ["/"] }),
        }),
    );

    return (
        <Dialog.Panel className="m-auto p-4 max-w-prose w-full max-h-full overflow-hidden bg-yellow-50 relative text-gray-900  border border-gray-900 shadow">
            <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                <XMarkIcon className="w-6 h-6" />
            </div>
            {<RouterProvider router={router.current} />}
        </Dialog.Panel>
    );
};

function ConfirmOrderForm() {
    const { order } = useOrderContext();
    const { errors, setErrors } = useGenericForm();

    const mutation = useMutation({
        mutationFn: async ({ form }: { form: HTMLFormElement }) => {
            
            return Promise.reject(errors);
        },
        onSuccess: (data) => {},
    });

    return (
        <form
            className="flex flex-col gap-4 overflow-hidden"
            method="POST"
            action="/api/orders/confirm_shipping"
            onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ form: event.currentTarget });
            }}
        >
            <div className="text-xl font-bold">Confirm "{order.archive.product.name}" Shipping</div>
            <hr className="app__x-divider"></hr>
            <div className="flex flex-col gap-4 h-full overflow-auto max-h-96">
                <Fieldset
                    errors={errors}
                    fields={[
                        {
                            name: "tracking_number",
                            widget: FormCharFieldWidget({}),
                        },
                        {
                            name: "courier_name",
                            widget: FormCharFieldWidget({}),
                        },
                        {
                            name: "additional_information",
                            widget: FormTextAreaWidget({ maxLength: 1028 }),
                        },
                    ]}
                />
            </div>
            <hr className="app__x-divider"></hr>
            <button
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-yellow
                    justify-center   
                    ml-auto 
                `}
            >
                Confirm Shipping
            </button>
        </form>
    );
}

function Success() {
    const { order } = useOrderContext();
    const { setOpen } = useAbstractDialogContext();

    if (order == null) {
        return <Navigate to={"/"} />;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="w-full text-center">Successfully Created "{product.name}"</div>
            <hr className="app__x-divider"></hr>
            <div
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-white
                    justify-center    
                `}
                onClick={() => setOpen(false)}
            >
                Close
            </div>
        </div>
    );
}
