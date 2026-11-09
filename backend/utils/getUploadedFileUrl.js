const cloudinary = require("../config/cloudinary");
const { Readable } = require("stream");

const getUploadedFileUrl = (req, file) => {
  if (!file) return Promise.resolve("");

  if (!file.buffer) {
    return Promise.reject(
      new Error(
        "Uploaded file buffer is missing. Check Multer memoryStorage and upload.single('image')."
      )
    );
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "fixnear/categories",
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);

        if (!result?.secure_url) {
          return reject(new Error("Cloudinary did not return an image URL."));
        }

        resolve(result.secure_url);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

module.exports = getUploadedFileUrl;