'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import {
  FolderOpen, FileText, ArrowUp, RefreshCw, List, Grid,
  ChevronRight, ChevronDown, Search, HardDrive, Home,
  Folder, File, Check, X, Upload, MoreHorizontal, Trash2,
  Copy, Clipboard, Download, Eye, Edit, FolderPlus, FilePlus
} from 'lucide-react';
import { useContextMenu } from '@/components/windows/ContextMenu';

/**
 * FileExplorer - A Windows 2000 style file explorer for browsing uploads
 * 
 * Features:
 * - Tree view of folders
 * - File preview
 * - Upload and manage files
 * - List and grid view modes
 * - Breadcrumb navigation
 * - Context menus
 * - Windows 2000 styling
 */
export default function FileExplorer({ theme = {} }) {
  const [currentPath, setCurrentPath] = useState('/');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'icons'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'size', 'type'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' or 'desc'
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [clipboard, setClipboard] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const fileInputRef = useRef(null);
  const { showContextMenu } = useContextMenu();
  const router = useRouter();
  
  // Mock folder structure for demo
  const mockFolders = [
    { id: 'documents', name: 'Documents', path: '/documents', parent: '/' },
    { id: 'pictures', name: 'Pictures', path: '/pictures', parent: '/' },
    { id: 'music', name: 'Music', path: '/music', parent: '/' },
    { id: 'downloads', name: 'Downloads', path: '/downloads', parent: '/' },
    { id: 'documents/work', name: 'Work', path: '/documents/work', parent: '/documents' },
    { id: 'documents/personal', name: 'Personal', path: '/documents/personal', parent: '/documents' },
    { id: 'pictures/vacation', name: 'Vacation', path: '/pictures/vacation', parent: '/pictures' },
    { id: 'pictures/family', name: 'Family', path: '/pictures/family', parent: '/pictures' },
  ];

  // Mock files for demo
  const mockFiles = [
    { id: 'file1', name: 'Resume.docx', path: '/documents/Resume.docx', parent: '/documents', type: 'document', size: 240000, lastModified: '2023-10-15T10:30:00Z' },
    { id: 'file2', name: 'Budget.xlsx', path: '/documents/Budget.xlsx', parent: '/documents', type: 'spreadsheet', size: 156000, lastModified: '2023-09-22T14:45:00Z' },
    { id: 'file3', name: 'Beach.jpg', path: '/pictures/Beach.jpg', parent: '/pictures', type: 'image', size: 2400000, lastModified: '2023-08-05T09:15:00Z' },
    { id: 'file4', name: 'Mountains.jpg', path: '/pictures/Mountains.jpg', parent: '/pictures', type: 'image', size: 3200000, lastModified: '2023-07-12T16:20:00Z' },
    { id: 'file5', name: 'Notes.txt', path: '/documents/Notes.txt', parent: '/documents', type: 'text', size: 5000, lastModified: '2023-11-01T11:10:00Z' },
    { id: 'file6', name: 'Song.mp3', path: '/music/Song.mp3', parent: '/music', type: 'audio', size: 5600000, lastModified: '2023-06-30T08:00:00Z' },
    { id: 'file7', name: 'Presentation.pptx', path: '/documents/work/Presentation.pptx', parent: '/documents/work', type: 'presentation', size: 4200000, lastModified: '2023-10-10T13:25:00Z' },
    { id: 'file8', name: 'Family_Photo.jpg', path: '/pictures/family/Family_Photo.jpg', parent: '/pictures/family', type: 'image', size: 1800000, lastModified: '2023-05-20T17:40:00Z' },
  ];

  // Load files and folders
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, you would fetch from Supabase or another backend
        // For now, use the mock data
        setTimeout(() => {
          setFolders(mockFolders);
          setFiles(mockFiles);
          setLoading(false);
        }, 500); // Simulate loading time
      } catch (err) {
        console.error('Error loading files:', err);
        setError('Failed to load files and folders');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Navigate to a folder
  const navigateToFolder = (path) => {
    setCurrentPath(path);
    setSelectedItem(null);
    setPreviewFile(null);
  };
  
  // Go up one directory
  const goUp = () => {
    if (currentPath === '/') return;
    
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.length === 0 ? '/' : `/${parts.join('/')}`;
    navigateToFolder(newPath);
  };
  
  // Toggle expanded state of folder in tree view
  const toggleFolderExpanded = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  // Get files in current directory
  const getCurrentFiles = () => {
    let filteredFiles = files.filter(file => file.parent === currentPath);
    
    // Apply search filter if needed
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredFiles = filteredFiles.filter(file => 
        file.name.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filteredFiles.sort((a, b) => {
      let result = 0;
      
      switch (sortBy) {
        case 'name':
          result = a.name.localeCompare(b.name);
          break;
        case 'date':
          result = new Date(a.lastModified) - new Date(b.lastModified);
          break;
        case 'size':
          result = a.size - b.size;
          break;
        case 'type':
          result = a.type.localeCompare(b.type);
          break;
        default:
          result = a.name.localeCompare(b.name);
      }
      
      return sortDirection === 'asc' ? result : -result;
    });
    
    return filteredFiles;
  };
  
  // Get folders in current directory
  const getCurrentFolders = () => {
    let filteredFolders = folders.filter(folder => folder.parent === currentPath);
    
    // Apply search filter if needed
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredFolders = filteredFolders.filter(folder => 
        folder.name.toLowerCase().includes(term)
      );
    }
    
    // Sort folders by name (folders always sort by name)
    filteredFolders.sort((a, b) => 
      sortDirection === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name)
    );
    
    return filteredFolders;
  };
  
  // Calculate breadcrumb path segments
  const getBreadcrumbSegments = () => {
    const segments = [{ name: 'My Computer', path: '/' }];
    
    if (currentPath === '/') {
      return segments;
    }
    
    const parts = currentPath.split('/').filter(Boolean);
    let currentSegmentPath = '';
    
    parts.forEach(part => {
      currentSegmentPath += `/${part}`;
      segments.push({
        name: part,
        path: currentSegmentPath
      });
    });
    
    return segments;
  };
  
  // Format file size to human readable format
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Get file icon based on type
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <File className="text-blue-500" />;
      case 'document':
        return <File className="text-blue-600" />;
      case 'spreadsheet':
        return <File className="text-green-600" />;
      case 'presentation':
        return <File className="text-orange-500" />;
      case 'audio':
        return <File className="text-purple-500" />;
      case 'video':
        return <File className="text-red-500" />;
      case 'text':
        return <FileText className="text-gray-600" />;
      default:
        return <File className="text-gray-500" />;
    }
  };
  
  // Get parent folder structure for tree view
  const getParentFolders = () => {
    return folders.filter(folder => folder.parent === '/');
  };
  
  // Get child folders for a parent folder in tree view
  const getChildFolders = (parentPath) => {
    return folders.filter(folder => folder.parent === parentPath);
  };
  
  // Handle upload button click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file selection for upload
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 200);
    
    // Simulate upload completion
    setTimeout(() => {
      clearInterval(interval);
      setUploadProgress(100);
      
      // Add the uploaded file to the list
      const newFiles = Array.from(files).map((file, index) => ({
        id: `uploaded-${Date.now()}-${index}`,
        name: file.name,
        path: `${currentPath}/${file.name}`,
        parent: currentPath,
        type: getFileTypeFromName(file.name),
        size: file.size,
        lastModified: new Date().toISOString()
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
      
      // Reset upload state
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
    }, 3000);
  };
  
  // Get file type from file name
  const getFileTypeFromName = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const typeMap = {
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
      bmp: 'image',
      doc: 'document',
      docx: 'document',
      pdf: 'document',
      xls: 'spreadsheet',
      xlsx: 'spreadsheet',
      ppt: 'presentation',
      pptx: 'presentation',
      mp3: 'audio',
      wav: 'audio',
      ogg: 'audio',
      mp4: 'video',
      avi: 'video',
      mov: 'video',
      txt: 'text',
      csv: 'text',
      json: 'text',
      xml: 'text',
      html: 'text',
      css: 'text',
      js: 'text'
    };
    
    return typeMap[extension] || 'unknown';
  };
  
  // Handle item selection
  const handleItemClick = (item, isFolder) => {
    if (isFolder) {
      navigateToFolder(item.path);
    } else {
      setSelectedItem(item);
      setPreviewFile(item);
    }
  };
  
  // Handle double click on item
  const handleItemDoubleClick = (item, isFolder) => {
    if (isFolder) {
      navigateToFolder(item.path);
    } else {
      setPreviewFile(item);
      // In a real app, you might open a preview window or download the file
    }
  };
  
  // Create a new folder
  const createNewFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;
    
    const newFolder = {
      id: `folder-${Date.now()}`,
      name: folderName,
      path: `${currentPath}/${folderName}`,
      parent: currentPath
    };
    
    setFolders(prev => [...prev, newFolder]);
  };
  
  // Create a new file
  const createNewFile = () => {
    const fileName = prompt('Enter file name:');
    if (!fileName) return;
    
    const newFile = {
      id: `file-${Date.now()}`,
      name: fileName,
      path: `${currentPath}/${fileName}`,
      parent: currentPath,
      type: getFileTypeFromName(fileName),
      size: 0,
      lastModified: new Date().toISOString()
    };
    
    setFiles(prev => [...prev, newFile]);
  };
  
  // Delete selected item
  const deleteSelectedItem = () => {
    if (!selectedItem) return;
    
    if (confirm(`Are you sure you want to delete ${selectedItem.name}?`)) {
      if (selectedItem.type) {
        // It's a file
        setFiles(prev => prev.filter(file => file.id !== selectedItem.id));
      } else {
        // It's a folder
        setFolders(prev => prev.filter(folder => folder.id !== selectedItem.id));
        // Also delete all files and subfolders inside
        setFiles(prev => prev.filter(file => !file.path.startsWith(selectedItem.path)));
        setFolders(prev => prev.filter(folder => !folder.path.startsWith(selectedItem.path)));
      }
      
      setSelectedItem(null);
      setPreviewFile(null);
    }
  };
  
  // Copy selected item to clipboard
  const copySelectedItem = () => {
    if (selectedItem) {
      setClipboard({
        action: 'copy',
        item: selectedItem
      });
    }
  };
  
  // Cut selected item to clipboard
  const cutSelectedItem = () => {
    if (selectedItem) {
      setClipboard({
        action: 'cut',
        item: selectedItem
      });
    }
  };
  
  // Paste item from clipboard
  const pasteFromClipboard = () => {
    if (!clipboard) return;
    
    const { action, item } = clipboard;
    
    if (item.type) {
      // It's a file
      const newFile = {
        ...item,
        id: `file-${Date.now()}`,
        parent: currentPath,
        path: `${currentPath}/${item.name}`,
        lastModified: new Date().toISOString()
      };
      
      setFiles(prev => [...prev, newFile]);
      
      if (action === 'cut') {
        // Remove the original file
        setFiles(prev => prev.filter(file => file.id !== item.id));
        // Clear clipboard
        setClipboard(null);
      }
    } else {
      // It's a folder
      // This is more complex because we need to recreate the folder structure
      // For simplicity, just create a copy of the folder
      const newFolder = {
        ...item,
        id: `folder-${Date.now()}`,
        parent: currentPath,
        path: `${currentPath}/${item.name}`
      };
      
      setFolders(prev => [...prev, newFolder]);
      
      if (action === 'cut') {
        // Remove the original folder
        setFolders(prev => prev.filter(folder => folder.id !== item.id));
        // Also move all files and subfolders inside
        // This is simplified and doesn't handle nested folders properly
        setFiles(prev => prev.map(file => {
          if (file.parent === item.path) {
            return {
              ...file,
              parent: newFolder.path,
              path: file.path.replace(item.path, newFolder.path)
            };
          }
          return file;
        }));
        
        // Clear clipboard
        setClipboard(null);
      }
    }
  };
  
  // Show context menu for background (empty space)
  const handleBackgroundContextMenu = (e) => {
    e.preventDefault();
    showContextMenu(e, 'explorer-background', {
      path: currentPath,
      onCreateFolder: createNewFolder,
      onCreateFile: createNewFile,
      onPaste: clipboard ? pasteFromClipboard : null
    });
  };
  
  // Show context menu for item
  const handleItemContextMenu = (e, item, isFolder) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Select the item first
    setSelectedItem(item);
    
    showContextMenu(e, isFolder ? 'explorer-folder' : 'explorer-file', {
      item,
      onOpen: () => handleItemDoubleClick(item, isFolder),
      onDelete: () => deleteSelectedItem(),
      onCopy: () => copySelectedItem(),
      onCut: () => cutSelectedItem(),
      onRename: () => {/* Implement rename */}
    });
  };
  
  // Render tree view folder
  const renderTreeFolder = (folder, depth = 0) => {
    const isExpanded = expandedFolders[folder.id];
    const hasChildren = getChildFolders(folder.path).length > 0;
    const isActive = currentPath === folder.path;
    
    return (
      <div key={folder.id} className="select-none">
        <div 
          className={`flex items-center py-1 hover:bg-gray-200 ${isActive ? 'bg-blue-100' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => navigateToFolder(folder.path)}
        >
          {hasChildren ? (
            <button
              className="w-4 h-4 flex items-center justify-center mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpanded(folder.id);
              }}
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
          ) : (
            <div className="w-4 h-4 mr-1"></div>
          )}
          
          <Folder className="w-4 h-4 mr-1 text-yellow-500" />
          <span className="text-sm truncate">{folder.name}</span>
        </div>
        
        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div>
            {getChildFolders(folder.path).map(childFolder => 
              renderTreeFolder(childFolder, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Render file preview
  const renderFilePreview = () => {
    if (!previewFile) return null;
    
    return (
      <div className="border-l border-gray-300 bg-gray-50 p-4 w-1/3 overflow-auto">
        <div className="mb-4 pb-2 border-b border-gray-300">
          <h3 className="font-semibold text-lg mb-1">{previewFile.name}</h3>
          <div className="flex items-center text-sm text-gray-600">
            {getFileIcon(previewFile.type)}
            <span className="ml-2">{previewFile.type.charAt(0).toUpperCase() + previewFile.type.slice(1)} file</span>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-600">Size:</div>
            <div>{formatFileSize(previewFile.size)}</div>
            
            <div className="text-gray-600">Modified:</div>
            <div>{formatDate(previewFile.lastModified)}</div>
            
            <div className="text-gray-600">Location:</div>
            <div className="truncate">{previewFile.parent}</div>
          </div>
        </div>
        
        {/* Preview content based on file type */}
        <div className="mt-4">
          {previewFile.type === 'image' ? (
            <div className="bg-gray-100 rounded border p-2 flex items-center justify-center">
              <div className="text-center text-gray-500 text-sm">
                [Image Preview]
              </div>
            </div>
          ) : previewFile.type === 'text' ? (
            <div className="bg-white rounded border p-2 h-48 overflow-y-auto">
              <div className="text-center text-gray-500 text-sm">
                [Text Content Preview]
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm mt-4">
              Preview not available for this file type.
            </div>
          )}
        </div>
        
        <div className="mt-4 flex space-x-2">
          <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
            <Download size={14} className="inline-block mr-1" />
            Download
          </button>
          
          <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
            <Edit size={14} className="inline-block mr-1" />
            Edit
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-gray-200 border-b border-gray-300 p-1 flex items-center">
        <button 
          className="px-2 py-1 text-sm rounded hover:bg-gray-300 flex items-center"
          onClick={goUp}
          disabled={currentPath === '/'}
        >
          <ArrowUp size={16} className="mr-1" />
          Up
        </button>
        
        <div className="border-r border-gray-400 h-6 mx-2"></div>
        
        <button className="px-2 py-1 text-sm rounded hover:bg-gray-300 flex items-center">
          <RefreshCw size={16} className="mr-1" />
          Refresh
        </button>
        
        <div className="border-r border-gray-400 h-6 mx-2"></div>
        
        <div className="flex items-center">
          <button 
            className={`px-2 py-1 text-sm rounded hover:bg-gray-300 flex items-center ${viewMode === 'list' ? 'bg-gray-300' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} className="mr-1" />
            List
          </button>
          
          <button 
            className={`px-2 py-1 text-sm rounded hover:bg-gray-300 flex items-center ml-1 ${viewMode === 'icons' ? 'bg-gray-300' : ''}`}
            onClick={() => setViewMode('icons')}
          >
            <Grid size={16} className="mr-1" />
            Icons
          </button>
        </div>
        
        <div className="border-r border-gray-400 h-6 mx-2"></div>
        
        <div className="relative">
          <Search size={16} className="absolute left-2 top-1.5 text-gray-500" />
          <input 
            type="text" 
            className="bg-white border border-gray-400 rounded px-2 py-1 pl-7 text-sm w-48"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="ml-auto flex items-center">
          <button 
            className="px-2 py-1 text-sm rounded hover:bg-gray-300 flex items-center"
            onClick={handleUploadClick}
          >
            <Upload size={16} className="mr-1" />
            Upload
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
            multiple
          />
        </div>
      </div>
      
      {/* Address Bar */}
      <div className="bg-white border-b border-gray-300 p-1 flex items-center">
        <div className="text-sm mr-2">Address:</div>
        <div className="flex items-center bg-white border border-gray-400 rounded px-2 py-1 flex-1">
          {getBreadcrumbSegments().map((segment, index, segments) => (
            <React.Fragment key={segment.path}>
              <button 
                className="hover:underline text-blue-600 text-sm"
                onClick={() => navigateToFolder(segment.path)}
              >
                {segment.name}
              </button>
              {index < segments.length - 1 && (
                <span className="mx-1 text-gray-500">\</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (Tree View) */}
        <div className="w-1/4 border-r border-gray-300 overflow-auto bg-gray-100">
          <div className="p-2">
            <div className="text-sm font-medium mb-2">Folders</div>
            
            {/* Root node */}
            <div 
              className={`flex items-center py-1 hover:bg-gray-200 ${currentPath === '/' ? 'bg-blue-100' : ''}`}
              onClick={() => navigateToFolder('/')}
            >
              <HardDrive className="w-4 h-4 mr-1 text-blue-500" />
              <span className="text-sm">My Computer</span>
            </div>
            
            {/* Folder tree */}
            {getParentFolders().map(folder => renderTreeFolder(folder))}
          </div>
        </div>
        
        {/* Main Content (Files and Folders) */}
        <div 
          className={`flex-1 overflow-auto ${previewFile ? 'w-2/3' : 'w-full'}`}
          onContextMenu={handleBackgroundContextMenu}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4">{error}</div>
          ) : (
            <div className="p-2">
              {/* Files and folders view */}
              {viewMode === 'list' ? (
                <div className="border border-gray-300">
                  {/* Headers */}
                  <div className="flex bg-gray-200 border-b border-gray-300 text-sm font-medium">
                    <div className="w-6"></div>
                    <div 
                      className="flex-1 p-1 cursor-pointer hover:bg-gray-300 flex items-center"
                      onClick={() => {
                        if (sortBy === 'name') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('name');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      Name
                      {sortBy === 'name' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                    <div 
                      className="w-24 p-1 cursor-pointer hover:bg-gray-300 flex items-center"
                      onClick={() => {
                        if (sortBy === 'type') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('type');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      Type
                      {sortBy === 'type' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                    <div 
                      className="w-24 p-1 cursor-pointer hover:bg-gray-300 flex items-center"
                      onClick={() => {
                        if (sortBy === 'size') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('size');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      Size
                      {sortBy === 'size' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                    <div 
                      className="w-40 p-1 cursor-pointer hover:bg-gray-300 flex items-center"
                      onClick={() => {
                        if (sortBy === 'date') {
                          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('date');
                          setSortDirection('asc');
                        }
                      }}
                    >
                      Modified
                      {sortBy === 'date' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Folders */}
                  {getCurrentFolders().map(folder => (
                    <div 
                      key={folder.id}
                      className={`flex items-center border-b border-gray-200 hover:bg-blue-50 ${selectedItem?.id === folder.id ? 'bg-blue-100' : ''}`}
                      onClick={() => handleItemClick(folder, true)}
                      onDoubleClick={() => handleItemDoubleClick(folder, true)}
                      onContextMenu={(e) => handleItemContextMenu(e, folder, true)}
                    >
                      <div className="w-6 flex justify-center py-1">
                        <Folder className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="flex-1 py-1 px-1 truncate">{folder.name}</div>
                      <div className="w-24 py-1 px-1">Folder</div>
                      <div className="w-24 py-1 px-1">-</div>
                      <div className="w-40 py-1 px-1">-</div>
                    </div>
                  ))}
                  
                  {/* Files */}
                  {getCurrentFiles().map(file => (
                    <div 
                      key={file.id}
                      className={`flex items-center border-b border-gray-200 hover:bg-blue-50 ${selectedItem?.id === file.id ? 'bg-blue-100' : ''}`}
                      onClick={() => handleItemClick(file, false)}
                      onDoubleClick={() => handleItemDoubleClick(file, false)}
                      onContextMenu={(e) => handleItemContextMenu(e, file, false)}
                    >
                      <div className="w-6 flex justify-center py-1">
                        {getFileIcon(file.type)}
                      </div>
                      <div className="flex-1 py-1 px-1 truncate">{file.name}</div>
                      <div className="w-24 py-1 px-1">{file.type.charAt(0).toUpperCase() + file.type.slice(1)}</div>
                      <div className="w-24 py-1 px-1">{formatFileSize(file.size)}</div>
                      <div className="w-40 py-1 px-1">{formatDate(file.lastModified)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {/* Folders */}
                  {getCurrentFolders().map(folder => (
                    <div 
                      key={folder.id}
                      className={`flex flex-col items-center p-2 rounded hover:bg-blue-50 ${selectedItem?.id === folder.id ? 'bg-blue-100' : ''}`}
                      onClick={() => handleItemClick(folder, true)}
                      onDoubleClick={() => handleItemDoubleClick(folder, true)}
                      onContextMenu={(e) => handleItemContextMenu(e, folder, true)}
                    >
                      <Folder className="w-12 h-12 text-yellow-500" />
                      <div className="text-center mt-1 w-full truncate text-sm">{folder.name}</div>
                    </div>
                  ))}
                  
                  {/* Files */}
                  {getCurrentFiles().map(file => (
                    <div 
                      key={file.id}
                      className={`flex flex-col items-center p-2 rounded hover:bg-blue-50 ${selectedItem?.id === file.id ? 'bg-blue-100' : ''}`}
                      onClick={() => handleItemClick(file, false)}
                      onDoubleClick={() => handleItemDoubleClick(file, false)}
                      onContextMenu={(e) => handleItemContextMenu(e, file, false)}
                    >
                      {getFileIcon(file.type)}
                      <div className="text-center mt-1 w-full truncate text-sm">{file.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Preview Panel */}
        {previewFile && renderFilePreview()}
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-200 border-t border-gray-300 py-1 px-2 text-xs flex items-center">
        <div>
          {getCurrentFolders().length} folder(s), {getCurrentFiles().length} file(s)
        </div>
        
        {uploading && (
          <div className="ml-4 flex items-center flex-1">
            <div className="mr-2">Uploading:</div>
            <div className="flex-1 bg-gray-300 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <div className="ml-2">{uploadProgress}%</div>
          </div>
        )}
      </div>
    </div>
  );
}