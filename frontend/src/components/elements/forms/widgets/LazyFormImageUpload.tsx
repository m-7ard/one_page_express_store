import { PlusIcon } from "@heroicons/react/16/solid";
import { XMarkIcon } from "@heroicons/react/20/solid";
import React, { InputHTMLAttributes, useEffect, useId, useState } from "react";
import { z } from "zod";
import { asWidget, toBase64, useGetIncrementalID } from "../../../../utils";

interface LazyFormImageUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    name: string;
    onChange?: (value: Array<string | File>) => void;
    initial?: Array<string | File>;
    maxFileSize: number;
    acceptedFormats: string[];
    maxFileLength: number;
}

const GRID_ELEMENT_CLASS =
    "aspect-square flex items-center justify-center bg-gray-100 border border-gray-900 relative overflow-hidden select-none";

function LazyFormImageUpload({
    name,
    initial,
    onChange,
    maxFileSize,
    acceptedFormats,
    maxFileLength,
}: LazyFormImageUploadProps): React.ReactNode {
    const getIncrementalID = useGetIncrementalID();
    const [stagedImages, setStagedImages] = useState<File[]>([]);
    const [acceptedImages, setAcceptedImages] = useState<Array<{
        source: string | File;
        display: string;
        id: number;
    }>>(initial == null ? [] : initial.map((source) => {
        if (typeof source === 'string') {
            return {
                source,
                display: `/media/${source}`,
                id: getIncrementalID()
            }
        }
        else {
            return {
                source,
                display: URL.createObjectURL(source),
                id: getIncrementalID()
            }
        }
    }));
    const [errors, setErrors] = useState<string[]>([]);

    useEffect(() => {
        if (onChange == null) {
            return;
        }

        onChange(acceptedImages.map(({ source }) => source));
    }, [acceptedImages, onChange]);

    async function processFile(file: File): Promise<void> {
        setStagedImages((previous) => [...previous, file]);

        setAcceptedImages((previous) => {
            const validator = z
                .any()
                .refine((file) => acceptedFormats.includes(file.type), {
                    message: `${file.name}: Only ${acceptedFormats.map((format) => format.split("/")[1]).join(", ")} files are accepted.`,
                })
                .refine((file) => file.size <= maxFileSize, {
                    message: `${file.name}: Max file size is ${maxFileSize / 1024 ** 2}MB.`,
                })
                .refine(() => previous.length < maxFileLength, {
                    message: `${file.name}: Cannot upload more than ${maxFileLength} files.`,
                });
                
            const validation = validator.safeParse(file);
            if (validation.success) {
                return [
                    {
                        source: file,
                        display: URL.createObjectURL(file),
                        id: getIncrementalID(),
                    },
                    ...previous,
                ];
            } else {
                const error = validation.error.issues.map(({ message }) => message);
                setErrors((previous) => [...previous, ...error]);
                return previous;
            }
        });

        setStagedImages((previous) => previous.filter((image) => image !== file));
    }

    async function addImagesToUpload(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
        event.preventDefault();
        setErrors([]);

        const { files } = event.target;
        if (files == null) {
            return;
        }

        const promises = [];
        for (let i = 0; i < files.length; i += 1) {
            const file = files[i];
            promises.push(processFile(file));
        }
        await Promise.all(promises);
        event.target.value = "";
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className={`${GRID_ELEMENT_CLASS}`}>
                    <div className="w-8 h-8">
                        <PlusIcon />
                    </div>
                    <input
                        type="file"
                        multiple
                        onChange={addImagesToUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer file:cursor-pointer h-full w-full"
                        name={name}
                        form={useId()}
                    />
                </div>
                {acceptedImages.map(({ display, id }, i) => (
                    <UploadedImage display={display} id={id} key={i} />
                ))}
            </div>
            <ul>
                {errors.map((message, i) => (
                    <li className="text-sm text-red-600" key={i}>
                        - {message}
                    </li>
                ))}
            </ul>
        </div>
    );

    function UploadedImage({ display, id }: { display: string; id: number }) {
        return (
            <div className={`${GRID_ELEMENT_CLASS} group relative`}>
                <img className="absolute w-full h-full object-cover sm:object-contain" src={display} alt="prop"></img>
                <div
                    className="mix-blend-hard-light opacity-75 hover:opacity-100 transition bg-gray-300 border border-solid border-gray-900 p-1 shadow z-10 absolute top-1 right-1 cursor-pointer  group-hover:block overflow-hidden"
                    onClick={() => {
                        setAcceptedImages((previous) => previous.filter((image) => image.id !== id));
                    }}
                >
                    <div className="w-4 h-4 z-10 relative">
                        <XMarkIcon />
                    </div>
                </div>
            </div>
        );
    }
}

const LazyFormImageUploadWidget = asWidget<LazyFormImageUploadProps>(LazyFormImageUpload, {});
export default LazyFormImageUploadWidget;
