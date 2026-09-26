'use client'

import { type ComponentType, createContext, type ReactNode, useContext } from 'react'

export type LinkLikeProps = {
  href: string
  className?: string
  style?: React.CSSProperties
  children?: ReactNode
  'aria-label'?: string
  'aria-current'?: 'page' | undefined
  onClick?: () => void
}

function PlainAnchor(props: LinkLikeProps) {
  return <a {...props} />
}

const LinkContext = createContext<ComponentType<LinkLikeProps>>(PlainAnchor)

/** Lets the app hand its router link (next/link) to design-system components. */
export function UiLinkProvider({
  link,
  children,
}: {
  link: ComponentType<LinkLikeProps>
  children: ReactNode
}) {
  return <LinkContext.Provider value={link}>{children}</LinkContext.Provider>
}

export function UiLink(props: LinkLikeProps) {
  const Link = useContext(LinkContext)
  return <Link {...props} />
}

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')
