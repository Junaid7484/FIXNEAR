# FixNear Image Upload Setup

Image URL fields have been replaced with real image-file uploads in the admin, provider and customer image forms.

## What changed

- Admin Service create/edit: upload service image.
- Admin Category create/edit: upload category image.
- Provider registration: upload profile image.
- Provider profile edit: upload/replace profile image.
- Customer profile edit: upload/replace profile image.
- Provider service image form: uses an image file instead of an image URL.
- Backend uses the existing Multer middleware and stores files in `backend/uploads/`.
- Uploaded files are served from `http://localhost:5000/uploads/<filename>`.
- Maximum image size: 5 MB.
- Allowed formats: JPG, JPEG, PNG, WEBP.

## Start

1. Copy `backend/.env.example` to `backend/.env` and enter your own credentials.
2. Do not commit `.env`.
3. From `backend`, run `npm install` and start the server.
4. Start the Dashboard frontend on port 5173.
5. Select an image using the new file picker and submit the form.

The frontend sends `multipart/form-data` using `FormData`; Axios is intentionally not given a manual `Content-Type` header so the browser can add the multipart boundary correctly.

## Important

Local uploads are suitable for local development. For production hosting, move uploaded images to persistent object storage such as Cloudinary, S3, or another persistent file service.
