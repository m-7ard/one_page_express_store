import {
    HistoryState,
    Navigate,
    Outlet,
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
    useNavigate,
    useRouterState,
} from "@tanstack/react-router";
import { XMarkIcon } from "@heroicons/react/24/solid";
import AbstractDialog from "../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";
import { useGenericForm } from "../../../utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { ProductType } from "../../../Types";
import { useAbstractDialogContext, useProductContext } from "../../../Context";
import App from "../linked/App/App";
import GenericForm from "../../elements/forms/GenericForm";

const rootRoute = createRootRoute({
    component: () => <Outlet />,
});

const formRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: DeleteProductForm,
});

const successRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/success",
    component: Success,
});

const routeTree = rootRoute.addChildren([formRoute, successRoute]);

export default function DeleteProductDialog({
    Trigger,
}: {
    Trigger: React.FunctionComponent<{
        onClick: () => void;
    }>;
}) {
    return <AbstractDialog Trigger={Trigger} Panel={DeleteProductDialog.Panel} />;
}

DeleteProductDialog.Panel = function Panel({ onClose }: { onClose: () => void }) {
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

function DeleteProductForm() {
    const queryClient = useQueryClient();
    const product = useProductContext();
    const navigate = useNavigate({ from: "/" });
    const { errors, setErrors } = useGenericForm();

    const mutation = useMutation({
        mutationFn: async ({ form }: { form: HTMLFormElement }) => {
            const response = await fetch(form.action, {
                method: "POST",
            });
            if (response.ok) {
                return await response.json();
            }

            const errors = await response.json();
            setErrors(errors);
            return Promise.reject(errors);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            navigate({ to: "/success", state: (previous) => ({ ...previous, product }) });
        },
        onError: () => {
            console.log("error");
        },
    });

    return (
        <GenericForm
            className="flex flex-col gap-4 overflow-hidden"
            action={`/api/products/delete/${product.id}`}
            onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ form: event.currentTarget });
            }}
            errors={errors}
            setErrors={setErrors}
        >
            <div className="text-xl font-bold">Delete Product</div>
            <App.Divider />
            <div className="flex flex-col gap-4 h-full overflow-auto max-h-96">
                <div className="text-sm">Are you sure you want to delete "{product.name}"?</div>
            </div>
            <App.Divider />
            <button className={`ml-auto ${App.BaseButtonClassNames} bg-yellow-300 hover:bg-yellow-400`} type="submit">
                Confirm
            </button>
        </GenericForm>
    );
}

function Success() {
    const {
        location: { state },
    } = useRouterState();
    const { product }: { product?: ProductType } & HistoryState = state;
    const { setOpen } = useAbstractDialogContext();
    if (product == null) {
        return <Navigate to={"/"} />;
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="w-full text-center">Successfully Deleted "{product.name}"</div>
            <div
                className={`justify-center ${App.BaseButtonClassNames} bg-gray-300 hover:bg-gray-400`}
                onClick={() => setOpen(false)}
            >
                Close
            </div>
        </div>
    );
}
