import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9) + file.originalname;
        cb(null, uniqueSuffix);
    }
});

const fileFilter = (req, file, cb) => {
    // Checking file size using buffer length
    if (file?.buffer?.length > 3000) {
        return cb(new Error("File size must be less than 3KB"));
    }
    cb(null, true);
};

const upload = multer({ storage, fileFilter }).array("images");

export default upload;
