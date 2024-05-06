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
import AbstractDialog, { AbstractDialogPanel, AbstractDialogTrigger } from "../../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";
import { FormCharFieldWidget } from "../../../elements/forms/widgets/FormCharFieldWidget";
import LazyFormImageUploadWidget from "../../../elements/forms/widgets/LazyFormImageUpload";
import { SpecificationInputWidget } from "../../../elements/forms/widgets/FormSpecificationWidget";
import { FormTextAreaWidget } from "../../../elements/forms/widgets/FormTextAreaWidget";
import { useGenericForm } from "../../../../utils";
import Fieldset from "../../../elements/forms/Fieldset";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ProductType } from "../../../../Types";
import { useAbstractDialogContext } from "../../../../Context";
import App from "../../App/App";

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

export default function CreateProductDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    return (
        <AbstractDialog
            Trigger={Trigger}
            Panel={CreateProductDialog.Panel}
        />
    );
}

CreateProductDialog.Panel = function Panel ({ onClose }: { onClose: () => void }) {
    const router = useRef(createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/"] }),
    }));

    return (
        <Dialog.Panel className="m-auto p-4 max-w-prose w-full max-h-full overflow-hidden bg-yellow-50 relative text-gray-900  border border-gray-900 shadow">
            <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                <XMarkIcon className="w-6 h-6" />
            </div>
            {<RouterProvider router={router.current} />}
        </Dialog.Panel>
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
                const data: ProductType = await response.json();
                return data;
            }

            const errors = await response.json();
            setErrors(errors);
            return Promise.reject(errors);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
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
            <App.Divider />
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
                            widget: FormTextAreaWidget({
                                maxLength: 512,
                            }),
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
            <App.Divider />
            <button className={`ml-auto ${App.BaseButtonClassNames} bg-yellow-300 hover:bg-yellow-400`}>Create</button>
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
            <App.Divider />
            <Link
                to={"/"}
                className={["bg-yellow-300 hover:bg-yellow-400", "justify-center", App.BaseButtonClassNames].join(" ")}
            >
                Create Another
            </Link>
            <div
                className={["bg-gray-300 hover:bg-gray-400", "justify-center", App.BaseButtonClassNames].join(" ")}
                onClick={() => setOpen(false)}
            >
                Close
            </div>
        </div>
    );
}
