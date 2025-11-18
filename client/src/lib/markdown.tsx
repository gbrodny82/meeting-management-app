import React, { ReactElement } from 'react';

interface MarkdownItem {
  type: 'h3' | 'h4' | 'li' | 'p' | 'br';
  key: string;
  content: string | string[];
  className: string;
  hasBold?: boolean;
  hasHighlight?: boolean;
}

// Markers for text highlighting
const HIGHLIGHT_START_MARKER = '[[[HL]]]';
const HIGHLIGHT_END_MARKER = '[[[/HL]]]';

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to inject highlighting markers around a text excerpt
export function injectHighlightMarkers(text: string, excerpt: string): string {
  if (!excerpt || !text) return text;
  
  // Find the first occurrence of the excerpt in the text (case insensitive)
  const lowerText = text.toLowerCase();
  const lowerExcerpt = excerpt.toLowerCase();
  const index = lowerText.indexOf(lowerExcerpt);
  
  if (index === -1) return text;
  
  // Inject markers around the found text
  const before = text.substring(0, index);
  const highlighted = text.substring(index, index + excerpt.length);
  const after = text.substring(index + excerpt.length);
  
  return `${before}${HIGHLIGHT_START_MARKER}${highlighted}${HIGHLIGHT_END_MARKER}${after}`;
}

export function formatMarkdownToJSX(text: string): MarkdownItem[] {
  if (!text || text.trim() === '') return [];
  
  return text
    .split('\n')
    .map((line, index) => {
      const key = `line-${index}`;
      
      if (line.startsWith('# ')) {
        const content = line.substring(2);
        const hasHighlight = content.includes(HIGHLIGHT_START_MARKER);
        return {
          type: 'h3',
          key,
          content: hasHighlight ? content.split(new RegExp(`(${escapeRegExp(HIGHLIGHT_START_MARKER)}.*?${escapeRegExp(HIGHLIGHT_END_MARKER)})`)) : content,
          className: 'text-lg font-bold text-gray-800 mt-4 mb-2 first:mt-0',
          hasHighlight
        };
      }
      
      if (line.startsWith('## ')) {
        const content = line.substring(3);
        const hasHighlight = content.includes(HIGHLIGHT_START_MARKER);
        return {
          type: 'h4',
          key,
          content: hasHighlight ? content.split(new RegExp(`(${escapeRegExp(HIGHLIGHT_START_MARKER)}.*?${escapeRegExp(HIGHLIGHT_END_MARKER)})`)) : content,
          className: 'text-base font-bold text-gray-700 mt-3 mb-2 first:mt-0',
          hasHighlight
        };
      }
      
      if (line.startsWith('- ')) {
        const content = line.substring(2);
        const hasHighlight = content.includes(HIGHLIGHT_START_MARKER);
        return {
          type: 'li',
          key,
          content: hasHighlight ? content.split(new RegExp(`(${escapeRegExp(HIGHLIGHT_START_MARKER)}.*?${escapeRegExp(HIGHLIGHT_END_MARKER)})`)) : content,
          className: 'flex items-start mt-1 ml-2',
          hasHighlight
        };
      }
      
      if (line.includes('**') || line.includes(HIGHLIGHT_START_MARKER)) {
        let parts: string[] = [];
        let hasHighlight = false;
        let hasBold = false;
        
        if (line.includes(HIGHLIGHT_START_MARKER)) {
          // Handle highlighting first
          parts = line.split(new RegExp(`(${escapeRegExp(HIGHLIGHT_START_MARKER)}.*?${escapeRegExp(HIGHLIGHT_END_MARKER)})`));
          hasHighlight = true;
        } else if (line.includes('**')) {
          // Handle bold formatting
          parts = line.split('**');
          hasBold = true;
        }
        
        return {
          type: 'p',
          key,
          content: parts,
          className: 'mt-1',
          hasBold,
          hasHighlight
        };
      }
      
      if (line.trim() === '') {
        return {
          type: 'br',
          key,
          content: '',
          className: ''
        };
      }
      
      return {
        type: 'p',
        key,
        content: line,
        className: 'mt-1'
      };
    });
}

export function renderMarkdownLine(item: MarkdownItem): ReactElement | null {
  const { type, key, content, className, hasBold, hasHighlight } = item;
  
  // Helper function to render content with highlighting
  const renderContentWithHighlight = (content: string | string[], hasHighlight?: boolean) => {
    if (hasHighlight && Array.isArray(content)) {
      return content.map((part: string, i: number) => {
        if (part.includes(HIGHLIGHT_START_MARKER)) {
          const cleanText = part.replace(HIGHLIGHT_START_MARKER, '').replace(HIGHLIGHT_END_MARKER, '');
          return (
            <mark 
              key={i} 
              className="bg-yellow-200 px-1 rounded text-gray-900 font-medium scroll-target"
              data-testid="highlighted-text"
            >
              {cleanText}
            </mark>
          );
        }
        return part;
      });
    }
    return content;
  };

  switch (type) {
    case 'h3':
      return <h3 key={key} className={className}>{renderContentWithHighlight(content, hasHighlight)}</h3>;
    case 'h4':
      return <h4 key={key} className={className}>{renderContentWithHighlight(content, hasHighlight)}</h4>;
    case 'li':
      return (
        <div key={key} className={className}>
          <span className="text-blue-500 mr-2 mt-1">•</span>
          <span>{renderContentWithHighlight(content, hasHighlight)}</span>
        </div>
      );
    case 'p':
      if ((hasBold || hasHighlight) && Array.isArray(content)) {
        return (
          <p key={key} className={className}>
            {content.map((part: string, i: number) => {
              // Handle highlighting
              if (hasHighlight && part.includes(HIGHLIGHT_START_MARKER)) {
                const cleanText = part.replace(HIGHLIGHT_START_MARKER, '').replace(HIGHLIGHT_END_MARKER, '');
                return (
                  <mark 
                    key={i} 
                    className="bg-yellow-200 px-1 rounded text-gray-900 font-medium scroll-target"
                    data-testid="highlighted-text"
                  >
                    {cleanText}
                  </mark>
                );
              }
              // Handle bold formatting
              if (hasBold && i % 2 === 1) {
                return <strong key={i} className="font-semibold text-gray-800">{part}</strong>;
              }
              return part;
            })}
          </p>
        );
      }
      return <p key={key} className={className}>{content}</p>;
    case 'br':
      return <br key={key} />;
    default:
      return null;
  }
}