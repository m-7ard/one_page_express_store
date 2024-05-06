import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/solid";
import AbstractDialog, { AbstractDialogTrigger } from "../../../elements/abstract/AbstractDialog";
import { ProductType } from "../../../../Types";

export default function InformationDisplayDialog({
    Trigger,
    description,
    images,
    specification,
}: { Trigger: AbstractDialogTrigger } & Pick<ProductType, "description" | "images" | "specification">) {
    const columns = specification.reduce<{
        leftCol: [string, string][];
        rightCol: [string, string][];
    }>(
        (acc, entry, i) => {
            if (i % 2 === 0) {
                acc.leftCol.push(entry);
            } else {
                acc.rightCol.push(entry);
            }
            return acc;
        },
        { leftCol: [], rightCol: [] },
    );

    return (
        <AbstractDialog
            Trigger={Trigger}
            Panel={({ onClose }) => (
                <Dialog.Panel className="top-0 right-0 bottom-0 p-4 max-w-sm w-full max-h-full overflow-hidden bg-yellow-50 absolute text-gray-900 border-l border-gray-900 shadow">
                    <div className="flex flex-col gap-4 h-full overflow-auto">
                        <div className="flex flex-row items-center justify-between">
                            <div className="text-lg font-medium">Product Details</div>
                            <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                                <XMarkIcon className="w-6 h-6" />
                            </div>
                        </div>
                        <hr className="h-0 w-full border-b-px border-gray-900"></hr>
                        <InformationDisplayDialog.ImageGallery images={images} />
                        <hr className="h-0 w-full border-b-px border-gray-900"></hr>
                        <div className="text-sm break-all">{description}</div>
                        <hr className="h-0 w-full border-b-px border-gray-900"></hr>
                        <div className="flex gap-4">
                            <InformationDisplayDialog.SpecificationColumn entries={columns.leftCol} />
                            <InformationDisplayDialog.SpecificationColumn entries={columns.rightCol} />
                        </div>
                    </div>
                </Dialog.Panel>
            )}
        />
    );
}

InformationDisplayDialog.SpecificationColumn = ({ entries }: { entries: [string, string][] }) => (
    <div className="flex flex-col shrink-0 basis-0 grow overflow-hidden">
        <div className="w-full">
            {entries.map(([fieldName, fieldValue]) => (
                <div className="flex flex-row items-center justify-between overflow-hidden flex-wrap">
                    <div className="text-sm font-medium break-all">{fieldName}</div>
                    <div className="text-sm">{fieldValue}</div>
                </div>
            ))}
        </div>
    </div>
);

InformationDisplayDialog.ImageGallery = function ImageGallery({ images }: Pick<ProductType, "images">) {
    const [counter, setCounter] = useState(0);

    return (
        <div className="w-full flex flex-col gap-2 select-none items-center">
            <div className="flex w-full border border-gray-900" style={{ aspectRatio: 1 / 0.711 }}>
                <div
                    className="flex h-full p-4 items-center transition hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                        setCounter((previous) => (previous - 1 === -1 ? images.length - 1 : counter - 1));
                    }}
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </div>
                <div className="relative overflow-hidden h-full border-x border-gray-900 relative flex grow">
                    <img
                        src={`/media/${images[counter]}`}
                        className="absolute w-full h-full"
                        style={{ objectFit: "cover" }}
                        alt="prop"
                    ></img>
                </div>
                <div
                    className="flex h-full p-4 items-center transition hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                        setCounter((previous) => (previous + 1 === images.length ? 0 : counter + 1));
                    }}
                >
                    <ChevronRightIcon className="w-6 h-6" />
                </div>
            </div>
            <div className="text-sm text-gray-900">
                {counter + 1} / {images.length}
            </div>
        </div>
    );
};
