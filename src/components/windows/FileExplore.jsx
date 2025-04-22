'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  FolderOpen, File, FileText, ChevronRight, ArrowUp, RefreshCw, 
  Search, Grid, List, Folder, HardDrive, Upload, Trash2, 
  Edit, Download, Eye, Check, X, Loader, AlertTriangle
} from 'lucide-react';
import { useDialog } from '@/hooks/useDialog';

/**
 * Windows 2000 style File Explorer
 * 
 * Features:
 * - Tree view navigation
 * - List and tile view modes
 * - File operations (upload, delete, rename)
 * - File preview
 * - Breadcrumb navigation
 */
export default function FileExplorer({ theme = {}, onFileSelect }) {
  // State
  const [currentPath, setCurrentPath] = useState('/');
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [folderTree, setFolderTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'icons'
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  
  // Hooks
  const { showConfirm, showInput, showError } = useDialog();
  
  // Get theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Load current directory contents
  useEffect(() => {
    loadDirectoryContents(currentPath);
    updateBreadcrumbs(currentPath);
  }, [currentPath]);
  
  // Load folder tree on mount
  useEffect(() => {
    loadFolderTree();
  }, []);
  
  // Function to load contents of current directory
  const loadDirectoryContents = async (path) => {
    try {
      setLoading(true);
      setError(null);
      
      // Parse path to get bucket and directory
      const { bucket, directory } = parsePath(path);
      
      // Fetch contents from Supabase storage
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(directory, {
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) throw error;
      
      // Process the contents (add file types, etc.)
      const processedContents = processContents(data, path);
      setContents(processedContents);
    } catch (err) {
      console.error('Error loading directory contents:', err);
      setError(`Failed to load directory contents: ${err.message}`);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to load folder tree
  const loadFolderTree = async () => {
    try {
      // Get list of storage buckets
      const { data: buckets, error } = await supabase
        .storage
        .listBuckets();
      
      if (error) throw error;
      
      // Process buckets as root folders
      const tree = await Promise.all(buckets.map(async (bucket) => {
        try {
          // Get root contents of each bucket
          const { data, error } = await supabase
            .storage
            .from(bucket.name)
            .list('', { sortBy: { column: 'name', order: 'asc' } });
            
          if (error) throw error;
          
          // Filter for folders
          const folders = data.filter(item => !item.name.includes('.'));
          
          return {
            id: bucket.name,
            name: bucket.name,
            path: `/${bucket.name}`,
            type: 'bucket',
            children: folders.map(folder => ({
              id: `${bucket.name}/${folder.name}`,
              name: folder.name,
              path: `/${bucket.name}/${folder.name}`,
              type: 'folder',
              children: [] // Will load children when expanded
            }))
          };
        } catch (err) {
          console.error(`Error loading contents for bucket ${bucket.name}:`, err);
          return {
            id: bucket.name,
            name: bucket.name,
            path: `/${bucket.name}`,
            type: 'bucket',
            children: []
          };
        }
      }));
      
      setFolderTree(tree);
    } catch (err) {
      console.error('Error loading folder tree:', err);
      setError(`Failed to load folder structure: ${err.message}`);
    }
  };
  
  // Parse a path to get bucket and directory
  const parsePath = (path) => {
    // Remove leading slash and split by /
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const segments = cleanPath.split('/');
    
    // First segment is the bucket
    const bucket = segments[0] || 'default';
    
    // Rest is the directory
    const directory = segments.slice(1).join('/');
    
    return { bucket, directory };
  };
  
  // Process contents to add file types and other metadata
  const processContents = (data, path) => {
    if (!data) return [];
    
    return data.map(item => {
      // Determine if it's a folder
      const isFolder = !item.name.includes('.');
      
      // Get file extension for file type determination
      const extension = isFolder ? '' : item.name.split('.').pop().toLowerCase();
      
      // Determine file type and icon
      const fileType = getFileType(extension);
      const icon = getFileIcon(fileType);
      
      // Create full path
      const itemPath = `${path}/${item.name}`;
      
      return {
        ...item,
        isFolder,
        extension,
        type: isFolder ? 'folder' : fileType,
        icon,
        path: itemPath,
        size: item.metadata?.size || 0,
        lastModified: item.updated_at || item.created_at || new Date().toISOString()
      };
    });
  };
  
  // Get file type from extension
  const getFileType = (extension) => {
    const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
    const documentTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'];
    const spreadsheetTypes = ['xls', 'xlsx', 'csv'];
    const presentationTypes = ['ppt', 'pptx'];
    const archiveTypes = ['zip', 'rar', '7z', 'tar', 'gz'];
    const codeTypes = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'rb'];
    
    if (imageTypes.includes(extension)) return 'image';
    if (documentTypes.includes(extension)) return 'document';
    if (spreadsheetTypes.includes(extension)) return 'spreadsheet';
    if (presentationTypes.includes(extension)) return 'presentation';
    if (archiveTypes.includes(extension)) return 'archive';
    if (codeTypes.includes(extension)) return 'code';
    
    return 'file';
  };
  
  // Get icon for file type
  const getFileIcon = (type) => {
    switch (type) {
      case 'folder': return <Folder size={16} className="text-yellow-500" />;
      case 'image': return <FileText size={16} className="text-blue-500" />;
      case 'document': return <FileText size={16} className="text-blue-600" />;
      case 'spreadsheet': return <FileText size={16} className="text-green-600" />;
      case 'presentation': return <FileText size={16} className="text-orange-500" />;
      case 'archive': return <File size={16} className="text-purple-500" />;
      case 'code': return <FileText size={16} className="text-gray-600" />;
      default: return <File size={16} className="text-gray-500" />;
    }
  };
  
  // Update breadcrumbs from path
  const updateBreadcrumbs = (path) => {
    const segments = path.split('/').filter(Boolean);
    
    // Create breadcrumb array
    const crumbs = [{ name: 'My Computer', path: '/' }];
    
    let currentPath = '';
    segments.forEach(segment => {
      currentPath += `/${segment}`;
      crumbs.push({
        name: segment,
        path: currentPath
      });
    });
    
    setBreadcrumbs(crumbs);
  };
  
  // Navigate to a path
  const navigateTo = (path) => {
    setCurrentPath(path);
    setSelectedItem(null);
    setFilePreview(null);
  };
  
  // Navigate up one level
  const navigateUp = () => {
    if (currentPath === '/') return;
    
    const segments = currentPath.split('/').filter(Boolean);
    segments.pop();
    const parentPath = segments.length === 0 ? '/' : `/${segments.join('/')}`;
    
    navigateTo(parentPath);
  };
  
  // Handle folder tree item click
  const handleTreeItemClick = (path) => {
    navigateTo(path);
  };
  
  // Toggle folder expansion in tree view
  const handleToggleFolder = async (folderId, path) => {
    // Check if already expanded
    if (expandedFolders[folderId]) {
      // Collapse folder
      setExpandedFolders(prev => ({
        ...prev,
        [folderId]: false
      }));
      return;
    }
    
    // Expand folder and load its subfolders
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: true
    }));
    
    try {
      // Parse path
      const { bucket, directory } = parsePath(path);
      
      // Load subfolders
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(directory, { sortBy: { column: 'name', order: 'asc' } });
      
      if (error) throw error;
      
      // Filter for folders and update tree
      const subfolders = data.filter(item => !item.name.includes('.'));
      
      // Update folder tree with these subfolders
      updateFolderTreeChildren(path, subfolders);
    } catch (err) {
      console.error(`Error loading subfolders for ${path}:`, err);
    }
  };
  
  // Update folder tree with children
  const updateFolderTreeChildren = (parentPath, children) => {
    // Create a deep copy of the tree
    const updatedTree = JSON.parse(JSON.stringify(folderTree));
    
    // Find the parent folder and update its children
    const updateChildren = (folders, path) => {
      for (let i = 0; i < folders.length; i++) {
        if (folders[i].path === path) {
          // Found the parent, update its children
          folders[i].children = children.map(child => ({
            id: `${path}/${child.name}`,
            name: child.name,
            path: `${path}/${child.name}`,
            type: 'folder',
            children: []
          }));
          return true;
        }
        
        // Check children recursively
        if (folders[i].children && folders[i].children.length > 0) {
          if (updateChildren(folders[i].children, path)) {
            return true;
          }
        }
      }
      
      return false;
    };
    
    // Update the tree
    updateChildren(updatedTree, parentPath);
    setFolderTree(updatedTree);
  };
  
  // Handle item click
  const handleItemClick = (item) => {
    setSelectedItem(item);
    
    if (onFileSelect && !item.isFolder) {
      onFileSelect(item);
    }
  };
  
  // Handle item double click
  const handleItemDoubleClick = (item) => {
    if (item.isFolder) {
      // Navigate into folder
      navigateTo(item.path);
    } else {
      // Preview file
      handleFilePreview(item);
    }
  };
  
  // Handle file preview
  const handleFilePreview = async (item) => {
    try {
      // Get public URL for the file
      const { bucket, directory } = parsePath(currentPath);
      const { data } = await supabase.storage.from(bucket)
        .getPublicUrl(`${directory ? `${directory}/` : ''}${item.name}`);
      
      // Set file preview
      setFilePreview({
        ...item,
        url: data.publicUrl
      });
    } catch (err) {
      console.error('Error generating preview URL:', err);
      showError('Failed to preview file', err.message);
    }
  };
  
  // Close file preview
  const closeFilePreview = () => {
    setFilePreview(null);
  };
  
  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploadProgress({
      current: 0,
      total: files.length,
      percentage: 0
    });
    
    try {
      // Get current bucket and directory
      const { bucket, directory } = parsePath(currentPath);
      
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create file path
        const filePath = directory ? `${directory}/${file.name}` : file.name;
        
        // Update progress
        setUploadProgress({
          current: i + 1,
          total: files.length,
          percentage: Math.round(((i + 1) / files.length) * 100),
          currentFile: file.name
        });
        
        // Upload to Supabase
        const { error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (error) throw error;
      }
      
      // Reload contents after upload
      loadDirectoryContents(currentPath);
      
      // Clear upload progress after a delay
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);
    } catch (err) {
      console.error('Error uploading files:', err);
      showError('Upload Failed', err.message);
      setUploadProgress(null);
    }
    
    // Clear file input
    e.target.value = null;
  };
  
  // Handle file delete
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    const confirmation = await showConfirm(
      `Are you sure you want to delete "${selectedItem.name}"?`,
      'Confirm Delete'
    );
    
    if (confirmation !== 'Yes') return;
    
    try {
      const { bucket, directory } = parsePath(currentPath);
      const filePath = directory ? `${directory}/${selectedItem.name}` : selectedItem.name;
      
      if (selectedItem.isFolder) {
        // For folders, we need to delete all contents recursively
        // This is a simplified approach, in a real app you would use a recursive function
        
        // Show warning
        await showError(
          'Folder Delete Limitation',
          'Deleting folders with contents is not supported in this demo.'
        );
        return;
      } else {
        // Delete file
        const { error } = await supabase.storage
          .from(bucket)
          .remove([filePath]);
        
        if (error) throw error;
      }
      
      // Clear selection and reload
      setSelectedItem(null);
      loadDirectoryContents(currentPath);
    } catch (err) {
      console.error('Error deleting item:', err);
      showError('Delete Failed', err.message);
    }
  };
  
  // Handle file rename
  const handleRename = async () => {
    if (!selectedItem) return;
    
    const newName = await showInput(
      'Enter new name:',
      'Rename',
      selectedItem.name
    );
    
    if (!newName || newName === selectedItem.name) return;
    
    try {
      const { bucket, directory } = parsePath(currentPath);
      const oldPath = directory ? `${directory}/${selectedItem.name}` : selectedItem.name;
      const newPath = directory ? `${directory}/${newName}` : newName;
      
      // In Supabase, we need to copy the file then delete the original
      if (selectedItem.isFolder) {
        // Show warning
        await showError(
          'Rename Limitation',
          'Renaming folders is not supported in this demo.'
        );
        return;
      } else {
        // First, download the file
        const { data: fileData, error: downloadError } = await supabase.storage
          .from(bucket)
          .download(oldPath);
        
        if (downloadError) throw downloadError;
        
        // Then upload with new name
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(newPath, fileData, {
            cacheControl: '3600',
            upsert: true
          });
        
        if (uploadError) throw uploadError;
        
        // Delete old file
        const { error: deleteError } = await supabase.storage
          .from(bucket)
          .remove([oldPath]);
          
        if (deleteError) throw deleteError;
      }
      
      // Clear selection and reload
      setSelectedItem(null);
      loadDirectoryContents(currentPath);
    } catch (err) {
      console.error('Error renaming item:', err);
      showError('Rename Failed', err.message);
    }
  };
  
  // Handle file download
  const handleDownload = async () => {
    if (!selectedItem || selectedItem.isFolder) return;
    
    try {
      const { bucket, directory } = parsePath(currentPath);
      const filePath = directory ? `${directory}/${selectedItem.name}` : selectedItem.name;
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);
      
      if (error) throw error;
      
      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedItem.name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      showError('Download Failed', err.message);
    }
  };
  
  // Handle new folder creation
  const handleNewFolder = async () => {
    const folderName = await showInput(
      'Enter folder name:',
      'New Folder'
    );
    
    if (!folderName) return;
    
    try {
      const { bucket, directory } = parsePath(currentPath);
      
      // In Supabase, folders are just prefixes for files
      // Create an empty .keep file to represent the folder
      const folderPath = directory 
        ? `${directory}/${folderName}/.keep` 
        : `${folderName}/.keep`;
      
      const { error } = await supabase.storage
        .from(bucket)
        .upload(folderPath, new Blob([''], { type: 'text/plain' }), {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) throw error;
      
      // Reload contents
      loadDirectoryContents(currentPath);
      
      // Also reload folder tree if this is a top-level folder
      if (directory === '') {
        loadFolderTree();
      }
    } catch (err) {
      console.error('Error creating folder:', err);
      showError('Create Folder Failed', err.message);
    }
  };
  
  // Sort and filter contents
  const getSortedContents = () => {
    if (!contents) return { folders: [], files: [] };
    
    // Separate folders and files
    const folders = contents.filter(item => item.isFolder);
    const files = contents.filter(item => !item.isFolder);
    
    // Define sort function
    const sortFn = (a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'size':
          result = a.size - b.size;
          break;
        case 'type':
          result = a.type.localeCompare(b.type);
          break;
        case 'modified':
          result = new Date(a.lastModified) - new Date(b.lastModified);
          break;
        default:
          result = a.name.localeCompare(b.name);
      }
      
      return sortDirection === 'asc' ? result : -result;
    };
    
    // Sort folders and files
    return {
      folders: folders.sort(sortFn),
      files: files.sort(sortFn)
    };
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  };
  
  // Render tree item recursively
  const renderTreeItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedFolders[item.id];
    const isActive = currentPath === item.path;
    
    return (
      <div key={item.id}>
        <div 
          className={`flex items-center py-1 px-1 ${isActive ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          style={{
            paddingLeft: `${depth * 16 + 4}px`,
            cursor: 'pointer'
          }}
        >
          <button
            className="w-4 h-4 flex items-center justify-center"
            onClick={() => handleToggleFolder(item.id, item.path)}
          >
            {(hasChildren || item.type === 'bucket') && (
              <ChevronRight 
                size={14} 
                className={`transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`}
              />
            )}
          </button>
          
          <div 
            className="flex items-center ml-1"
            onClick={() => handleTreeItemClick(item.path)}
          >
            {item.type === 'bucket' ? (
              <HardDrive size={16} className="mr-1 text-blue-500" />
            ) : (
              <Folder size={16} className="mr-1 text-yellow-500" />
            )}
            <span className="text-xs truncate">{item.name}</span>
          </div>
        </div>
        
        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div>
            {item.children.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  // Render file preview
  const renderFilePreview = () => {
    if (!filePreview) return null;
    
    return (
      <div className="bg-gray-50 border-l p-4 w-1/3 overflow-auto">
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 className="font-medium">{filePreview.name}</h3>
          <button 
            className="p-1 hover:bg-gray-200 rounded-sm"
            onClick={closeFilePreview}
          >
            <X size={14} />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-2">
            {filePreview.icon}
            <span className="ml-2 text-sm capitalize">{filePreview.type}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-500">Size:</div>
            <div>{formatFileSize(filePreview.size)}</div>
            
            <div className="text-gray-500">Modified:</div>
            <div>{formatDate(filePreview.lastModified)}</div>
            
            <div className="text-gray-500">Path:</div>
            <div className="truncate">{filePreview.path}</div>
          </div>
        </div>
        
        {/* Preview content based on file type */}
        {filePreview.type === 'image' ? (
          <div className="border rounded p-2 bg-white">
            <img 
              src={filePreview.url} 
              alt={filePreview.name} 
              className="max-w-full max-h-64 mx-auto"
            />
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-100 rounded border">
            <p className="text-sm text-gray-500">Preview not available for this file type</p>
            
            <button 
              className="mt-4 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
              onClick={handleDownload}
            >
              <Download size={14} className="inline-block mr-1" />
              Download
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Main component render
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div 
        className="flex items-center px-2 py-1 border-b"
        style={{ backgroundColor: `#${bgColor}20` }}
      >
        <button
          className="p-1 rounded hover:bg-gray-200"
          onClick={navigateUp}
          disabled={currentPath === '/'}
          title="Up"
        >
          <ArrowUp size={16} />
        </button>
        
        <div className="border-r mx-2 h-5"></div>
        
        <button
          className="p-1 rounded hover:bg-gray-200"
          onClick={() => loadDirectoryContents(currentPath)}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
        
        <div className="border-r mx-2 h-5"></div>
        
        <button
          className={`p-1 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          onClick={() => setViewMode('list')}
          title="List View"
        >
          <List size={16} />
        </button>
        
        <button
          className={`p-1 rounded ${viewMode === 'icons' ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
          onClick={() => setViewMode('icons')}
          title="Icons View"
        >
          <Grid size={16} />
        </button>
        
        <div className="border-r mx-2 h-5"></div>
        
        <button
          className="p-1 rounded hover:bg-gray-200"
          onClick={handleNewFolder}
          title="New Folder"
        >
          <FolderOpen size={16} />
        </button>
        
        <button
          className="p-1 rounded hover:bg-gray-200"
          onClick={handleUploadClick}
          title="Upload"
        >
          <Upload size={16} />
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileUpload}
          multiple
        />
        
        {selectedItem && (
          <>
            <div className="border-r mx-2 h-5"></div>
            
            <button
              className="p-1 rounded hover:bg-gray-200"
              onClick={handleRename}
              title="Rename"
              disabled={selectedItem.isFolder}
            >
              <Edit size={16} />
            </button>
            
            <button
              className="p-1 rounded hover:bg-gray-200"
              onClick={handleDelete}
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
            
            {!selectedItem.isFolder && (
              <button
                className="p-1 rounded hover:bg-gray-200"
                onClick={handleDownload}
                title="Download"
              >
                <Download size={16} />
              </button>
            )}
          </>
        )}
        
        <div className="ml-auto flex items-center">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-7 pr-2 py-1 text-sm border rounded w-48"
            />
          </div>
        </div>
      </div>
      
      {/* Address bar with breadcrumbs */}
      <div 
        className="flex items-center px-2 py-1 border-b"
        style={{ backgroundColor: `#${bgColor}10` }}
      >
        <span className="text-xs font-medium mr-2">Address:</span>
        <div className="flex items-center flex-1 bg-white border rounded px-2 py-1">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-1 text-gray-400">/</span>}
              <button
                className="text-xs hover:underline text-blue-600"
                onClick={() => navigateTo(crumb.path)}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Tree view */}
        <div className="w-48 border-r overflow-y-auto">
          <div className="p-2 text-xs font-medium border-b">Folders</div>
          
          <div className="folders-tree">
            {folderTree.map(item => renderTreeItem(item))}
          </div>
        </div>
        
        {/* Main content pane */}
        <div className={`flex-1 ${filePreview ? 'w-2/3' : 'w-full'} overflow-auto`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-6 h-6 animate-spin mr-2 text-blue-500" />
              <span>Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="bg-red-50 text-red-600 p-4 rounded max-w-md">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Error</h3>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : getSortedContents().folders.length === 0 && getSortedContents().files.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <FolderOpen className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>This folder is empty</p>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            // List view
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th 
                    className="py-2 px-3 text-xs font-medium cursor-pointer select-none"
                    onClick={() => {
                      setSortBy('name');
                      setSortDirection(sortBy === 'name' && sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Name
                    {sortBy === 'name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th 
                    className="py-2 px-3 text-xs font-medium cursor-pointer select-none"
                    onClick={() => {
                      setSortBy('type');
                      setSortDirection(sortBy === 'type' && sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Type
                    {sortBy === 'type' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th 
                    className="py-2 px-3 text-xs font-medium cursor-pointer select-none"
                    onClick={() => {
                      setSortBy('size');
                      setSortDirection(sortBy === 'size' && sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Size
                    {sortBy === 'size' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th 
                    className="py-2 px-3 text-xs font-medium cursor-pointer select-none"
                    onClick={() => {
                      setSortBy('modified');
                      setSortDirection(sortBy === 'modified' && sortDirection === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Modified
                    {sortBy === 'modified' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Folders */}
                {getSortedContents().folders.map(item => (
                  <tr 
                    key={item.path} 
                    className={`border-t hover:bg-blue-50 cursor-pointer ${
                      selectedItem?.path === item.path ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <td className="py-1 px-3">
                      <div className="flex items-center">
                        <Folder className="w-4 h-4 mr-2 text-yellow-500" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-1 px-3 text-sm">Folder</td>
                    <td className="py-1 px-3 text-sm">-</td>
                    <td className="py-1 px-3 text-sm">{formatDate(item.lastModified)}</td>
                  </tr>
                ))}
                
                {/* Files */}
                {getSortedContents().files.map(item => (
                  <tr 
                    key={item.path} 
                    className={`border-t hover:bg-blue-50 cursor-pointer ${
                      selectedItem?.path === item.path ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => handleItemClick(item)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <td className="py-1 px-3">
                      <div className="flex items-center">
                        {item.icon}
                        <span className="text-sm ml-2">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-1 px-3 text-sm capitalize">{item.type}</td>
                    <td className="py-1 px-3 text-sm">{formatFileSize(item.size)}</td>
                    <td className="py-1 px-3 text-sm">{formatDate(item.lastModified)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Icons view
            <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Folders */}
              {getSortedContents().folders.map(item => (
                <div 
                  key={item.path}
                  className={`flex flex-col items-center p-3 rounded ${
                    selectedItem?.path === item.path ? 'bg-blue-100' : 'hover:bg-blue-50'
                  }`}
                  onClick={() => handleItemClick(item)}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                >
                  <Folder className="w-12 h-12 text-yellow-500 mb-1" />
                  <span className="text-sm text-center truncate w-full">{item.name}</span>
                </div>
              ))}
              
              {/* Files */}
              {getSortedContents().files.map(item => (
                <div 
                  key={item.path}
                  className={`flex flex-col items-center p-3 rounded ${
                    selectedItem?.path === item.path ? 'bg-blue-100' : 'hover:bg-blue-50'
                  }`}
                  onClick={() => handleItemClick(item)}
                  onDoubleClick={() => handleItemDoubleClick(item)}
                >
                  <div className="w-12 h-12 flex items-center justify-center mb-1">
                    {item.type === 'image' ? (
                      <img 
                        src={`${item.url}`} 
                        alt={item.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <FileText className="w-10 h-10 text-blue-500" style={{ display: item.type === 'image' ? 'none' : 'block' }} />
                  </div>
                  <span className="text-sm text-center truncate w-full">{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Preview pane */}
        {filePreview && renderFilePreview()}
      </div>
      
      {/* Status bar */}
      <div 
        className="flex items-center px-2 py-1 text-xs border-t"
        style={{ backgroundColor: `#${bgColor}20` }}
      >
        {uploadProgress ? (
          <div className="flex-1 flex items-center">
            <span className="mr-2">Uploading: {uploadProgress.currentFile}</span>
            <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full"
                style={{ 
                  width: `${uploadProgress.percentage}%`,
                  backgroundColor: `#${borderColor}`
                }}
              ></div>
            </div>
            <span className="ml-2">{uploadProgress.current} of {uploadProgress.total}</span>
          </div>
        ) : (
          <>
            <div>
              {getSortedContents().folders.length} folders, {getSortedContents().files.length} files
            </div>
            
            {selectedItem && (
              <div className="ml-4">
                Selected: {selectedItem.name}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}