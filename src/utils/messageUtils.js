/**
 * Utility functions for message handling in the messaging component
 */

/**
 * Converts an image file to WebP format for better compression
 * @param {File} file - The image file to convert
 * @returns {Promise<File>} - A promise that resolves to the converted file
 */
export const convertToWebP = (file) => {
    return new Promise((resolve, reject) => {
        // Skip if file is already WebP or SVG
        if (file.type.includes('webp') || file.type.includes('svg')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Check if WebP is supported
                if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
                    // Convert to WebP (0.8 quality gives good balance)
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            resolve(file); // Fallback to original if conversion fails
                            return;
                        }

                        // Create new file from blob
                        const webpFile = new File(
                            [blob],
                            file.name.replace(/\.(jpe?g|png|gif)$/i, '.webp'),
                            { type: 'image/webp' }
                        );
                        resolve(webpFile);
                    }, 'image/webp', 0.8);
                } else {
                    resolve(file); // WebP not supported, use original
                }
            };
            img.onerror = () => {
                reject(new Error("Failed to load image for conversion"));
            };
            img.src = event.target.result;
        };
        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
    });
};

/**
 * Checks if a message content contains an image
 * @param {string} content - The message content
 * @returns {boolean} - True if the content contains an image
 */
export const hasImageUrl = (content) => {
    return content.includes('📷 [Image]');
};

/**
 * Extracts the image URL from a message content
 * @param {string} content - The message content
 * @returns {string|null} - The image URL or null if not found
 */
export const extractImageUrl = (content) => {
    if (hasImageUrl(content)) {
        // Split by || separator and get the last part which is the URL
        const parts = content.split('||');
        if (parts.length > 1) {
            return parts[parts.length - 1].trim();
        }
        return null;
    }
    return null;
};

/**
 * Extracts the text portion from a message with an image
 * @param {string} content - The message content
 * @returns {string} - The text portion of the message
 */
export const extractMessageText = (content) => {
    if (hasImageUrl(content)) {
        const parts = content.split('||');
        if (parts.length > 2) {
            return parts[1].trim();
        }
        return '';
    }
    return content;
};

/**
 * Formats bytes to a human-readable form
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - The number of decimal places
 * @returns {string} - The formatted string
 */
export const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};