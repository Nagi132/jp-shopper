'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  FolderOpen, File, ChevronRight, ArrowUp, RefreshCw, 
  Home, Edit3, Copy, Scissors, Clipboard, HardDrive, 
  Folder, Search, Grid, List, FileText, Image, Music,
  Settings, Info
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

/**
 * FileExplorer - A Windows 2000 style file explorer component
 * 
 * Features:
 * - Navigation tree for folders
 * - Files/folders listing with details or icons view
 * - Breadcrumb path navigation
 * - Upload/download functionality
 * - File preview integration
 * - Context menus
 */
export default function FileExplorer({ 
  initialPath = '/', 
  onFileSelect,
  onClose,
  theme = {},
  uploadEnabled = true,
  className = ''
}) {
  // State
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('details'); // 'icons' or 'details'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'size', 'type', 'date'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [navigationHistory, setNavigationHistory] = useState({ back: [], forward: [] });
  const [error, setError] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [folderTree, setFolderTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [filePreview, setFilePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  
  // Refs
  const fileInputRef = useRef(null);
  const explorerRef = useRef(null);
  
  // Get theme colors
  const borderColor = theme?.borderColor || '69EFD7';
  const bgColor = theme?.bgColor || 'FED1EB';
  
  // Function to load contents of current path
  const loadContents = async (path = currentPath) => {
    try {
      setLoading(true);
      setError(null);
      
      // Parse path to determine storage bucket and directory
      const { bucket, directory } = parsePath(path);
      
      console.log('Loading contents of', { bucket, directory });
      
      // List objects in the storage bucket
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .list(directory, {
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (error) throw error;
      
      // Process the data to add file types and other info
      const processedData = processContents(data, path);
      setContents(processedData);
      
      // Update breadcrumbs
      updateBreadcrumbs(path);
      
      console.log('Loaded contents:', processedData);
    } catch (err) {
      console.error('Error loading contents:', err);
      setError(err.message || 'Failed to load contents');
      setContents([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load contents when path changes
  useEffect(() => {
    loadContents();
  }, [currentPath]);
  
  // Load folder structure for tree view
  const loadFolderTree = async () => {
    try {
      // Get list of buckets
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      if (bucketsError) throw bucketsError;
      
      // Build initial tree with buckets as root folders
      const tree = await Promise.all(buckets.map(async (bucket) => {
        // Get root folders in bucket
        const { data: contents, error } = await supabase
          .storage
          .from(bucket.name)
          .list('', { sortBy: { column: 'name', order: 'asc' } });
        
        if (error) throw error;
        
        // Filter for folders
        const folders = contents.filter(item => item.id && !item.name.includes('.'));
        
        // Build children
        const children = folders.map(folder => ({
          id: `${bucket.name}/${folder.name}`,
          name: folder.name,
          type: 'folder',
          path: `/${bucket.name}/${folder.name}`,
          children: [] // Will be loaded when expanded
        }));
        
        return {
          id: bucket.name,
          name: bucket.name,
          type: 'bucket',
          path: `/${bucket.name}`,
          children
        };
      }));
      
      setFolderTree(tree);
    } catch (err) {
      console.error('Error loading folder tree:', err);
      setError(err.message || 'Failed to load folder structure');
    }
  };
  
  // Load folder tree on mount
  useEffect(() => {
    loadFolderTree();
  }, []);
  
  // Parse a path to get bucket and directory
  const parsePath = (path) => {
    // Remove leading slash
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Split into segments
    const segments = cleanPath.split('/');
    
    // First segment is the bucket
    const bucket = segments[0] || 'uploads';
    
    // Remaining segments form the directory
    const directory = segments.slice(1).join('/');
    
    return { bucket, directory };
  };
  
  // Process content data to add file types and other metadata
  const processContents = (data, path) => {
    if (!data) return [];
    
    return data.map(item => {
      // Determine if it's a folder (no file extension)
      const isFolder = item.id && !item.name.includes('.');
      
      // Get file extension for type determination
      const extension = item.name.split('.').pop()?.toLowerCase();
      
      // Map file types
      let type = 'unknown';
      let icon = <File size={16} />;
      
      if (isFolder) {
        type = 'folder';
        icon = <Folder size={16} />;
      } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
        type = 'image';
        icon = <Image size={16} />;
      } else if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(extension)) {
        type = 'audio';
        icon = <Music size={16} />;
      } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension)) {
        type = 'video';
        icon = <FileText size={16} />;
      } else if (['txt', 'md', 'rtf', 'doc', 'docx', 'pdf'].includes(extension)) {
        type = 'document';
        icon = <FileText size={16} />;
      } else if (['html', 'css', 'js', 'jsx', 'json', 'xml'].includes(extension)) {
        type = 'code';
        icon = <FileText size={16} />;
      }
      
      // Construct full path for the item
      const itemPath = isFolder
        ? `${path}/${item.name}`
        : `${path}/${item.name}`;
        
      return {
        ...item,
        type,
        icon,
        isFolder,
        extension,
        path: itemPath,
        created: item.created_at || new Date().toISOString(),
        size: item.metadata?.size || 0
      };
    });
  };
  
  // Update breadcrumbs from path
  const updateBreadcrumbs = (path) => {
    // Remove leading slash and split into segments
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    const segments = cleanPath.split('/');
    
    // Build breadcrumbs array
    const crumbs = segments.map((segment, index) => {
      const crumbPath = '/' + segments.slice(0, index + 1).join('/');
      return {
        name: segment || 'Home',
        path: crumbPath
      };
    });
    
    // Add root if path is not root
    if (cleanPath !== '') {
      crumbs.unshift({ name: 'Home', path: '/' });
    }
    
    setBreadcrumbs(crumbs);
  };
  
  // Navigate to a path
  const navigateTo = (path) => {
    // Save current path in back history
    setNavigationHistory(prev => ({
      back: [...prev.back, currentPath],
      forward: [] // Clear forward history on new navigation
    }));
    
    // Update current path
    setCurrentPath(path);
    setSelectedItem(null);
  };
  
  // Navigate back
  const navigateBack = () => {
    if (navigationHistory.back.length === 0) return;
    
    // Get last path from back history
    const prevPath = navigationHistory.back[navigationHistory.back.length - 1];
    
    // Update history
    setNavigationHistory(prev => ({
      back: prev.back.slice(0, -1),
      forward: [...prev.forward, currentPath]
    }));
    
    // Update current path
    setCurrentPath(prevPath);
    setSelectedItem(null);
  };
  
  // Navigate forward
  const navigateForward = () => {
    if (navigationHistory.forward.length === 0) return;
    
    // Get first path from forward history
    const nextPath = navigationHistory.forward[navigationHistory.forward.length - 1];
    
    // Update history
    setNavigationHistory(prev => ({
      back: [...prev.back, currentPath],
      forward: prev.forward.slice(0, -1)
    }));
    
    // Update current path
    setCurrentPath(nextPath);
    setSelectedItem(null);
  };
  
  // Navigate up one level
  const navigateUp = () => {
    // Get parent path
    const pathParts = currentPath.split('/').filter(Boolean);
    const parentPath = pathParts.length > 1 
      ? '/' + pathParts.slice(0, -1).join('/')
      : '/';
    
    // Navigate to parent
    navigateTo(parentPath);
  };
  
  // Handle double-click on item
  const handleItemDoubleClick = (item) => {
    if (item.isFolder) {
      // Navigate into folder
      navigateTo(item.path);
    } else {
      // Preview file
      handleFilePreview(item);
    }
  };
  
  // Handle single click on item
  const handleItemClick = (item, event) => {
    // Check if ctrl or shift key is pressed for multi-select (future feature)
    const isMultiSelect = event.ctrlKey || event.shiftKey;
    
    if (isMultiSelect) {
      // For now, just select the clicked item
      setSelectedItem(item);
    } else {
      setSelectedItem(item);
    }
    
    // Call onFileSelect if provided
    if (onFileSelect && !item.isFolder) {
      onFileSelect(item);
    }
  };
  
  // Handle file preview
  const handleFilePreview = async (item) => {
    try {
      // Get file URL for preview
      const { bucket, directory } = parsePath(currentPath);
      const { data: url, error } = await supabase
        .storage
        .from(bucket)
        .getPublicUrl(`${directory}/${item.name}`);
        
      if (error) throw error;
      
      // Set file preview
      setFilePreview({
        ...item,
        url: url.publicUrl
      });
    } catch (err) {
      console.error('Error generating preview URL:', err);
      setError('Failed to preview file');
    }
  };
  
  // Close file preview
  const closeFilePreview = () => {
    setFilePreview(null);
  };
  
  // Handle folder tree item click
  const handleTreeItemClick = (item) => {
    // Navigate to the folder
    navigateTo(item.path);
  };
  
  // Toggle expand/collapse folder in tree
  const toggleExpandFolder = async (item) => {
    // Check if already expanded
    if (expandedFolders.includes(item.path)) {
      // Collapse
      setExpandedFolders(prev => prev.filter(path => path !== item.path));
    } else {
      // Expand - load children if not already loaded
      if (item.children.length === 0) {
        try {
          // Parse path
          const { bucket, directory } = parsePath(item.path);
          
          // Get folder contents
          const { data, error } = await supabase
            .storage
            .from(bucket)
            .list(directory, { sortBy: { column: 'name', order: 'asc' } });
            
          if (error) throw error;
          
          // Filter for folders
          const folders = data.filter(child => child.id && !child.name.includes('.'));
          
          // Update folder tree
          const updatedTree = updateFolderTreeChildren(
            folderTree, 
            item.path, 
            folders.map(folder => ({
              id: `${item.path}/${folder.name}`,
              name: folder.name,
              type: 'folder',
              path: `${item.path}/${folder.name}`,
              children: []
            }))
          );
          
          setFolderTree(updatedTree);
        } catch (err) {
          console.error('Error loading subfolders:', err);
          setError('Failed to load subfolders');
        }
      }
      
      // Mark as expanded
      setExpandedFolders(prev => [...prev, item.path]);
    }
  };
  
  // Recursively update children for a folder in the tree
  const updateFolderTreeChildren = (tree, folderPath, children) => {
    return tree.map(node => {
      if (node.path === folderPath) {
        // This is the folder to update
        return { ...node, children };
      } else if (node.children.length > 0) {
        // Check children recursively
        return {
          ...node,
          children: updateFolderTreeChildren(node.children, folderPath, children)
        };
      } else {
        // No match, return unchanged
        return node;
      }
    });
  };
  
  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file selection for upload
  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      // Get current bucket and directory
      const { bucket, directory } = parsePath(currentPath);
      
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Create file path
        const filePath = directory 
          ? `${directory}/${file.name}`
          : file.name;
        
        // Set upload progress
        setUploadProgress({
          file: file.name,
          progress: 0,
          total: files.length,
          current: i + 1
        });
        
        // Upload file
        const { data, error } = await supabase
          .storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (error) throw error;
        
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          progress: ((i + 1) / files.length) * 100
        }));
      }
      
      // Clear file input
      event.target.value = null;
      
      // Clear upload progress
      setTimeout(() => {
        setUploadProgress(null);
      }, 1000);
      
      // Refresh contents
      loadContents();
    } catch (err) {
      console.error('Error uploading file:', err);
      setError(`Upload failed: ${err.message}`);
      setUploadProgress(null);
    }
  };
  
  // Handle file/folder deletion
  const handleDelete = async () => {
    if (!selectedItem) return;
    
    if (!confirm(`Are you sure you want to delete "${selectedItem.name}"?`)) {
      return;
    }
    
    try {
      // Parse path
      const { bucket, directory } = parsePath(currentPath);
      
      // Create file path
      const itemPath = directory 
        ? `${directory}/${selectedItem.name}`
        : selectedItem.name;
      
      if (selectedItem.isFolder) {
        // Deleting a folder: need to delete all contents first
        // This is a simplified approach - a full implementation would 
        // recursively delete subfolders
        
        // List all files in the folder
        const { data: folderContents, error: listError } = await supabase
          .storage
          .from(bucket)
          .list(`${itemPath}`);
          
        if (listError) throw listError;
        
        // Delete each file
        for (const item of folderContents) {
          const { error: deleteError } = await supabase
            .storage
            .from(bucket)
            .remove([`${itemPath}/${item.name}`]);
            
          if (deleteError) throw deleteError;
        }
        
        // Delete the empty folder
        const { error: deleteFolderError } = await supabase
          .storage
          .from(bucket)
          .remove([`${itemPath}/.emptyFolderPlaceholder`]);
          
        if (deleteFolderError && !deleteFolderError.message.includes('not found')) {
          throw deleteFolderError;
        }
      } else {
        // Delete single file
        const { error } = await supabase
          .storage
          .from(bucket)
          .remove([itemPath]);
          
        if (error) throw error;
      }
      
      // Clear selection
      setSelectedItem(null);
      
      // Refresh contents
      loadContents();
      
      // Update folder tree if needed
      if (selectedItem.isFolder) {
        await loadFolderTree();
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      setError(`Delete failed: ${err.message}`);
    }
  };
  
  // Handle creating new folder
  const handleCreateFolder = async () => {
    // Get folder name
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    try {
      // Parse path
      const { bucket, directory } = parsePath(currentPath);
      
      // Create folder path (folders in Supabase storage are just files with a special name)
      const folderPath = directory 
        ? `${directory}/${folderName}/.emptyFolderPlaceholder`
        : `${folderName}/.emptyFolderPlaceholder`;
      
      // Create an empty file in the folder path to represent the folder
      const { error } = await supabase
        .storage
        .from(bucket)
        .upload(folderPath, new Blob(['']));
        
      if (error) throw error;
      
      // Refresh contents
      loadContents();
      
      // Update folder tree
      await loadFolderTree();
    } catch (err) {
      console.error('Error creating folder:', err);
      setError(`Failed to create folder: ${err.message}`);
    }
  };
  
  // Handle download
  const handleDownload = async () => {
    if (!selectedItem || selectedItem.isFolder) return;
    
    try {
      // Parse path
      const { bucket, directory } = parsePath(currentPath);
      
      // Create file path
      const itemPath = directory 
        ? `${directory}/${selectedItem.name}`
        : selectedItem.name;
      
      // Get download URL
      const { data, error } = await supabase
        .storage
        .from(bucket)
        .download(itemPath);
        
      if (error) throw error;
      
      // Create download URL
      const url = URL.createObjectURL(data);
      
      // Create temporary link and click it
      const a = document.createElement('a');
      a.href = url;
      a.download = selectedItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Revoke URL
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Download failed: ${err.message}`);
    }
  };
  
  // Handle copy to clipboard
  const handleCopy = () => {
    if (!selectedItem) return;
    
    setClipboard({
      item: selectedItem,
      action: 'copy'
    });
  };
  
  // Handle cut to clipboard
  const handleCut = () => {
    if (!selectedItem) return;
    
    setClipboard({
      item: selectedItem,
      action: 'cut'
    });
  };
  
  // Handle paste from clipboard
  const handlePaste = async () => {
    if (!clipboard) return;
    
    try {
      // Parse paths
      const { bucket: sourceBucket, directory: sourceDirectory } = parsePath(clipboard.item.path);
      const { bucket: destBucket, directory: destDirectory } = parsePath(currentPath);
      
      // Source file path
      const sourcePath = sourceDirectory 
        ? `${sourceDirectory}/${clipboard.item.name}`
        : clipboard.item.name;
      
      // Destination file path
      const destPath = destDirectory 
        ? `${destDirectory}/${clipboard.item.name}`
        : clipboard.item.name;
      
      if (sourceBucket === destBucket) {
        // Copy within same bucket
        const { error } = await supabase
          .storage
          .from(sourceBucket)
          .copy(sourcePath, destPath);
          
        if (error) throw error;
        
        // If 'cut', delete original
        if (clipboard.action === 'cut') {
          const { error: deleteError } = await supabase
            .storage
            .from(sourceBucket)
            .remove([sourcePath]);
            
          if (deleteError) throw deleteError;
        }
      } else {
        // Cross-bucket copy not implemented in this simplified version
        throw new Error('Cross-bucket operations not supported');
      }
      
      // Clear clipboard for 'cut' operations
      if (clipboard.action === 'cut') {
        setClipboard(null);
      }
      
      // Refresh contents
      loadContents();
    } catch (err) {
      console.error('Error pasting item:', err);
      setError(`Paste failed: ${err.message}`);
    }
  };
  
  // Render folder tree items recursively
  const renderTreeItem = (item) => {
    const isExpanded = expandedFolders.includes(item.path);
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = currentPath === item.path;
    
    return (
      <div key={item.id} className="pl-2">
        <div 
          className={`flex items-center py-0.5 pr-2 ${
            isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'
          }`}
        >
          {/* Expand/collapse icon */}
          <button
            className="w-4 h-4 flex items-center justify-center"
            onClick={() => toggleExpandFolder(item)}
          >
            {hasChildren || item.type === 'bucket' ? (
              <ChevronRight 
                size={12} 
                className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            ) : (
              <div className="w-3" />
            )}
          </button>
          
          {/* Folder icon and name */}
          <div 
            className="flex items-center flex-grow pl-1 py-0.5"
            onClick={() => handleTreeItemClick(item)}
          >
            {item.type === 'bucket' ? (
              <HardDrive size={14} className="mr-1" />
            ) : (
              <Folder size={14} className="mr-1" />
            )}
            <span className="text-xs truncate">{item.name}</span>
          </div>
        </div>
        
        {/* Children */}
        {isExpanded && item.children && (
          <div className="pl-4 border-l border-gray-300 ml-1">
            {item.children.map(child => renderTreeItem(child))}
          </div>
        )}
      </div>
    );
  };
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date for display
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (err) {
      return dateStr;
    }
  };
  
  // Sort contents based on sort settings
  const sortedContents = [...contents].sort((a, b) => {
    // Folders always come first
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    
    // Then sort by the selected column
    let result = 0;
    
    switch (sortBy) {
      case 'name':
        result = a.name.localeCompare(b.name);
        break;
      case 'size':
        result = a.size - b.size;
        break;
      case 'type':
        result = a.extension?.localeCompare(b.extension || '');
        break;
      case 'date':
        result = new Date(a.created) - new Date(b.created);
        break;
      default:
        result = a.name.localeCompare(b.name);
    }
    
    // Apply sort direction
    return sortDirection === 'asc' ? result : -result;
  });
  
  // Handle sort change
  const handleSortChange = (column) => {
    if (sortBy === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Change column and reset direction to asc
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  return (
    <div 
      ref={explorerRef}
      className={`flex flex-col h-full ${className}`}
      style={{ backgroundColor: 'white' }}
    >
      {/* Toolbar */}
      <div 
        className="flex items-center px-2 py-1 border-b"
        style={{ backgroundColor: `#${bgColor}20` }}
      >
        {/* Navigation buttons */}
        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50"
          onClick={navigateBack}
          disabled={navigationHistory.back.length === 0}
          title="Back"
        >
          <ArrowUp size={16} className="transform rotate-270" />
        </button>
        
        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50"
          onClick={navigateForward}
          disabled={navigationHistory.forward.length === 0}
          title="Forward"
        >
          <ArrowUp size={16} className="transform rotate-90" />
        </button>
        
        <button
          className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-200"
          onClick={navigateUp}
          title="Up"
        >
          <ArrowUp size={16} />
        </button>
        
        <div className="border-r h-7 mx-2" />
        
        {/* View buttons */}
        <button
          className={`h-7 w-7 flex items-center justify-center rounded ${
            viewMode === 'icons' ? `bg-${borderColor}30` : 'hover:bg-gray-200'
          }`}
          onClick={() => setViewMode('icons')}
          title="Icons view"
        >
          <Grid size={16} />
        </button>
        
        <button
          className={`h-7 w-7 flex items-center justify-center rounded ${
            viewMode === 'details' ? `bg-${borderColor}30` : 'hover:bg-gray-200'
          }`}
          onClick={() => setViewMode('details')}
          title="Details view"
        >
          <List size={16} />
        </button>
        
        <div className="border-r h-7 mx-2" />
        
        {/* Action buttons */}
        {uploadEnabled && (
          <button
            className="h-7 px-2 flex items-center justify-center rounded hover:bg-gray-200"
            onClick={handleUploadClick}
            title="Upload file"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <Upload size={16} className="mr-1" />
            <span className="text-xs">Upload</span>
          </button>
        )}
        
        <button
          className="h-7 px-2 flex items-center justify-center rounded hover:bg-gray-200"
          onClick={handleCreateFolder}
          title="New folder"
        >
          <FolderOpen size={16} className="mr-1" />
          <span className="text-xs">New Folder</span>
        </button>
        
        <button
          className="h-7 px-2 flex items-center justify-center rounded hover:bg-gray-200 ml-auto"
          onClick={() => loadContents()}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      {/* Address bar */}
      <div 
        className="flex items-center px-2 py-1 border-b"
        style={{ backgroundColor: `#${bgColor}20` }}
      >
        <span className="text-xs mr-2">Address:</span>
        <div className="flex items-center flex-grow bg-white border rounded px-1 py-1">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={`crumb-${index}`}>
              {index > 0 && <ChevronRight size={10} className="mx-1" />}
              <button
                className="text-xs hover:underline"
                onClick={() => navigateTo(crumb.path)}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-grow flex overflow-hidden">
        {/* Folder tree */}
        <div 
          className="w-48 border-r overflow-y-auto"
          style={{ backgroundColor: 'white' }}
        >
          <div className="p-2 text-xs font-bold border-b">Folders</div>
          <div>
            {folderTree.map(item => renderTreeItem(item))}
          </div>
        </div>
        
        {/* Files and folders */}
        <div className="flex-grow flex flex-col">
          {/* Content area */}
          <div className="flex-grow overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw size={18} className="animate-spin mr-2" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-50 text-red-600 p-4 rounded max-w-lg">
                  <div className="font-bold">Error</div>
                  <div>{error}</div>
                </div>
              </div>
            ) : contents.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FolderOpen size={24} className="mx-auto mb-2" />
                  <div>This folder is empty</div>
                </div>
              </div>
            ) : viewMode === 'icons' ? (
              // Icons view
              <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {sortedContents.map((item) => (
                  <div
                    key={item.id || item.name}
                    className={`flex flex-col items-center p-2 rounded-md cursor-pointer ${
                      selectedItem?.name === item.name 
                        ? 'bg-blue-100' 
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={(e) => handleItemClick(item, e)}
                    onDoubleClick={() => handleItemDoubleClick(item)}
                  >
                    <div className="w-12 h-12 flex items-center justify-center mb-1">
                      {item.isFolder ? (
                        <FolderOpen size={32} className="text-yellow-500" />
                      ) : (
                        item.icon ? React.cloneElement(item.icon, { size: 32 }) : <File size={32} />
                      )}
                    </div>
                    <div className="text-xs text-center truncate w-full">{item.name}</div>
                  </div>
                ))}
              </div>
            ) : (
              // Details view
              <div className="w-full overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 text-left">
                      <th 
                        className="p-2 text-xs font-semibold cursor-pointer select-none"
                        onClick={() => handleSortChange('name')}
                      >
                        Name
                        {sortBy === 'name' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </th>
                      <th 
                        className="p-2 text-xs font-semibold cursor-pointer select-none"
                        onClick={() => handleSortChange('type')}
                      >
                        Type
                        {sortBy === 'type' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </th>
                      <th 
                        className="p-2 text-xs font-semibold cursor-pointer select-none"
                        onClick={() => handleSortChange('size')}
                      >
                        Size
                        {sortBy === 'size' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </th>
                      <th 
                        className="p-2 text-xs font-semibold cursor-pointer select-none"
                        onClick={() => handleSortChange('date')}
                      >
                        Date Modified
                        {sortBy === 'date' && (
                          <span className="ml-1">
                            {sortDirection === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedContents.map((item) => (
                      <tr 
                        key={item.id || item.name}
                        className={`border-t cursor-pointer ${
                          selectedItem?.name === item.name 
                            ? 'bg-blue-100' 
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={(e) => handleItemClick(item, e)}
                        onDoubleClick={() => handleItemDoubleClick(item)}
                      >
                        <td className="p-2 text-xs">
                          <div className="flex items-center">
                            {item.isFolder ? (
                              <FolderOpen size={16} className="text-yellow-500 mr-2" />
                            ) : (
                              <span className="mr-2">{item.icon}</span>
                            )}
                            {item.name}
                          </div>
                        </td>
                        <td className="p-2 text-xs">
                          {item.isFolder ? 'Folder' : (item.extension ? `.${item.extension}` : 'File')}
                        </td>
                        <td className="p-2 text-xs">
                          {item.isFolder ? '-' : formatFileSize(item.size)}
                        </td>
                        <td className="p-2 text-xs">
                          {formatDate(item.created)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Status bar */}
          <div 
            className="flex items-center px-2 py-1 text-xs border-t"
            style={{ backgroundColor: `#${bgColor}20` }}
          >
            {uploadProgress ? (
              <div className="flex items-center flex-grow">
                <div className="mr-2">Uploading: {uploadProgress.file}</div>
                <div className="w-48 h-3 bg-gray-200 rounded-full">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${uploadProgress.progress}%`,
                      backgroundColor: `#${borderColor}`
                    }}
                  ></div>
                </div>
                <div className="ml-2">{uploadProgress.current} of {uploadProgress.total}</div>
              </div>
            ) : selectedItem ? (
              <div>Selected: {selectedItem.name}</div>
            ) : (
              <div>{contents.length} items</div>
            )}
          </div>
        </div>
      </div>
      
      {/* File preview modal */}
      {filePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-5xl max-h-[90vh] w-full overflow-hidden flex flex-col">
            <div 
              className="flex items-center justify-between p-2"
              style={{ backgroundColor: `#${borderColor}` }}
            >
              <div className="text-white font-medium truncate">{filePreview.name}</div>
              <button 
                className="h-6 w-6 flex items-center justify-center rounded hover:bg-white hover:bg-opacity-20 text-white"
                onClick={closeFilePreview}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-grow overflow-auto p-4">
              {filePreview.type === 'image' ? (
                <img 
                  src={filePreview.url} 
                  alt={filePreview.name} 
                  className="max-w-full max-h-[70vh] mx-auto"
                />
              ) : filePreview.type === 'document' || filePreview.type === 'code' ? (
                <div className="bg-gray-100 p-4 rounded h-[70vh] overflow-auto">
                  <pre className="whitespace-pre-wrap">
                    {/* Would need to fetch and display text content */}
                    <code>Cannot display content for this file type.</code>
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText size={48} className="mb-4 text-gray-400" />
                  <div className="text-center">
                    <p>Preview not available for this file type.</p>
                    <a 
                      href={filePreview.url} 
                      download={filePreview.name}
                      className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Download File
                    </a>
                  </div>
                </div>
              )}
            </div>
            <div 
              className="flex items-center justify-between p-2 text-xs"
              style={{ backgroundColor: `#${bgColor}20` }}
            >
              <div>Type: {filePreview.type} ({filePreview.extension})</div>
              <div>Size: {formatFileSize(filePreview.size)}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Context menu (right click) - simplified, would need the ContextMenu component */}
      {/* Would implement drag-and-drop functionality here */}
    </div>
  );
}