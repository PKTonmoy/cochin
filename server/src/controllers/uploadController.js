/**
 * Upload Controller
 * Handles Excel file upload, validation, and import
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const UploadBatch = require('../models/UploadBatch');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Test = require('../models/Test');
const AuditLog = require('../models/AuditLog');
const { ApiError } = require('../middleware/errorHandler');
const { deleteFile, excelDir } = require('../middleware/upload');

// Store temporary upload data (in production, use Redis)
const tempUploads = new Map();

/**
 * Upload and preview Excel file
 */
exports.uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            throw new ApiError('No file uploaded', 400);
        }

        const filePath = req.file.path;
        const workbook = new ExcelJS.Workbook();

        // Read file based on extension
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext === '.csv') {
            await workbook.csv.readFile(filePath);
        } else {
            await workbook.xlsx.readFile(filePath);
        }

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new ApiError('No worksheet found in file', 400);
        }

        // Get headers from first row
        const headers = [];
        const firstRow = worksheet.getRow(1);
        firstRow.eachCell((cell, colNumber) => {
            headers.push({
                column: colNumber,
                name: cell.value?.toString().trim() || `Column ${colNumber}`
            });
        });

        // Get preview rows (up to 10)
        const previewRows = [];
        const rowCount = Math.min(worksheet.rowCount, 11); // 1 header + 10 data rows

        for (let i = 2; i <= rowCount; i++) {
            const row = worksheet.getRow(i);
            const rowData = {};
            headers.forEach(header => {
                const cell = row.getCell(header.column);
                rowData[header.name] = cell.value;
            });
            previewRows.push(rowData);
        }

        // Calculate file hash
        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

        // Generate temporary ID for this upload
        const tempId = crypto.randomBytes(16).toString('hex');

        // Store temp data
        tempUploads.set(tempId, {
            filePath,
            originalFilename: req.file.originalname,
            fileHash,
            headers,
            totalRows: worksheet.rowCount - 1,
            uploaderId: req.user.id,
            uploadedAt: new Date()
        });

        // Auto-expire temp data after 30 minutes
        setTimeout(() => {
            const data = tempUploads.get(tempId);
            if (data) {
                tempUploads.delete(tempId);
                deleteFile(data.filePath).catch(() => { });
            }
        }, 30 * 60 * 1000);

        // Suggest mapping based on header names
        const suggestedMapping = autoMapColumns(headers);

        res.json({
            success: true,
            data: {
                tempId,
                filename: req.file.originalname,
                headers,
                totalRows: worksheet.rowCount - 1,
                previewRows,
                suggestedMapping
            }
        });
    } catch (error) {
        // Clean up file on error
        if (req.file) {
            deleteFile(req.file.path).catch(() => { });
        }
        next(error);
    }
};

/**
 * Auto-map columns based on header names
 */
function autoMapColumns(headers) {
    const mapping = {};
    const fieldMappings = {
        'roll': ['roll', 'roll_no', 'roll_number', 'rollno', 'student_roll', 'id'],
        'name': ['name', 'student_name', 'student'],
        'bangla': ['bangla', 'bengali', 'ban', 'বাংলা'],
        'english': ['english', 'eng', 'ইংরেজি'],
        'mathematics': ['mathematics', 'math', 'maths', 'গণিত'],
        'science': ['science', 'sci', 'বিজ্ঞান'],
        'social_science': ['social_science', 'social', 'sst', 'সমাজ'],
        'religion': ['religion', 'rel', 'ধর্ম'],
        'ict': ['ict', 'computer', 'তথ্য ও যোগাযোগ প্রযুক্তি'],
        'physics': ['physics', 'phy', 'পদার্থ'],
        'chemistry': ['chemistry', 'chem', 'রসায়ন'],
        'biology': ['biology', 'bio', 'জীববিজ্ঞান'],
        'higher_math': ['higher_math', 'higher_mathematics', 'h_math', 'উচ্চতর গণিত'],
        'accounting': ['accounting', 'acc', 'হিসাববিজ্ঞান'],
        'finance': ['finance', 'fin', 'ফিন্যান্স'],
        'economics': ['economics', 'eco', 'অর্থনীতি']
    };

    headers.forEach(header => {
        const headerLower = header.name.toLowerCase().replace(/[^a-z0-9]/g, '_');

        for (const [field, aliases] of Object.entries(fieldMappings)) {
            if (aliases.some(alias => headerLower.includes(alias))) {
                mapping[header.name] = field;
                break;
            }
        }
    });

    return mapping;
}

/**
 * Validate mapping and preview results
 */
exports.validateMapping = async (req, res, next) => {
    try {
        const { tempId, mapping, testId } = req.body;

        if (!tempId || !mapping) {
            throw new ApiError('tempId and mapping are required', 400);
        }

        const uploadData = tempUploads.get(tempId);
        if (!uploadData) {
            throw new ApiError('Upload session expired. Please upload the file again.', 400);
        }

        // Verify test exists
        let test = null;
        if (testId) {
            test = await Test.findById(testId);
            if (!test) {
                throw new ApiError('Test not found', 404);
            }
        }

        // Validate required mappings
        if (!mapping.roll) {
            throw new ApiError('Roll number column mapping is required', 400);
        }

        // Check for at least one subject mapping
        const subjectMappings = Object.entries(mapping).filter(([key, value]) =>
            value !== 'roll' && value !== 'name' && value !== 'ignore'
        );

        if (subjectMappings.length === 0) {
            throw new ApiError('At least one subject column mapping is required', 400);
        }

        // Read and validate all rows
        const workbook = new ExcelJS.Workbook();
        const ext = path.extname(uploadData.originalFilename).toLowerCase();
        if (ext === '.csv') {
            await workbook.csv.readFile(uploadData.filePath);
        } else {
            await workbook.xlsx.readFile(uploadData.filePath);
        }

        const worksheet = workbook.worksheets[0];
        const validationResults = {
            valid: [],
            errors: [],
            warnings: []
        };

        // Get header to column mapping
        const headerToCol = {};
        const firstRow = worksheet.getRow(1);
        firstRow.eachCell((cell, colNumber) => {
            headerToCol[cell.value?.toString().trim()] = colNumber;
        });

        // Get all existing students for validation
        const existingStudents = await Student.find({}).select('roll _id name');
        const studentMap = new Map(existingStudents.map(s => [s.roll.toUpperCase(), s]));

        // Check for existing results
        const existingResults = test
            ? await Result.find({ testId: test._id }).select('roll')
            : [];
        const existingResultRolls = new Set(existingResults.map(r => r.roll.toUpperCase()));

        // Process each row
        for (let i = 2; i <= worksheet.rowCount; i++) {
            const row = worksheet.getRow(i);
            const rowData = { _rowNum: i };

            // Extract mapped values
            for (const [headerName, fieldName] of Object.entries(mapping)) {
                if (fieldName === 'ignore') continue;
                const colNumber = headerToCol[headerName];
                if (colNumber) {
                    const cell = row.getCell(colNumber);
                    rowData[fieldName] = cell.value;
                }
            }

            // Validate roll
            if (!rowData.roll) {
                validationResults.errors.push({
                    row: i,
                    field: 'roll',
                    message: 'Roll number is required',
                    data: rowData
                });
                continue;
            }

            const roll = rowData.roll.toString().toUpperCase().trim();
            rowData.roll = roll;

            // Check if student exists
            const student = studentMap.get(roll);
            if (!student) {
                validationResults.errors.push({
                    row: i,
                    field: 'roll',
                    message: `Student with roll ${roll} not found`,
                    data: rowData
                });
                continue;
            }

            rowData.studentId = student._id;
            rowData.studentName = student.name;

            // Check for duplicate result
            if (existingResultRolls.has(roll)) {
                validationResults.warnings.push({
                    row: i,
                    field: 'roll',
                    message: `Result for ${roll} already exists and will be updated`,
                    data: rowData,
                    isUpdate: true
                });
            }

            // Validate subject marks
            const subjectMarks = {};
            let hasValidMarks = false;
            let totalMarks = 0;

            for (const [headerName, fieldName] of Object.entries(mapping)) {
                if (fieldName === 'roll' || fieldName === 'name' || fieldName === 'ignore') continue;

                const marks = rowData[fieldName];
                if (marks !== undefined && marks !== null && marks !== '') {
                    const numMarks = parseFloat(marks);
                    if (isNaN(numMarks)) {
                        validationResults.errors.push({
                            row: i,
                            field: fieldName,
                            message: `Invalid marks value for ${fieldName}: ${marks}`,
                            data: rowData
                        });
                    } else if (numMarks < 0) {
                        validationResults.errors.push({
                            row: i,
                            field: fieldName,
                            message: `Marks cannot be negative for ${fieldName}`,
                            data: rowData
                        });
                    } else {
                        subjectMarks[fieldName] = numMarks;
                        totalMarks += numMarks;
                        hasValidMarks = true;
                    }
                }
            }

            if (!hasValidMarks) {
                validationResults.errors.push({
                    row: i,
                    field: 'marks',
                    message: 'At least one valid subject mark is required',
                    data: rowData
                });
                continue;
            }

            rowData.subjectMarks = subjectMarks;
            rowData.totalMarks = totalMarks;

            // Add to valid if no errors for this row
            const hasError = validationResults.errors.some(e => e.row === i);
            if (!hasError) {
                const existingWarning = validationResults.warnings.find(w => w.row === i);
                validationResults.valid.push({
                    row: i,
                    roll,
                    studentId: student._id,
                    studentName: student.name,
                    subjectMarks,
                    totalMarks,
                    isUpdate: existingWarning?.isUpdate || false
                });
            }
        }

        // Update temp storage with mapping
        uploadData.mapping = mapping;
        uploadData.testId = testId;
        uploadData.validationResults = validationResults;
        tempUploads.set(tempId, uploadData);

        res.json({
            success: true,
            data: {
                summary: {
                    total: worksheet.rowCount - 1,
                    valid: validationResults.valid.length,
                    errors: validationResults.errors.length,
                    warnings: validationResults.warnings.length,
                    updates: validationResults.valid.filter(v => v.isUpdate).length
                },
                errors: validationResults.errors.slice(0, 50), // Limit to first 50 errors
                warnings: validationResults.warnings.slice(0, 20),
                validPreview: validationResults.valid.slice(0, 10)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Execute import
 */
exports.executeImport = async (req, res, next) => {
    try {
        const { tempId, testId } = req.body;

        if (!tempId) {
            throw new ApiError('tempId is required', 400);
        }

        const uploadData = tempUploads.get(tempId);
        if (!uploadData) {
            throw new ApiError('Upload session expired. Please upload the file again.', 400);
        }

        if (!uploadData.validationResults) {
            throw new ApiError('Please validate the mapping first', 400);
        }

        const { valid } = uploadData.validationResults;
        if (valid.length === 0) {
            throw new ApiError('No valid rows to import', 400);
        }

        // Get or verify test
        let test = null;
        const effectiveTestId = testId || uploadData.testId;
        if (effectiveTestId) {
            test = await Test.findById(effectiveTestId);
            if (!test) {
                throw new ApiError('Test not found', 404);
            }
        }

        // Create upload batch record
        const batch = await UploadBatch.create({
            filename: uploadData.filePath,
            originalFilename: uploadData.originalFilename,
            uploaderId: req.user.id,
            testId: test?._id,
            mapping: uploadData.mapping,
            totalRows: uploadData.totalRows,
            fileHash: uploadData.fileHash,
            status: 'processing'
        });

        let insertedCount = 0;
        let updatedCount = 0;
        const failedRows = [];

        // Process each valid row
        for (const rowData of valid) {
            try {
                const resultData = {
                    testId: test?._id,
                    studentId: rowData.studentId,
                    roll: rowData.roll,
                    subjectMarks: new Map(Object.entries(rowData.subjectMarks)),
                    totalMarks: rowData.totalMarks,
                    maxMarks: test?.totalMaxMarks || 0,
                    uploadBatchId: batch._id,
                    createdBy: req.user.id
                };

                if (rowData.isUpdate) {
                    // Update existing result
                    await Result.findOneAndUpdate(
                        { testId: test?._id, studentId: rowData.studentId },
                        resultData,
                        { upsert: true, new: true }
                    );
                    updatedCount++;
                } else {
                    // Insert new result
                    await Result.create(resultData);
                    insertedCount++;
                }
            } catch (rowError) {
                failedRows.push({
                    row: rowData.row,
                    data: rowData,
                    error: rowError.message
                });
            }
        }

        // Update batch status
        batch.insertedCount = insertedCount;
        batch.updatedCount = updatedCount;
        batch.failedRowsCount = failedRows.length;
        batch.failedRows = failedRows;
        batch.status = failedRows.length > 0 ? 'partially_imported' : 'imported';
        await batch.save();

        // Clean up temp data
        tempUploads.delete(tempId);

        await AuditLog.log({
            action: 'results_imported',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'upload_batch',
            entityId: batch._id,
            details: {
                filename: uploadData.originalFilename,
                insertedCount,
                updatedCount,
                failedCount: failedRows.length
            },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: `Import completed: ${insertedCount} inserted, ${updatedCount} updated, ${failedRows.length} failed`,
            data: {
                batchId: batch._id,
                insertedCount,
                updatedCount,
                failedRowsCount: failedRows.length,
                failedRows: failedRows.slice(0, 20)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Rollback import batch
 */
exports.rollbackImport = async (req, res, next) => {
    try {
        const { batchId } = req.body;

        if (!batchId) {
            throw new ApiError('batchId is required', 400);
        }

        const batch = await UploadBatch.findById(batchId);
        if (!batch) {
            throw new ApiError('Batch not found', 404);
        }

        if (batch.status === 'reverted') {
            throw new ApiError('Batch has already been reverted', 400);
        }

        // Delete all results from this batch
        const deleteResult = await Result.deleteMany({ uploadBatchId: batch._id });

        // Update batch status
        batch.status = 'reverted';
        batch.revertedAt = new Date();
        batch.revertedBy = req.user.id;
        await batch.save();

        await AuditLog.log({
            action: 'results_rollback',
            userId: req.user.id,
            userRole: req.user.role,
            entityType: 'upload_batch',
            entityId: batch._id,
            details: {
                deletedCount: deleteResult.deletedCount
            },
            ipAddress: req.ip
        });

        res.json({
            success: true,
            message: `Rollback completed: ${deleteResult.deletedCount} results deleted`,
            data: {
                batchId: batch._id,
                deletedCount: deleteResult.deletedCount
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all upload batches
 */
exports.getBatches = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;

        const query = {};
        if (status) query.status = status;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [batches, total] = await Promise.all([
            UploadBatch.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            UploadBatch.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                batches,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get single batch details
 */
exports.getBatch = async (req, res, next) => {
    try {
        const batch = await UploadBatch.findById(req.params.id);
        if (!batch) {
            throw new ApiError('Batch not found', 404);
        }

        res.json({
            success: true,
            data: batch
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Download Excel template
 */
exports.downloadTemplate = async (req, res, next) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Results Template');

        worksheet.columns = [
            { header: 'Roll', key: 'roll', width: 15 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Bangla', key: 'bangla', width: 10 },
            { header: 'English', key: 'english', width: 10 },
            { header: 'Mathematics', key: 'mathematics', width: 12 },
            { header: 'Science', key: 'science', width: 10 },
            { header: 'Social Science', key: 'social_science', width: 14 },
            { header: 'Religion', key: 'religion', width: 10 },
            { header: 'ICT', key: 'ict', width: 10 }
        ];

        // Add sample data
        worksheet.addRow({
            roll: 'P2401001',
            name: 'Sample Student',
            bangla: 85,
            english: 78,
            mathematics: 92,
            science: 88,
            social_science: 75,
            religion: 90,
            ict: 95
        });

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1A365D' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Add instructions sheet
        const instructionSheet = workbook.addWorksheet('Instructions');
        instructionSheet.columns = [{ width: 80 }];
        const instructions = [
            'PARAGON Coaching Center - Results Import Template',
            '',
            'Instructions:',
            '1. Fill in the Roll number column with student roll numbers',
            '2. Name column is optional (for reference only)',
            '3. Add marks for each subject in the respective columns',
            '4. You can add or remove subject columns as needed',
            '5. Leave cells empty if student was absent for that subject',
            '',
            'Notes:',
            '- Roll numbers must match existing students in the system',
            '- Marks should be numeric values',
            '- Column headers can be customized - you will map them during import'
        ];
        instructions.forEach((text, i) => {
            instructionSheet.getCell(`A${i + 1}`).value = text;
        });

        const filename = 'paragon-results-template.xlsx';
        const filepath = path.join(excelDir, filename);
        await workbook.xlsx.writeFile(filepath);

        res.download(filepath, filename);
    } catch (error) {
        next(error);
    }
};
