import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Upload, Image, Video, FileText, Trash2, Search,
    FolderPlus, Grid, List, X, CheckSquare, Square,
    Download, Copy, ExternalLink, MoreVertical
} from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';

const FILE_TYPE_ICONS = {
    image: Image,
    video: Video,
    document: FileText
};

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'application/pdf'];

export default function MediaLibrary() {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [folderFilter, setFolderFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedItems, setSelectedItems] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewItem, setPreviewItem] = useState(null);

    // Fetch media
    const { data: response, isLoading } = useQuery({
        queryKey: ['media', searchTerm, folderFilter, typeFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (folderFilter) params.append('folder', folderFilter);
            if (typeFilter) params.append('type', typeFilter);
            const res = await api.get(`/media?${params.toString()}`);
            return res.data;
        }
    });

    // Fetch folders
    const { data: foldersResponse } = useQuery({
        queryKey: ['media-folders'],
        queryFn: async () => {
            const res = await api.get('/media/folders');
            return res.data;
        }
    });

    // Fetch stats
    const { data: statsResponse } = useQuery({
        queryKey: ['media-stats'],
        queryFn: async () => {
            const res = await api.get('/media/stats');
            return res.data;
        }
    });

    const media = response?.data || [];
    const folders = foldersResponse?.data || [];
    const stats = statsResponse?.data || {};

    // Upload mutation
    const uploadMutation = useMutation({
        mutationFn: async (formData) => {
            const res = await api.post('/media/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(progress);
                }
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['media']);
            queryClient.invalidateQueries(['media-stats']);
            toast.success('File uploaded successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Upload failed');
        },
        onSettled: () => {
            setUploading(false);
            setUploadProgress(0);
        }
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: (id) => api.delete(`/media/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['media']);
            queryClient.invalidateQueries(['media-stats']);
            toast.success('File deleted');
            setSelectedItems([]);
        }
    });

    // Bulk delete mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => api.post('/media/bulk-delete', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries(['media']);
            queryClient.invalidateQueries(['media-stats']);
            toast.success('Files deleted');
            setSelectedItems([]);
        }
    });

    const handleFileUpload = useCallback(async (e) => {
        const files = e.target.files;
        if (!files?.length) return;

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (!ALLOWED_TYPES.includes(file.type)) {
                toast.error(`${file.name}: File type not allowed`);
                continue;
            }

            if (file.size > 10 * 1024 * 1024) {
                toast.error(`${file.name}: File too large (max 10MB)`);
                continue;
            }

            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', folderFilter || 'general');

            await uploadMutation.mutateAsync(formData);
        }
    }, [folderFilter, uploadMutation]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload({ target: { files } });
        }
    }, [handleFileUpload]);

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const toggleSelect = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const selectAll = () => {
        if (selectedItems.length === media.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(media.map(m => m._id));
        }
    };

    const handleDelete = (id, name) => {
        if (window.confirm(`Delete "${name}"?`)) {
            deleteMutation.mutate(id);
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Delete ${selectedItems.length} files?`)) {
            bulkDeleteMutation.mutate(selectedItems);
        }
    };

    const copyUrl = (url) => {
        navigator.clipboard.writeText(url);
        toast.success('URL copied to clipboard');
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getFileTypeIcon = (type) => {
        const Icon = FILE_TYPE_ICONS[type] || FileText;
        return Icon;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
                    <p className="text-gray-600 mt-1">
                        {stats.totalFiles || 0} files • {formatSize(stats.totalSize || 0)} used
                    </p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload Files
                    <input
                        type="file"
                        multiple
                        accept={ALLOWED_TYPES.join(',')}
                        onChange={handleFileUpload}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Upload zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                {uploading ? (
                    <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600">Uploading... {uploadProgress}%</p>
                    </div>
                ) : (
                    <div>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Drag and drop files here or click to upload</p>
                        <p className="text-xs text-gray-400 mt-1">Max 10MB per file. Supported: JPEG, PNG, WebP, GIF, MP4, PDF</p>
                    </div>
                )}
            </div>

            {/* Filters & Actions */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex flex-col lg:flex-row gap-4 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search files..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <select
                        value={folderFilter}
                        onChange={(e) => setFolderFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Folders</option>
                        {folders.map((folder) => (
                            <option key={folder} value={folder}>{folder}</option>
                        ))}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Types</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                        <option value="document">Documents</option>
                    </select>
                    <div className="flex items-center gap-2 border-l pl-4">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Bulk actions */}
                {selectedItems.length > 0 && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                        <button
                            onClick={selectAll}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            {selectedItems.length === media.length ? (
                                <CheckSquare className="w-4 h-4" />
                            ) : (
                                <Square className="w-4 h-4" />
                            )}
                            Select All
                        </button>
                        <span className="text-sm text-gray-500">{selectedItems.length} selected</span>
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedItems([])}
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}
            </div>

            {/* Media Grid/List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : media.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
                    <p className="text-gray-600">Upload some files to get started.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {media.map((item) => (
                        <div
                            key={item._id}
                            className={`group relative bg-white rounded-lg shadow overflow-hidden border-2 transition-colors ${selectedItems.includes(item._id) ? 'border-blue-500' : 'border-transparent'
                                }`}
                        >
                            {/* Select checkbox */}
                            <button
                                onClick={() => toggleSelect(item._id)}
                                className={`absolute top-2 left-2 z-10 p-1 rounded bg-white/80 transition-opacity ${selectedItems.includes(item._id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                            >
                                {selectedItems.includes(item._id) ? (
                                    <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                    <Square className="w-5 h-5 text-gray-400" />
                                )}
                            </button>

                            {/* Preview */}
                            <div
                                className="aspect-square bg-gray-100 cursor-pointer"
                                onClick={() => setPreviewItem(item)}
                            >
                                {item.fileType === 'image' ? (
                                    <img
                                        src={item.thumbnailUrl || item.url}
                                        alt={item.alt || item.filename}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        {React.createElement(getFileTypeIcon(item.fileType), { className: 'w-12 h-12 text-gray-400' })}
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="p-2">
                                <p className="text-xs font-medium text-gray-900 truncate">{item.filename}</p>
                                <p className="text-xs text-gray-500">{formatSize(item.size)}</p>
                            </div>

                            {/* Actions overlay */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={() => copyUrl(item.url)}
                                    className="p-1 bg-white/80 rounded hover:bg-white"
                                    title="Copy URL"
                                >
                                    <Copy className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                    onClick={() => handleDelete(item._id, item.filename)}
                                    className="p-1 bg-white/80 rounded hover:bg-white"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">
                                    <button onClick={selectAll}>
                                        {selectedItems.length === media.length ? (
                                            <CheckSquare className="w-4 h-4" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folder</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {media.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <button onClick={() => toggleSelect(item._id)}>
                                            {selectedItems.includes(item._id) ? (
                                                <CheckSquare className="w-4 h-4 text-blue-600" />
                                            ) : (
                                                <Square className="w-4 h-4 text-gray-400" />
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {item.fileType === 'image' ? (
                                                    <img src={item.thumbnailUrl || item.url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    React.createElement(getFileTypeIcon(item.fileType), { className: 'w-5 h-5 text-gray-400' })
                                                )}
                                            </div>
                                            <span className="font-medium text-gray-900 truncate max-w-xs">{item.filename}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-500 capitalize">{item.fileType}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{formatSize(item.size)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{item.folder || '-'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => copyUrl(item.url)} className="p-1 hover:bg-gray-100 rounded" title="Copy URL">
                                                <Copy className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-100 rounded" title="Open">
                                                <ExternalLink className="w-4 h-4 text-gray-600" />
                                            </a>
                                            <button onClick={() => handleDelete(item._id, item.filename)} className="p-1 hover:bg-red-50 rounded" title="Delete">
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Preview Modal */}
            {previewItem && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewItem(null)}>
                    <div className="max-w-4xl max-h-full overflow-auto bg-white rounded-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-medium">{previewItem.filename}</h3>
                            <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-gray-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            {previewItem.fileType === 'image' ? (
                                <img src={previewItem.url} alt={previewItem.alt} className="max-w-full max-h-[70vh] mx-auto" />
                            ) : previewItem.fileType === 'video' ? (
                                <video src={previewItem.url} controls className="max-w-full max-h-[70vh] mx-auto" />
                            ) : (
                                <div className="text-center py-8">
                                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <a href={previewItem.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        Download File
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t bg-gray-50">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Size:</span> {formatSize(previewItem.size)}
                                </div>
                                <div>
                                    <span className="text-gray-500">Type:</span> {previewItem.mimeType}
                                </div>
                                {previewItem.dimensions && (
                                    <div>
                                        <span className="text-gray-500">Dimensions:</span> {previewItem.dimensions.width}x{previewItem.dimensions.height}
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-500">Folder:</span> {previewItem.folder || 'general'}
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => copyUrl(previewItem.url)}
                                    className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Copy URL
                                </button>
                                <a
                                    href={previewItem.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium text-center hover:bg-blue-700 transition-colors"
                                >
                                    Open Original
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
