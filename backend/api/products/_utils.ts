import { Request } from "express";

export const validImageFileRegex = /^image-(1[0-2]|[0-9])$/;
export type RequestFiles = Record<string, [Express.Multer.File]>;
export const getImages = (request: Request) => {
    /*
        Will check in request.files (expecting new File blobs) 
    and request.body (expeting existing file names) using the
    format, image-{number from 1 - 12} and returns of objects
    with their respective order index derived from the number
    after the '-' character in image-{number from 1 - 12} 
    ---------------------------------------------
    Requires the following multer congif to work:
        const upload = multer();

        const uploadConfig = upload.fields(
            Array.from({ length: 12 }).map((_, i) => ({
                name: `image-${i}`,
                maxCount: 12,
            })),
        );
        const router = express.Router();
        router.post("/endpoint", uploadConfig, endpoint);
    ---------------------------------------------
    */
    const newImages = Object.entries(request.files ?? ({} as RequestFiles)).map(([fieldName, files]) => {
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
