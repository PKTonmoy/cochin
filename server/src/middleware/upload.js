/**
 * File Upload Middleware
 * Multer configuration for handling file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../../uploads');
const excelDir = path.join(uploadDir, 'excel');
const imagesDir = path.join(uploadDir, 'images');

[uploadDir, excelDir, imagesDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

/**
 * Storage configuration for Excel files
 */
const excelStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, excelDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

/**
 * Storage configuration for images (memory storage for Cloudinary upload)
 */
const imageStorage = multer.memoryStorage();

/**
 * File filter for Excel files
 */
const excelFilter = (req, file, cb) => {
    const allowedMimes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
    ];
    const allowedExts = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only Excel files (xlsx, xls) and CSV files are allowed'), false);
    }
};

/**
 * File filter for images
 */
const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
    }
};

/**
 * Excel file upload middleware
 */
const uploadExcel = multer({
    storage: excelStorage,
    fileFilter: excelFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

/**
 * Image upload middleware
 */
const uploadImage = multer({
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/**
 * Delete uploaded file
 */
const deleteFile = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(filePath, (err) => {
            if (err && err.code !== 'ENOENT') {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

module.exports = {
    uploadExcel,
    uploadImage,
    deleteFile,
    uploadDir,
    excelDir,
    imagesDir
};
