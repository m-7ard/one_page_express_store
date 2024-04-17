import {
    HistoryState,
    Link,
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
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/solid";
import AbstractDialog, { AbstractDialogTrigger } from "../../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";
import { FormCharFieldWidget } from "../../../elements/forms/widgets/FormCharFieldWidget";
import LazyFormImageUploadWidget from "../../../elements/forms/widgets/LazyFormImageUpload";
import { SpecificationInputWidget } from "../../../elements/forms/widgets/FormSpecificationWidget";
import { FormTextAreaWidget } from "../../../elements/forms/widgets/FormTextAreaWidget";
import { useGenericForm } from "../../../../utils";
import Fieldset from "../../../elements/forms/Fieldset";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ProductType } from "../../../../Types";
import { useAbstractDialogContext } from "../../../../Context";

const MAX_IMAGE_SIZE = 1024 ** 2 * 12;
const ACCEPTED_FILE_FORMATS = ["image/jpeg", "image/png"];
const MAX_IMAGES_LENGTH = 100;

const rootRoute = createRootRoute({
    component: () => <Outlet />,
});

const formRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: CreateProductForm,
});

const successRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/success",
    component: Success,
});

const routeTree = rootRoute.addChildren([formRoute, successRoute]);
const memoryHistory = createMemoryHistory({ initialEntries: ["/"] });
const router = createRouter({
    routeTree,
    history: memoryHistory,
});

export default function CreateProductDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    return (
        <AbstractDialog
            Trigger={Trigger}
            Panel={({ onClose }) => (
                <Dialog.Panel className="m-auto p-4 max-w-prose w-full max-h-full overflow-hidden bg-yellow-50 relative text-gray-900  border border-gray-900 shadow">
                    <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                        <XMarkIcon className="w-6 h-6" />
                    </div>
                    {<RouterProvider router={router} />}
                </Dialog.Panel>
            )}
        />
    );
}

function CreateProductForm() {
    const queryClient = useQueryClient();
    const { errors, setErrors } = useGenericForm();
    const [images, setImages] = useState<Array<File | string>>([]);
    const navigate = useNavigate({ from: "/" });

    const mutation = useMutation({
        mutationFn: async ({ form }: { form: HTMLFormElement }) => {
            const formData = new FormData(form);
            images.forEach((image, i) => {
                formData.append(`image-${i}`, image);
            });
            const response = await fetch("/api/products/create", {
                method: "POST",
                body: formData,
            });
            if (response.ok) {
                return await response.json();
            }

            const errors = await response.json();
            setErrors(errors);
            return Promise.reject(errors);
        },
        onSuccess: (data) => {
            queryClient.setQueryData<ProductType[]>(["products"], (previous) => {
                return previous == null ? [data] : [...previous, data];
            });
            navigate({ to: "/success", state: (previous) => ({ ...previous, product: data }) });
        },
    });

    return (
        <form
            className="flex flex-col gap-4 overflow-hidden"
            method="POST"
            action="/api/products/create"
            onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ form: event.currentTarget });
            }}
        >
            <div className="text-xl font-bold">Create Product</div>
            <hr className="h-0 w-full border-b-px border-gray-900"></hr>
            <div className="flex flex-col gap-4 h-full overflow-auto max-h-96">
                <Fieldset
                    errors={errors}
                    fields={[
                        {
                            name: "name",
                            label: "Name",
                            widget: FormCharFieldWidget({}),
                        },
                        {
                            name: "description",
                            label: "Description",
                            widget: FormTextAreaWidget({}),
                            optional: true,
                        },
                        {
                            name: "price",
                            label: "Price",
                            widget: FormCharFieldWidget({
                                type: "numeric",
                            }),
                        },
                        {
                            name: "kind",
                            label: "Kind",
                            widget: FormCharFieldWidget({}),
                            helperText: "Kind will be used for filtering. Is case sensitive.",
                        },
                        {
                            name: "images",
                            label: "Images",
                            widget: LazyFormImageUploadWidget({
                                maxFileSize: MAX_IMAGE_SIZE,
                                maxFileLength: MAX_IMAGES_LENGTH,
                                acceptedFormats: ACCEPTED_FILE_FORMATS,
                                onChange: (value) => {
                                    setImages(value);
                                },
                            }),
                            optional: true,
                            helperText: `Accepted formats: ${ACCEPTED_FILE_FORMATS.map((format) => format.split("/")[1]).join(", ")}; Max file size: ${MAX_IMAGE_SIZE / 1024 ** 2}MB; Max ${MAX_IMAGES_LENGTH} Images;`,
                        },
                        {
                            name: "specification",
                            label: "Specification",
                            widget: SpecificationInputWidget({}),
                        },
                    ]}
                />
            </div>
            <hr className="h-0 w-full border-b-px border-gray-900"></hr>
            <button className="ml-auto flex justify-center leading-none transition-colors flex items-center px-4 py-2 font-medium cursor-pointer py-2 bg-yellow-300 hover:bg-yellow-400">
                Create
            </button>
        </form>
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
            <div className="w-full text-center">Successfully Created "{product.name}"</div>
            <hr className="h-0 w-full border-b-px border-gray-900"></hr>
            <Link
                to={"/"}
                className="flex justify-center leading-none transition-colors items-center px-4 py-2 font-medium cursor-pointer bg-yellow-300 hover:bg-yellow-400"
            >
                Create Another
            </Link>
            <div
                className="flex justify-center leading-none transition-colors items-center px-4 py-2 font-medium cursor-pointer bg-gray-300 hover:bg-gray-400"
                onClick={() => setOpen(false)}
            >
                Close
            </div>
        </div>
    );
}
