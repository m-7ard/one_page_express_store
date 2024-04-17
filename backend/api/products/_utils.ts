import { Request } from "express";

export const validImageFileRegex = /^image-(1[0-2]|[0-9])$/;
export type RequestFiles = Record<string, [Express.Multer.File]>;
export const getImages = (request: Request) => {
    const newImages = Object.entries(request.files as RequestFiles).map(([fieldName, files]) => {
        return {
            index: parseInt(fieldName.split("-")[1]),
            file: files[0],
        };
    });
    const existingImages = Object.entries(request.body).reduce<
        Array<{
            index: number;
            fileName: string;
        }>
    >((acc, [fieldName, fileName]) => {
        if (validImageFileRegex.test(fieldName) && typeof fileName === "string") {
            acc.push({
                index: parseInt(fieldName.split("-")[1]),
                fileName,
            });
        }
        return acc;
    }, []);

    return {
        newImages,
        existingImages,
    };
};
