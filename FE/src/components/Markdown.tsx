import { memo, useRef, type ComponentPropsWithoutRef } from 'react'
import ReactMarkdown, { type Components, type ExtraProps } from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { CopyButton } from './CopyButton'
import './Markdown.css'

function CodeBlock({ node, children, ...rest }: ComponentPropsWithoutRef<'pre'> & ExtraProps) {
  const preRef = useRef<HTMLPreElement>(null)
  const code = node?.children[0]
  const classes = code?.type === 'element' ? code.properties.className : undefined
  const language = Array.isArray(classes)
    ? classes.map(String).find((name) => name.startsWith('language-'))?.slice('language-'.length)
    : undefined

  return (
    <div className="code-block">
      <div className="code-block__bar">
        <span className="code-block__lang">{language ?? 'code'}</span>
        <CopyButton getText={() => preRef.current?.innerText ?? ''} label="Copia codice" showLabel />
      </div>
      <pre ref={preRef} {...rest}>
        {children}
      </pre>
    </div>
  )
}

function Table({ node, ...rest }: ComponentPropsWithoutRef<'table'> & ExtraProps) {
  return (
    <div className="table-wrap">
      <table {...rest} />
    </div>
  )
}

function Link({ node, ...rest }: ComponentPropsWithoutRef<'a'> & ExtraProps) {
  return <a {...rest} target="_blank" rel="noopener noreferrer" />
}

const components: Components = { pre: CodeBlock, table: Table, a: Link }

/** Renders agent answers. Raw HTML is not rendered, so model output cannot inject markup. */
export const Markdown = memo(function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={components}>
      {content}
    </ReactMarkdown>
  )
})
