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
import { XMarkIcon } from "@heroicons/react/24/solid";
import AbstractDialog, { AbstractDialogTrigger } from "../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";
import { FormCharFieldWidget } from "../../elements/forms/widgets/FormCharFieldWidget";
import LazyFormImageUploadWidget from "../../elements/forms/widgets/LazyFormImageUpload";
import { SpecificationInputWidget } from "../../elements/forms/widgets/FormSpecificationWidget";
import { FormTextAreaWidget } from "../../elements/forms/widgets/FormTextAreaWidget";
import { useGenericForm } from "../../../utils";
import Fieldset from "../../elements/forms/Fieldset";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { ProductType } from "../../../Types";
import { useAbstractDialogContext } from "../../../Context";
import App from "../linked/App/App";
import { PRODUCT } from "../../../constants";

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
    return <AbstractDialog Trigger={Trigger} Panel={CreateProductDialog.Panel} />;
}

CreateProductDialog.Panel = function Panel({ onClose }: { onClose: () => void }) {
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
            <hr className="app__x-divider"></hr>
            <div className="flex flex-col gap-4 h-full overflow-auto max-h-96">
                <Fieldset
                    errors={errors}
                    fields={[
                        {
                            name: "name",
                            widget: FormCharFieldWidget({}),
                        },
                        {
                            name: "description",
                            widget: FormTextAreaWidget({
                                maxLength: 512,
                            }),
                            optional: true,
                        },
                        {
                            name: "price",
                            widget: FormCharFieldWidget({
                                type: "numeric",
                            }),
                        },
                        {
                            name: "available",
                            widget: FormCharFieldWidget({
                                type: "numeric",
                            }),
                        },
                        {
                            name: "kind",
                            widget: FormCharFieldWidget({}),
                            helperText: "Kind will be used for filtering. Is case sensitive.",
                        },
                        {
                            name: "images",
                            widget: LazyFormImageUploadWidget({
                                maxFileSize: PRODUCT.MAX_IMAGE_SIZE,
                                maxFileLength: PRODUCT.MAX_IMAGES_LENGTH,
                                acceptedFormats: PRODUCT.ACCEPTED_FILE_FORMATS,
                                onChange: useCallback((value: Array<string | File>) => {
                                    setImages(value);
                                }, []),
                            }),
                            optional: true,
                            helperText: `Accepted formats: ${PRODUCT.ACCEPTED_FILE_FORMATS.map((format) => format.split("/")[1]).join(", ")}; Max file size: ${PRODUCT.MAX_IMAGE_SIZE / 1024 ** 2}MB; Max ${PRODUCT.MAX_IMAGES_LENGTH} Images;`,
                        },
                        {
                            name: "specification",
                            widget: SpecificationInputWidget({}),
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
            <hr className="app__x-divider"></hr>
            <Link
                to={"/"}
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-yellow
                    justify-center    
                `}
            >
                Create Another
            </Link>
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
