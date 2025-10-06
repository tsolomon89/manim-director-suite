/**
 * Markdown renderer with syntax highlighting and GitHub-style formatting
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import './MarkdownRenderer.css';

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom rendering for code blocks
          code: ({ inline, className, children, ...props }: any) => {
            return !inline ? (
              <div className="code-block-wrapper">
                <pre className={className}>
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          },
          // Add anchor links to headings
          h1: ({ children, ...props }) => (
            <h1 id={String(children).toLowerCase().replace(/\s+/g, '-')} {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 id={String(children).toLowerCase().replace(/\s+/g, '-')} {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 id={String(children).toLowerCase().replace(/\s+/g, '-')} {...props}>
              {children}
            </h3>
          ),
          // Style tables
          table: ({ children, ...props }) => (
            <div className="table-wrapper">
              <table {...props}>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
