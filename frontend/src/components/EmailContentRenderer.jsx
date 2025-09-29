import React from 'react';

// Component to safely render email content
const EmailContentRenderer = ({ content }) => {
  if (!content) return <div className="text-gray-500">No content available</div>;

  // Function to clean HTML and convert to readable text
  const cleanHTMLContent = (htmlContent) => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    // Remove script and style tags completely
    const scripts = tempDiv.querySelectorAll('script, style');
    scripts.forEach(el => el.remove());

    // Convert common HTML elements to readable format
    const elements = tempDiv.querySelectorAll('*');
    elements.forEach(el => {
      switch (el.tagName.toLowerCase()) {
        case 'br':
          el.replaceWith('\n');
          break;
        case 'p':
        case 'div':
          // Add line break after block elements
          el.insertAdjacentText('afterend', '\n');
          break;
        case 'a':
          // Show link text and URL
          const href = el.getAttribute('href');
          if (href && href !== el.textContent) {
            el.textContent = `${el.textContent} (${href})`;
          }
          break;
        case 'img':
          // Replace images with alt text or indication
          const alt = el.getAttribute('alt') || '[Image]';
          el.replaceWith(alt);
          break;
        default:
          // Keep text content of other elements
          break;
      }
    });

    // Get clean text content
    let cleanText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up excessive whitespace and normalize line breaks
    cleanText = cleanText
      .replace(/\n\s*\n/g, '\n\n') // Replace multiple line breaks with double line breaks
      .replace(/[ \t]+/g, ' ') // Replace multiple spaces/tabs with single space
      .trim();

    return cleanText;
  };

  // Check if content is HTML (contains HTML tags)
  const isHTML = /<[^>]*>/.test(content);

  if (isHTML) {
    const cleanedContent = cleanHTMLContent(content);
    return (
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
        {cleanedContent}
      </div>
    );
  } else {
    // If it's plain text, just display it with proper formatting
    const formattedContent = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();
    
    return (
      <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
        {formattedContent}
      </div>
    );
  }
};

export default EmailContentRenderer;